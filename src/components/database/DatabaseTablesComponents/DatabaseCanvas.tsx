import React, { useCallback, useMemo, useState, useRef, useEffect, useTransition } from 'react';
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
  MarkerType,
  ReactFlowProvider,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '@/contexts/ThemeContext';
import { DatabaseTable, DataType, DatabaseField } from '@/types/database';
import { DataTypePill } from '@/components/Settings/DataTypePill';

/**
 * Validate that all edges reference existing nodes and normalize ID types.
 * Edges whose source or target is missing are dropped and logged. This
 * prevents invalid edges from crashing the diagram.
 */
function validateGraph(nodes: Node[] = [], edges: Edge[] = []): Edge[] {
  // Convert node IDs to strings to ensure consistent comparisons
  const nodeIds = new Set(nodes.map(n => String(n.id)));
  const valid: Edge[] = [];
  const dropped: Edge[] = [];
  edges.forEach((e, idx) => {
    const source = String(e.source);
    const target = String(e.target);
    // Only keep edges whose source and target both exist in the node set
    if (nodeIds.has(source) && nodeIds.has(target)) {
      const id = e.id ?? `e-${source}-${target}-${idx}`;
      valid.push({ ...e, id, source, target });
    } else {
      dropped.push(e);
    }
  });
  if (dropped.length) {
    console.warn('Dropped invalid edges:', dropped.map(e => e.id ?? `${e.source}->${e.target}`));
  }
  return valid;
}

/**
 * Normalise edge handle ids. React Flow throws Error 008 when an edge has
 * sourceHandle/targetHandle set to null, the string "null"/"undefined",
 * or an empty string. Removing those properties makes RF fall back to the
 * node's default port instead of crashing.
 */
function normalizeEdgeHandles(edges: Edge[] = []): Edge[] {
  const clean = (h?: string | null) =>
    h === null || h === undefined || h === '' || h === 'null' || h === 'undefined'
      ? undefined
      : String(h);

  return edges.map((e) => {
    const next: Edge = { ...e } as Edge;
    const sh = clean((e as any).sourceHandle);
    const th = clean((e as any).targetHandle);

    if (sh === undefined) delete (next as any).sourceHandle; else (next as any).sourceHandle = sh;
    if (th === undefined) delete (next as any).targetHandle; else (next as any).targetHandle = th;

    return next;
  });
}

// Emoji utility function (moved to top to avoid duplicates)
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
  onEditField?: (tableId: string, fieldId: string, fieldData: Partial<DatabaseField>) => void;
  onDeleteField?: (tableId: string, fieldId: string) => void;
  onAddField?: (tableId: string, field?: DatabaseField) => void;
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
    onEditField?: (tableId: string, fieldId: string, fieldData: Partial<DatabaseField>) => void;
    onDeleteField?: (tableId: string, fieldId: string) => void;
    onAddField?: (tableId: string, field?: DatabaseField) => void;
    onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
    onNavigateToElement?: (elementType: string, elementId: string) => void;
  };
}

