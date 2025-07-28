import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  ConnectionMode,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DatabaseTable, DataType } from '@/types/database';
import { DatabaseTableNode } from './DatabaseTableNode';

interface DatabaseCanvasProps {
  tables: DatabaseTable[];
  onTableUpdate?: (tables: DatabaseTable[]) => void;
  onTableSelect?: (table: DatabaseTable | null) => void;
  onAddComment?: (tableName: string, fieldName: string) => void;
  selectedTable?: DatabaseTable | null;
}

const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

export function DatabaseCanvas({ 
  tables, 
  onTableUpdate, 
  onTableSelect,
  onAddComment,
  selectedTable 
}: DatabaseCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
        onTableUpdate?.(updatedTables);
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
        onTableUpdate?.(updatedTables);
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
        onTableUpdate?.(updatedTables);
      },
      onAddComment: onAddComment
    },
    dragHandle: '.table-drag-handle'
  }));

  // Update nodes when tables change
  React.useEffect(() => {
    setNodes(tableNodes);
    setEdges(generateForeignKeyEdges(tables));
  }, [tables, selectedTable, setNodes, setEdges]);

  // Handle node position changes to update table positions
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Update table positions when nodes are moved
    const positionChanges = changes.filter(change => change.type === 'position' && change.position);
    if (positionChanges.length > 0 && onTableUpdate) {
      const updatedTables = tables.map(table => {
        const positionChange = positionChanges.find(change => change.id === table.id);
        if (positionChange) {
          return {
            ...table,
            position: positionChange.position
          };
        }
        return table;
      });
      onTableUpdate(updatedTables);
    }
  }, [onNodesChange, tables, onTableUpdate]);

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
      onTableSelect?.(table || null);
    },
    [tables, onTableSelect]
  );

  const onPaneClick = useCallback(() => {
    onTableSelect?.(null);
  }, [onTableSelect]);

  return (
    <div className="h-full w-full bg-gradient-to-br from-db-canvas to-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-transparent"
        style={{ background: 'transparent' }}
      >
        <Background 
          color="hsl(var(--border))" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-card border border-border rounded-lg shadow-lg"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}