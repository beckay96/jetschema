import { useCallback, useState } from 'react';
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
import { DatabaseTable } from '@/types/database';
import { DatabaseTableNode } from './DatabaseTableNode';

interface DatabaseCanvasProps {
  tables: DatabaseTable[];
  onTableUpdate?: (tables: DatabaseTable[]) => void;
  onTableSelect?: (table: DatabaseTable | null) => void;
  selectedTable?: DatabaseTable | null;
}

const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

export function DatabaseCanvas({ 
  tables, 
  onTableUpdate, 
  onTableSelect,
  selectedTable 
}: DatabaseCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert tables to nodes
  const tableNodes: Node[] = tables.map(table => ({
    id: table.id,
    type: 'databaseTable',
    position: table.position,
    data: {
      table,
      selected: selectedTable?.id === table.id,
      onEditTable: (updatedTable: DatabaseTable) => {
        // Handle table editing
        console.log('Edit table:', updatedTable);
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
        // Handle adding new field
        console.log('Add field to table:', tableId);
      }
    },
    dragHandle: '.table-drag-handle'
  }));

  // Update nodes when tables change
  useState(() => {
    setNodes(tableNodes);
  });

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
        nodes={tableNodes}
        edges={edges}
        onNodesChange={onNodesChange}
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