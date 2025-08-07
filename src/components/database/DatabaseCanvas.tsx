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
  Panel,
  NodeTypes,
  NodeProps,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '@/contexts/ThemeContext';
import { DatabaseTable, DataType } from '@/types/database';
import { DatabaseTableNode } from './DatabaseTableNode';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Get an emoji for a keyword
 * @param keyword - The keyword to find an emoji for
 * @returns The corresponding emoji or empty string if not found
 */
const getEmojiForKeyword = (keyword: string): string => {
  const emojiMap: Record<string, string> = {
    'star': '⭐',
    'fire': '🔥',
    'warning': '⚠️',
    'idea': '💡',
    'note': '📝',
    'important': '❗',
    'question': '❓',
    'ok': '✅',
    'heart': '❤️',
    'smile': '😊',
    'rocket': '🚀',
    'eyes': '👀',
    'thumbsup': '👍',
    'bug': '🐛',
    'code': '💻',
    'database': '🗄️'
  };
  return keyword ? emojiMap[keyword.toLowerCase()] || '' : '';
};
// Fallback implementation in case import fails
// const getEmojiForKeyword = (keyword: string): string => {
//   const keywords: Record<string, string> = {
//     'star': '⭐',
//     'fire': '🔥',
//     'warning': '⚠️',
//     'idea': '💡',
//     'note': '📝',
//     'important': '❗',
//     'question': '❓',
//     'ok': '✅',
//     'heart': '❤️',
//     'smile': '😊',
//     'rocket': '🚀',
//     'eyes': '👀',
//     'thumbsup': '👍',
//     'bug': '🐛',
//     'code': '💻',
//     'database': '🗄️'
//   };
//   return keywords[keyword.toLowerCase()] || '';
// };
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Sticker, Hash, Upload, HelpCircle } from 'lucide-react';
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

interface DatabaseTableNodeProps {
  data: {
    table: DatabaseTable;
    selected: boolean;
    onDeleteTable?: (tableId: string) => void;
    onEditTable?: (tableId: string, data: Partial<DatabaseTable>) => void;
    onEditField?: (tableId: string, fieldId: string, fieldData: Partial<any>) => void;
    onDeleteField?: (tableId: string, fieldId: string) => void;
    onAddField?: (tableId: string, field?: any) => void;
    onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
    onNavigateToElement?: (elementType: string, elementId: string) => void;
  };
}

const nodeTypes: NodeTypes = {
  databaseTable: DatabaseTableNode,
};