// Define the DatabaseTableNode component
const DatabaseTableNode = React.memo(({ data }: DatabaseTableNodeProps) => {
  const { table, selected } = data;
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [fieldType, setFieldType] = useState<DataType>('VARCHAR');
  
  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    
    const newField: DatabaseField = {
      id: `field-${Date.now()}`,
      name: newFieldName.trim(),
      type: fieldType,
      nullable: true,
      primaryKey: false,
      unique: false,
      foreignKey: null,
      defaultValue: null,
      comment: null
    };
    
    if (data.onAddField) {
      data.onAddField(table.id, newField);
    }
    
    setNewFieldName('');
    setFieldType('VARCHAR');
    setIsAddingField(false);
  };
  
  return (
    <div 
      className={`database-table ${selected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Default handles so edges can always attach */}
      <Handle type="target" position={Position.Left} id={`${table.id}-target`} />
      <Handle type="source" position={Position.Right} id={`${table.id}-source`} />
      <div className="table-header">
        <h3>{table.name}</h3>
      </div>
      <div className="table-fields">
        {table.fields?.map(field => (
          <div key={field.id} className="table-field">
            <span className="field-name">{field.name}</span>
            <DataTypePill type={field.type} size="sm" className="field-type" />
          </div>
        ))}
        
        {isAddingField ? (
          <div className="add-field-form">
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="Field name"
              className="field-input"
              autoFocus
            />
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as DataType)}
              className="field-type-select"
            >
              <option value="VARCHAR">VARCHAR</option>
              <option value="INTEGER">INTEGER</option>
              <option value="BIGINT">BIGINT</option>
              <option value="BOOLEAN">BOOLEAN</option>
              <option value="UUID">UUID</option>
              <option value="DATE">DATE</option>
              <option value="TIME">TIME</option>
              <option value="TIMESTAMP">TIMESTAMP</option>
              <option value="TIMESTAMPTZ">TIMESTAMPTZ</option>
              <option value="TEXT">TEXT</option>
              <option value="JSONB">JSONB</option>
              <option value="JSON">JSON</option>
              <option value="ARRAY">ARRAY</option>
              <option value="DECIMAL">DECIMAL</option>
              <option value="FLOAT">FLOAT</option>
            </select>
            <button onClick={handleAddField}>Add</button>
            <button onClick={() => setIsAddingField(false)}>Cancel</button>
          </div>
        ) : (
          isHovered && data.onAddField && (
            <button 
              className="add-field-btn"
              onClick={() => setIsAddingField(true)}
            >
              + Add Field
            </button>
          )
        )}
      </div>
    </div>
  );
});

// Set display name for debugging
DatabaseTableNode.displayName = 'DatabaseTableNode';

const nodeTypes = {
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

// Add error boundary for the canvas
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in DatabaseCanvas:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Something went wrong with the database diagram.</h3>
          <p>Please try refreshing the page. If the problem persists, contact support.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  // State management
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const prevFkSignature = useRef<string>('');
  const [isPending, startTransition] = useTransition();
  
  // Validate edges whenever nodes or edges change to prevent crashes
  const safeEdges = useMemo(() => {
    console.log('Validating edges:', { nodeCount: nodes.length, edgeCount: edges.length });
    const validatedEdges = validateGraph(nodes, edges);
    const cleaned = normalizeEdgeHandles(validatedEdges);
    console.log('Validation result:', { validEdgeCount: cleaned.length });
    return cleaned;
  }, [nodes, edges]);

  useEffect(() => {
    const cleaned = edges.filter((e: any) => e?.sourceHandle == null || e?.sourceHandle === 'null' || e?.targetHandle == null || e?.targetHandle === 'null');
    if (cleaned.length) {
      console.warn('Normalised edge handles for', cleaned.map((e: any) => e.id));
    }
  }, [edges]);

  // Generate foreign key edges between tables
  const generateForeignKeyEdges = useCallback((tables: DatabaseTable[]): Edge[] => {
    const fkEdges: Edge[] = [];
    
    tables.forEach(table => {
      table.fields.forEach(field => {
        if (field.foreignKey) {
          const sourceTableId = table.id;
          const targetTableId = tables.find(t => t.name === field.foreignKey?.table)?.id;
          
          // Validate both source and target tables exist before creating edge
          if (sourceTableId && targetTableId) {
            fkEdges.push({
              id: `fk-${sourceTableId}-${field.id}-${targetTableId}`,
              source: sourceTableId,
              target: targetTableId,
              sourceHandle: `${sourceTableId}-source`,
              targetHandle: `${targetTableId}-target`,
              type: 'default',
              animated: true,
              style: {
                stroke: 'hsl(var(--primary))',
                strokeWidth: 3,
                strokeOpacity: 0.8,
              },
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
              },
              markerEnd: {
                type: MarkerType.Arrow,
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
  }, [tables]);

  // Memoize the foreign key edges to prevent unnecessary recalculations
  const foreignKeyEdges = useMemo(() => {
    try {
      return generateForeignKeyEdges(tables);
    } catch (err) {
      console.error('Error generating foreign key edges:', err);
      setError('Failed to generate database relationships. Some connections may not be displayed.');
      return [];
    }
  }, [tables, generateForeignKeyEdges]);
  
  // Memoize the table nodes to prevent unnecessary recalculations
  const tableNodes = useMemo(() => {
    if (!tables || tables.length === 0) return [];
    
    return tables.map(table => {
      const isSelected = selectedTable?.id === table.id;
      
      return {
        id: table.id,
        type: 'databaseTable' as const,
        position: table.position || { x: 0, y: 0 },
        data: {
          table,
          selected: isSelected,
          onDeleteTable,
          onEditTable,
          onEditField,
          onDeleteField,
          onAddField,
          onAddComment,
          onNavigateToElement
        },
        width: table.width || 250,
        height: 100 + ((table.fields?.length || 0) * 30) || 130
      };
    });
  }, [tables, selectedTable, onDeleteTable, onEditTable, onEditField, onDeleteField, onAddField, onAddComment, onNavigateToElement]);

  // Note: useEffect moved after handler functions are declared

  // Track if a node is being dragged
  const [isDragging, setIsDragging] = useState(false);
  const lastPositionsRef = useRef<Record<string, { x: number, y: number }>>({});
  
  // Initialize the canvas when component mounts
  useEffect(() => {
    setIsMounted(true);
    
    // Load initial data
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        // Any async initialization can go here
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing database canvas:', err);
        setError('Failed to load database schema. Please refresh the page.');
        setIsLoading(false);
      }
    };
    
    loadInitialData();
    
    return () => {
      // Cleanup function
      setIsMounted(false);
    };
  }, []);
  
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
        setTables?.(updatedTables);
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
        setTables?.(updatedTables);
        onSave?.(updatedTables);
      }
    }
  }, [onNodesChange, setTables, onSave, isDragging]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Validate source and target handles exist before creating edge
      if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) {
        console.warn('Invalid edge connection: missing source or target handles', params);
        return; // Don't create invalid edges
      }

      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--primary))' }
      };
      
      // Check for duplicates to prevent infinite loop
      setEdges((eds) => {
        const duplicateEdge = eds.find(
          edge => edge.source === params.source && 
                edge.target === params.target && 
                edge.sourceHandle === params.sourceHandle && 
                edge.targetHandle === params.targetHandle
        );
        
        if (duplicateEdge) {
          console.warn('Duplicate edge prevented', params);
          return eds; // Don't add duplicate edges
        }
        
        return addEdge(newEdge, eds);
      });
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

  const handleEditField = useCallback((field: DatabaseField) => {
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

  // Update nodes when tables or foreignKeyEdges change
  useEffect(() => {
    if (!isMounted) return;
    
    startTransition(() => {
      // Recreate nodes array from current tables
      const updatedNodes = tables.map(table => ({
        id: table.id,
        type: 'databaseTable' as const,
        position: table.position || { x: 0, y: 0 },
        data: {
          table,
          selected: selectedTable?.id === table.id,
          onDeleteTable,
          onEditTable,
          onEditField,
          onDeleteField,
          onAddField,
          onAddComment,
          onNavigateToElement
        },
        width: table.width || 250,
        height: 100 + ((table.fields?.length || 0) * 30) || 130
      }));
      
      setNodes(updatedNodes);
      setEdges(foreignKeyEdges);
    });
  }, [tables, foreignKeyEdges, isMounted, setNodes, setEdges, selectedTable, onDeleteTable, onEditTable, onEditField, onDeleteField, onAddField, onAddComment, onNavigateToElement]);

  // Initialize component mount state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="database-canvas loading">
        <div className="loading-spinner">Loading database schema...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="database-canvas error">
        <div className="error-message">
          <h3>Error Loading Database Schema</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="database-canvas" ref={reactFlowWrapperRef}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={safeEdges} /* Use validated edges to prevent crashes */
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={{ databaseTable: DatabaseTableNode as any }}
            fitView
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={[0, 1, 2]}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            panOnScroll={false}
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            onNodeClick={(event, node) => {
              if (setSelectedTable) {
                const table = tables.find(t => t.id === node.id);
                if (table) {
                  setSelectedTable(table);
                }
              }
            }}
            onPaneClick={() => {
              if (setSelectedTable) {
                setSelectedTable(null);
              }
            }}
            onError={(code: string, message: string) => {
              console.error('ReactFlow Error:', code, message);
              setError(`Diagram error: ${message}. Please try refreshing the page.`);
            }}
          >
            <Background />
            <Controls />
            {/* MiniMap is optional and can be added back if needed */}
            {/* <MiniMap /> */}
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </ErrorBoundary>
  );
}


