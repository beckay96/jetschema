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
import { DiagramSticker, StickerData } from './DiagramSticker';
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
  // Add stickers properties (optional to maintain backward compatibility)
  stickers?: StickerData[];
  onSaveStickers?: (stickers: StickerData[]) => void;
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
    onMarkAsTask?: (elementType: 'table' | 'field', elementId: string, elementName: string, priority: 'low' | 'medium' | 'high') => void;
    onNavigateToElement?: (elementType: string, elementId: string) => void;
  };
}

// We'll remove this interface as it's not needed anymore

// Type definition for sticker node data as passed to ReactFlow
interface StickerNodeData extends StickerData {
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, data: Partial<StickerData>) => void;
}

// Wrapped sticker component to adapt to ReactFlow's node props structure
const StickerNodeWrapper = (props: NodeProps) => {
  // Extract the node data and provide the required props to DiagramSticker
  const { id, data } = props;
  
  // Safely handle the data with type checking
  const isValidStickerData = data && 
    typeof data === 'object' &&
    'text' in data &&
    'position' in data &&
    'type' in data;
  
  // Fall back to empty data if invalid to prevent crashes
  const stickerData = isValidStickerData ? data : {
    id: id || 'fallback-id',
    text: 'Error',
    position: { x: 0, y: 0 },
    type: 'sticker' as const
  };
  
  // Create handler functions that access the handlers stored in the node data
  const handleDelete = useCallback((id: string) => {
    if (data && typeof data === 'object' && 'onDelete' in data && typeof data.onDelete === 'function') {
      data.onDelete(id);
    }
  }, [data]);
  
  const handleUpdate = useCallback((id: string, newData: Partial<StickerData>) => {
    if (data && typeof data === 'object' && 'onUpdate' in data && typeof data.onUpdate === 'function') {
      data.onUpdate(id, newData);
    }
  }, [data]);
  
  // Convert to StickerNodeData with proper typing
  const typedData: StickerData = {
    id: typeof stickerData.id === 'string' ? stickerData.id : id || 'fallback-id',
    text: typeof stickerData.text === 'string' ? stickerData.text : 'Error',
    position: stickerData.position && 
              typeof stickerData.position === 'object' && 
              'x' in stickerData.position && 
              'y' in stickerData.position ? 
              { x: Number(stickerData.position.x) || 0, y: Number(stickerData.position.y) || 0 } : 
              { x: 0, y: 0 },
    type: stickerData.type === 'tag' ? 'tag' : 'sticker',
    color: typeof stickerData.color === 'string' ? stickerData.color : undefined,
    rotation: typeof stickerData.rotation === 'number' ? stickerData.rotation : 0,
    size: ['small', 'medium', 'large'].includes(stickerData.size as string) ? 
      stickerData.size as 'small' | 'medium' | 'large' : undefined
  };
  
  return (
    <DiagramSticker 
      data={typedData} 
      onDelete={handleDelete} 
      onUpdate={handleUpdate} 
    />
  );
};

// Now the nodeTypes object matches ReactFlow's expected structure
const nodeTypes: NodeTypes = {
  databaseTable: DatabaseTableNode,
  sticker: StickerNodeWrapper,
};

