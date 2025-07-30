import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  ConnectionMode,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '@/contexts/ThemeContext';
import { DatabaseTable, DataType } from '@/types/database';
import { DatabaseTableNode } from './DatabaseTableNode';
import './DatabaseCanvas.css';

interface DatabaseCanvasProps {
  tables: DatabaseTable[];
  setTables?: (tables: DatabaseTable[]) => void;
  selectedTable?: DatabaseTable | null;
  setSelectedTable?: (table: DatabaseTable | null) => void;
  onAddTable?: () => void;
  onDeleteTable?: (tableId: string) => void;
  onEditTable?: (tableId: string, data: Partial<DatabaseTable>) => void;
  onEditField?: (tableId: string, fieldId: string, fieldData: Partial<any>) => void;
  onDeleteField?: (tableId: string, fieldId: string) => void;
  onAddField?: (tableId: string, field?: any) => void;
  onSave?: (tables: DatabaseTable[]) => void;
  onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
  onMarkAsTask?: (elementType: 'table' | 'field', elementId: string, elementName: string, priority: 'low' | 'medium' | 'high') => void;
  onNavigateToElement?: (elementType: string, elementId: string) => void;
}

const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

export function DatabaseCanvas({ 
  tables, 
  setTables,
  selectedTable,
  setSelectedTable,
  onAddTable,
  onDeleteTable,
  onEditTable,
  onEditField,
  onDeleteField,
  onAddField,
  onSave,
  onAddComment,
  onMarkAsTask,
  onNavigateToElement
}: DatabaseCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { theme } = useTheme();

  // Generate foreign key edges between tables
  const generateForeignKeyEdges = (tables: DatabaseTable[]): Edge[] => {
    const fkEdges: Edge[] = [];
    
    tables.forEach(table => {
      table.fields.forEach(field => {
        if (field.foreignKey) {
          const sourceTableId = table.id;
          const targetTableId = tables.find(t => t.name === field.foreignKey?.table)?.id;
          
          if (targetTableId) {
            fkEdges.push({
              id: `fk-${sourceTableId}-${field.id}-${targetTableId}`,
              source: sourceTableId,
              target: targetTableId,
              type: 'smoothstep',
              animated: true,
              style: { 
                stroke: 'hsl(var(--status-foreign-key))', 
                strokeWidth: 2,
                strokeDasharray: '5,5'
              },
              label: `${field.name} → ${field.foreignKey.field}`,
              labelStyle: { 
                fill: 'hsl(var(--foreground))', 
                fontSize: 12,
                fontWeight: 500
              },
              labelBgStyle: { 
                fill: 'hsl(var(--background))', 
                fillOpacity: 0.9 
              }
            });
          }
        }
      });
    });
    
    return fkEdges;
  };

  // Convert tables to nodes
  const tableNodes: Node[] = tables.map(table => ({
    id: table.id,
    type: 'databaseTable',
    position: table.position,
    data: {
      table,
      allTables: tables,
      selected: selectedTable?.id === table.id,
      onEditTable: (updatedTable: DatabaseTable) => {
        console.log('🔄 Updating table:', updatedTable.name);
        // Handle table editing
        const updatedTables = tables.map(t => t.id === updatedTable.id ? updatedTable : t);
        setTables?.(updatedTables);
      },
      onEditField: (field: any) => {
        // Handle field editing
        console.log('Edit field:', field);
      },
      onDeleteField: (tableId: string, fieldId: string) => {
        // Handle field deletion
        const updatedTables = tables.map(t => {
          if (t.id === tableId) {
            return {
              ...t,
              fields: t.fields.filter(f => f.id !== fieldId)
            };
          }
          return t;
        });
        setTables?.(updatedTables);
      },
      onAddField: (tableId: string) => {
        console.log('➕ Adding field to table:', tableId);
        // Handle adding new field
        const updatedTables = tables.map(t => {
          if (t.id === tableId) {
            const newField = {
              id: `field-${Date.now()}`,
              name: `new_field_${t.fields.length + 1}`,
              type: 'VARCHAR' as DataType,
              nullable: true,
              primaryKey: false,
              unique: false,
              foreignKey: null,
              defaultValue: null,
              comment: null
            };
            console.log('📝 New field created:', newField.name, 'for table:', t.name);
            return {
              ...t,
              fields: [...t.fields, newField]
            };
          }
          return t;
        });
        setTables?.(updatedTables);
      },
      onAddComment: onAddComment
    },
    dragHandle: '.table-drag-handle'
  }));

  // Update nodes when tables change or theme changes
  React.useEffect(() => {
    const updatedNodes = tableNodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        '--node-handle-color': theme === 'dark' ? '#ffffff' : '#000000',
      },
    }));
    setNodes(updatedNodes);
    setEdges(generateForeignKeyEdges(tables));
  }, [tables, selectedTable, setNodes, setEdges, theme]);

  // Track if a node is being dragged
  const [isDragging, setIsDragging] = useState(false);
  const lastPositionsRef = useRef<Record<string, { x: number, y: number }>>({});
  
  // Handle node position changes to update table positions
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Check for drag start and end
    const dragStartChanges = changes.filter(change => change.type === 'position' && change.dragging === true);
    const dragEndChanges = changes.filter(change => change.type === 'position' && change.dragging === false);
    
    // Track drag start
    if (dragStartChanges.length > 0) {
      setIsDragging(true);
      
      // Save current positions when drag starts
      tables.forEach(table => {
        lastPositionsRef.current[table.id] = { ...table.position };
      });
    }
    
    // Process drag end and update tables only when the drag is finished
    if (dragEndChanges.length > 0 && isDragging && setTables) {
      setIsDragging(false);
      
      const updatedTables = tables.map(table => {
        const positionChange = dragEndChanges.find(change => change.id === table.id);
        if (positionChange) {
          return {
            ...table,
            position: positionChange.position
          };
        }
        return table;
      });
      
      // Only update if positions actually changed
      const hasPositionChanges = updatedTables.some(table => {
        const lastPos = lastPositionsRef.current[table.id];
        return !lastPos || lastPos.x !== table.position.x || lastPos.y !== table.position.y;
      });
      
      if (hasPositionChanges) {
        setTables(updatedTables);
        
        // Also call onSave if provided, for auto-save functionality
        onSave?.(updatedTables);
      }
    }
  }, [onNodesChange, tables, setTables, onSave, isDragging]);

  const onConnect = useCallback(
    (params: any) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--primary))' }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    []
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const table = tables.find(t => t.id === node.id);
      setSelectedTable?.(table || null);
    },
    [tables, setSelectedTable]
  );

  const onPaneClick = useCallback(() => {
    setSelectedTable?.(null);
  }, [setSelectedTable]);

  // Apply theme class to the container
  const themeClass = theme === 'dark' ? 'dark' : 'light';
  
  return (
    <div className={`h-full w-full bg-gradient-to-br from-white to-gray-200 dark:from-gray-900 dark:to-black ${themeClass}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        connectionMode={ConnectionMode.Loose}
        selectNodesOnDrag={false}
        elevateEdgesOnSelect={true}
        onNodeClick={(e, node) => onNodeClick(e, node)}
        style={{ background: 'transparent' }}
        noDragClassName="nodrag"
        nodesDraggable={true}
        // The dragHandle functionality will be handled by the data-draghandle attribute
        // in each node component instead of here
      >
        <Background 
          color="hsl(var(--border))" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-card/80 dark:bg-black/80 text-black dark:text-white border border-border/50 rounded-lg shadow-lg backdrop-blur-sm hover:border-blue-500/50 active:border-blue-500/80"
          showInteractive={true}
        />
      </ReactFlow>
    </div>
  );
}