const emojiKeywords = [
  { keyword: 'star', emoji: '⭐' },
  { keyword: 'fire', emoji: '🔥' },
  { keyword: 'warning', emoji: '⚠️' },
  { keyword: 'idea', emoji: '💡' },
  { keyword: 'note', emoji: '📝' },
  { keyword: 'important', emoji: '❗' },
  { keyword: 'question', emoji: '❓' },
  { keyword: 'ok', emoji: '✅' },
  { keyword: 'heart', emoji: '❤️' },
  { keyword: 'smile', emoji: '😊' },
  { keyword: 'rocket', emoji: '🚀' },
  { keyword: 'eyes', emoji: '👀' },
  { keyword: 'thumbsup', emoji: '👍' },
  { keyword: 'bug', emoji: '🐛' },
  { keyword: 'code', emoji: '💻' },
  { keyword: 'database', emoji: '🗄️' },
];



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


  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
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
            // Create a more prominent edge for foreign keys
            fkEdges.push({
              id: `fk-${sourceTableId}-${field.id}-${targetTableId}`,
              source: sourceTableId,
              target: targetTableId,
              // Use bezier curve for smoother visualization
              type: 'default',
              animated: true,
              // Make the lines more visible with enhanced styling
              style: { 
                stroke: 'hsl(var(--primary))', 
                strokeWidth: 3,
                strokeOpacity: 0.8,
                // Remove dash array for solid lines
              },
              // Make the label more descriptive
              label: `${field.name} → ${field.foreignKey.field}`,
              labelShowBg: true,
              labelStyle: { 
                fill: 'hsl(var(--primary))', 
                fontSize: 12,
                fontWeight: 600
              },
              labelBgStyle: { 
                fill: 'hsl(var(--background))', 
                fillOpacity: 0.9,
                // Remove rx property as it's not supported in this type
                // Add border radius through other means if needed
              },
              // Add arrow markers for clearer direction
              markerEnd: {
                type: MarkerType.Arrow, // Using proper MarkerType enum
                width: 20,
                height: 20,
                color: 'hsl(var(--primary))',
                strokeWidth: 2
              },
            });
          }
        }
      });
    });
    
    return fkEdges;
  };

  // Legacy tableNodes code removed - now handled by useMemo below

  // Note: useEffect moved after handler functions are declared

  // Track if a node is being dragged
  const [isDragging, setIsDragging] = useState(false);
  const lastPositionsRef = useRef<Record<string, { x: number, y: number }>>({});
  
  // Handle node position and size changes to update table positions and dimensions
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Check for position, drag start/end, and dimension changes
    const dragStartChanges = changes.filter(change => change.type === 'position' && change.dragging === true);
    const dragEndChanges = changes.filter(change => change.type === 'position' && change.dragging === false);
    const dimensionChanges = changes.filter(change => change.type === 'dimensions');
    
    // Track drag start
    if (dragStartChanges.length > 0) {
      setIsDragging(true);
      
      // Save current positions when drag starts
      tablesRef.current.forEach(table => {
        lastPositionsRef.current[table.id] = { ...table.position };
      });
    }
    
    // Handle dimension changes (resizing nodes)
    if (dimensionChanges.length > 0 && setTables) {
      let hasRealChanges = false;
      
      const updatedTables = tablesRef.current.map(table => {
        const sizeChange = dimensionChanges.find(change => change.id === table.id);
        if (sizeChange && sizeChange.dimensions) {
          // Only update if dimensions actually changed
          const currentWidth = table.width || 0;
          const currentHeight = table.height || 0;
          const newWidth = sizeChange.dimensions.width;
          const newHeight = sizeChange.dimensions.height;
          
          if (Math.abs(currentWidth - newWidth) > 1 || Math.abs(currentHeight - newHeight) > 1) {
            hasRealChanges = true;
            return {
              ...table,
              width: newWidth,
              height: newHeight
            };
          }
        }
        return table;
      });
      
      // Only update and save if real changes were detected
      if (hasRealChanges) {
        setTables(updatedTables);
        onSave?.(updatedTables);
      }
    }
    
    // Process drag end and update tables only when the drag is finished
    if (dragEndChanges.length > 0 && isDragging && setTables) {
      setIsDragging(false);
      
      const updatedTables = tablesRef.current.map(table => {
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
        onSave?.(updatedTables);
      }
    }
  }, [onNodesChange, setTables, onSave, isDragging]);

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
  
  // Use ref to access current tables without causing re-renders
  const tablesRef = useRef(tables);
  tablesRef.current = tables;

  // Memoize callback functions to prevent infinite re-renders - remove tables from dependencies
  const handleEditTable = useCallback((updatedTable: DatabaseTable) => {
    console.log('🔄 Updating table:', updatedTable.name);
    const updatedTables = tablesRef.current.map(t => t.id === updatedTable.id ? updatedTable : t);
    setTables?.(updatedTables);
  }, [setTables]);

  const handleEditField = useCallback((field: any) => {
    console.log('Edit field:', field);
    const fieldTable = tablesRef.current.find(t => t.fields.some(f => f.id === field.id));
    if (fieldTable) {
      setSelectedTable?.(fieldTable);
      onEditField?.(fieldTable.id, field.id, field);
    }
  }, [setSelectedTable, onEditField]);

  const handleDeleteField = useCallback((tableId: string, fieldId: string) => {
    const updatedTables = tablesRef.current.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          fields: t.fields.filter(f => f.id !== fieldId)
        };
      }
      return t;
    });
    setTables?.(updatedTables);
  }, [setTables]);

  const handleAddField = useCallback((tableId: string) => {
    console.log('➕ Adding field to table:', tableId);
    const updatedTables = tablesRef.current.map(t => {
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
        return {
          ...t,
          fields: [...t.fields, newField]
        };
      }
      return t;
    });
    setTables?.(updatedTables);
  }, [setTables]);

  // Generate table nodes - use useMemo to prevent unnecessary recalculations
  const tableNodes = useMemo(() => {
    return tables.map(table => ({
      id: table.id,
      type: 'databaseTable',
      position: table.position,
      style: {
        width: table.width,
        height: table.height,
        '--node-handle-color': theme === 'dark' ? '#ffffff' : '#000000',
      },
      data: {
        table,
        allTables: tables,
        selected: selectedTable?.id === table.id,
        onEditTable: handleEditTable,
        onEditField: handleEditField,
        onDeleteField: handleDeleteField,
        onAddField: handleAddField,
        onDeleteTable,
        onAddComment,
        onNavigateToElement
      },
      dragHandle: '.table-drag-handle'
    }));
  }, [tables, selectedTable, theme, handleEditTable, handleEditField, handleDeleteField, handleAddField, onDeleteTable, onAddComment, onNavigateToElement]);

  // Update nodes and edges only when tables actually change
  React.useEffect(() => {
    setNodes(tableNodes);
  }, [tableNodes]);

  // Update edges when tables change
  React.useEffect(() => {
    setEdges(generateForeignKeyEdges(tables));
  }, [tables, setEdges]);

  return (
    <div 
      ref={reactFlowWrapperRef}
      className={`h-full w-full bg-gradient-to-br from-white to-gray-200 dark:from-gray-900 dark:to-black ${themeClass}`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        connectionMode={ConnectionMode.Loose}
        selectNodesOnDrag={true}
        elevateEdgesOnSelect={true}
        onNodeClick={(e, node) => onNodeClick(e, node)}
        style={{ background: 'transparent' }}
        noDragClassName="nodrag"
        nodesDraggable={true}
        // Enable drag handle functionality for better control
        draggable={true}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true
        }}
        // The dragHandle functionality will be handled by the data-draghandle attribute
        // in each node component instead of here
      >
        <Background 
          color="hsl(var(--border))" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-card/80 text-black border border-border/50 rounded-lg shadow-lg backdrop-blur-sm hover:border-blue-500/50 active:border-blue-500/80"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}