// List of common emoji keywords for the help tooltip
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
  onNavigateToElement,
  stickers: initialStickers = [],
  onSaveStickers
}: DatabaseCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [stickers, setStickers] = useState<StickerData[]>(initialStickers);
  const [isAddingStickerMode, setIsAddingStickerMode] = useState(false);
  const [newStickerText, setNewStickerText] = useState('');
  const [previewColor, setPreviewColor] = useState('#FFD700'); // Default color - gold
  const [newStickerType, setNewStickerType] = useState<'sticker' | 'tag'>('sticker');
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

  // Convert tables to nodes
  const tableNodes: Node[] = tables.map(table => ({
    id: table.id,
    type: 'databaseTable',
    position: table.position,
    // Apply saved width and height if available
    style: {
      width: table.width,
      height: table.height
    },
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
      tables.forEach(table => {
        lastPositionsRef.current[table.id] = { ...table.position };
      });
    }
    
    // Handle dimension changes (resizing nodes)
    if (dimensionChanges.length > 0 && setTables) {
      console.log('Node resize detected:', dimensionChanges);
      let hasRealChanges = false;
      
      const updatedTables = tables.map(table => {
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
        // Auto-save size changes
        onSave?.(updatedTables);
      }
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
  
  // Handle adding sticker on canvas click when in sticker add mode
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (!isAddingStickerMode || !reactFlowWrapperRef.current) return;
    
    // Get click position relative to the ReactFlow container
    const reactFlowBounds = reactFlowWrapperRef.current.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top
    };
    
    // Create new sticker
    const newSticker: StickerData = {
      id: `sticker-${Date.now()}`,
      text: newStickerText || 'New Sticker',
      position,
      type: newStickerType,
      rotation: Math.floor(Math.random() * 20) - 10,
      size: 'medium'
    };
    
    // Add to stickers
    const updatedStickers = [...stickers, newSticker];
    setStickers(updatedStickers);
    
    // Save stickers if callback provided
    onSaveStickers?.(updatedStickers);
    
    // Reset sticker text and exit add mode
    setNewStickerText('');
    setIsAddingStickerMode(false);
    
    toast.success(`${newStickerType === 'tag' ? 'Tag' : 'Sticker'} added!`);
  }, [isAddingStickerMode, newStickerText, newStickerType, stickers, onSaveStickers]);
  
  // Handle sticker update (position, type, etc)
  const handleUpdateSticker = useCallback((id: string, data: Partial<StickerData>) => {
    const updatedStickers = stickers.map(sticker => 
      sticker.id === id ? { ...sticker, ...data } : sticker
    );
    setStickers(updatedStickers);
    onSaveStickers?.(updatedStickers);
  }, [stickers, onSaveStickers]);
  
  // Handle sticker deletion
  const handleDeleteSticker = useCallback((id: string) => {
    const updatedStickers = stickers.filter(sticker => sticker.id !== id);
    setStickers(updatedStickers);
    onSaveStickers?.(updatedStickers);
    toast.success('Sticker removed');
  }, [stickers, onSaveStickers]);

  // Update nodes when tables change or theme changes
  React.useEffect(() => {
    console.log('Tables changed, updating nodes:', tables.length);
    
    // Generate table nodes directly from tables instead of using tableNodes variable
    const updatedTableNodes = tables.map(table => ({
      id: table.id,
      type: 'databaseTable',
      position: table.position,
      // Apply saved width and height if available
      style: {
        width: table.width,
        height: table.height,
        '--node-handle-color': theme === 'dark' ? '#ffffff' : '#000000',
      },
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
          // Handle field editing - find the table and open edit modal
          console.log('Edit field:', field);
          const fieldTable = tables.find(t => t.fields.some(f => f.id === field.id));
          if (fieldTable) {
            setSelectedTable?.(fieldTable);
            // Call the parent onEditField callback if provided
            onEditField?.(fieldTable.id, field.id, field);
          }
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
    
    // Convert stickers to ReactFlow nodes
    const stickerNodes = stickers.map(sticker => ({
      id: sticker.id,
      type: 'sticker',
      position: sticker.position,
      data: {
        ...sticker,
        onDelete: handleDeleteSticker,
        onUpdate: handleUpdateSticker
      },
      draggable: true,
      selectable: true
    }));
    
    // Combine table nodes and sticker nodes
    setNodes([...updatedTableNodes, ...stickerNodes]);
    setEdges(generateForeignKeyEdges(tables));
  }, [tables, selectedTable, stickers, setNodes, setEdges, theme, handleDeleteSticker, handleUpdateSticker]);

  // Handle bulk import of stickers from JSON
  const handleImportStickers = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedStickers = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedStickers) && importedStickers.length > 0) {
          // Validate that imported data has required fields
          const validStickers = importedStickers.filter((sticker: any) => 
            sticker.id && sticker.text && sticker.position && sticker.type
          );
          
          if (validStickers.length !== importedStickers.length) {
            toast.warning(`Imported ${validStickers.length} valid stickers out of ${importedStickers.length}`);
          } else {
            toast.success(`Imported ${validStickers.length} stickers`);
          }
          
          const updatedStickers = [...stickers, ...validStickers];
          setStickers(updatedStickers);
          onSaveStickers?.(updatedStickers);
        } else {
          toast.error('No valid stickers found in file');
        }
      } catch (error) {
        toast.error('Failed to parse sticker data');
        console.error('Sticker import error:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    e.target.value = '';
  }, [stickers, onSaveStickers]);

  return (
    <div 
      ref={reactFlowWrapperRef}
      className={`h-full w-full bg-gradient-to-br from-white to-gray-200 dark:from-gray-900 dark:to-black ${themeClass}`}
      onClick={handleCanvasClick} // Handle canvas click for sticker placement
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
        {/* Stickers are now handled through the nodeTypes system */}
        
        <Background 
          color="hsl(var(--border))" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-card/80 text-black border border-border/50 rounded-lg shadow-lg backdrop-blur-sm hover:border-blue-500/50 active:border-blue-500/80"
          showInteractive={false}
        />
        
        {/* Sticker Panel */}
        <Panel position="top-right" className="bg-background/95 p-2 rounded-lg shadow-md border border-border backdrop-blur-sm">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Sticker className="h-4 w-4" />
                {isAddingStickerMode ? 'Cancel Sticker' : 'Add Sticker'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3">
              <Tabs defaultValue="sticker">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="sticker" onClick={() => setNewStickerType('sticker')}>
                      <Sticker className="h-4 w-4 mr-2" /> Sticker
                    </TabsTrigger>
                    <TabsTrigger value="tag" onClick={() => setNewStickerType('tag')}>
                      <Hash className="h-4 w-4 mr-2" /> Tag
                    </TabsTrigger>
                  </TabsList>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 ml-2"
                        title="View emoji keywords"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3">
                      <div className="text-sm font-medium mb-2">Available Emoji Keywords</div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Start your sticker text with these keywords to use specific emojis.
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {emojiKeywords.map(item => (
                          <div key={item.keyword} className="flex items-center gap-2 text-sm">
                            <span className="text-base">{item.emoji}</span>
                            <span>{item.keyword}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Text</Label>
                    <Input 
                      placeholder="Enter sticker text..." 
                      value={newStickerText} 
                      onChange={(e) => setNewStickerText(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: Start with keywords like "star", "fire", "idea" for special emojis
                    </p>
                    
                    {/* Preview section */}
                    {newStickerText && (
                      <div className="mt-3">
                        <Label>Preview</Label>
                        <div className="mt-1 border rounded-md p-3 flex items-center justify-center">
                          <div 
                            className={cn(
                              "p-2 rounded-md text-center max-w-[200px] transition-all",
                              newStickerType === 'tag' ? 
                                'bg-primary/20 border border-primary/30 text-primary-foreground' :
                                ''
                            )}
                            style={{ 
                              backgroundColor: newStickerType === 'sticker' ? `${previewColor.substring(0, 7)}20` : '',
                              borderColor: newStickerType === 'sticker' ? `${previewColor.substring(0, 7)}50` : '' 
                            }}
                          >
                            {newStickerType === 'sticker' && newStickerText && (
                                <span className="text-lg mr-1">
                                  {getEmojiForKeyword(newStickerText.split(' ')[0] || '')}
                                </span>
                            )}
                            <span>{newStickerType === 'tag' ? '#' + newStickerText : newStickerText}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-2 items-center">
                        <Label className="text-xs">Color:</Label>
                        <input 
                          type="color" 
                          value={previewColor}
                          onChange={(e) => setPreviewColor(e.target.value)}
                          className="w-8 h-8 rounded-md cursor-pointer"
                        />
                      </div>
                      {newStickerType === 'sticker' ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setIsAddingStickerMode(true)}
                          disabled={isAddingStickerMode || !newStickerText.trim()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Place Sticker
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            // For tags, create directly at a default position without requiring placement
                            if (!newStickerText.trim()) return;
                            
                            const defaultPosition = {
                              x: 100, // Default X position
                              y: 100  // Default Y position
                            };
                            
                            // Find an open spot to avoid stacking tags
                            const usedPositions = stickers
                              .filter(s => s.type === 'tag')
                              .map(s => s.position);
                              
                            // Offset position if there are existing tags
                            if (usedPositions.length > 0) {
                              defaultPosition.y += (usedPositions.length * 40);
                            }
                            
                            // Create new tag directly
                            const newTag: StickerData = {
                              id: `tag-${Date.now()}`,
                              text: newStickerText,
                              position: defaultPosition,
                              type: 'tag',
                              rotation: 0, // No rotation for tags
                            };
                            
                            // Add to stickers
                            const updatedStickers = [...stickers, newTag];
                            setStickers(updatedStickers);
                            
                            // Save stickers if callback provided
                            onSaveStickers?.(updatedStickers);
                            
                            // Reset sticker text
                            setNewStickerText('');
                            
                            toast.success('Tag added!');
                          }}
                          disabled={!newStickerText.trim()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Tag
                        </Button>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <input
                        type="file"
                        id="sticker-import"
                        className="hidden"
                        accept=".json"
                        onChange={handleImportStickers}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => document.getElementById('sticker-import')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Import Stickers/Tags
                      </Button>
                    </div>
                    
                    {isAddingStickerMode && (
                      <div className="text-sm bg-muted p-2 mt-4 rounded-md text-muted-foreground">
                        Click anywhere on the canvas to place your {newStickerType}...
                      </div>
                    )}
                  </div>
                </div>
              </Tabs>
            </PopoverContent>
          </Popover>
        </Panel>
      </ReactFlow>
    </div>
    );
}


