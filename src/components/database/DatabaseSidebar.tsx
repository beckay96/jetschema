import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Database, Table, Plus, Settings, Zap, Code, Search, FileText, Save, Trash2, ChevronDown, RocketIcon, MessageCircle, Pencil, Clock } from 'lucide-react';
// Import database types
import { DatabaseTable } from '@/types/database';
// Use the hook's interface definitions for database functions and triggers
import { useTriggersFunctions } from '@/hooks/useTriggersFunctions';
import { useRLSPolicies } from '@/hooks/useRLSPolicies';

// Define interfaces matching the Supabase database schema
interface DatabaseTrigger {
  id?: string;
  project_id: string;
  name: string;
  table_name: string;
  trigger_event: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';
  trigger_timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  function_id?: string;
  is_active: boolean;
  conditions?: string;
  author_id?: string;
}

interface DatabaseFunction {
  id?: string;
  project_id: string;
  name: string;
  description?: string;
  function_type: 'plpgsql' | 'edge' | 'cron';
  parameters: Array<{ name: string; type: string; default?: string }>;
  return_type?: string;
  function_body: string;
  is_edge_function: boolean;
  edge_function_name?: string;
  cron_schedule?: string;
  is_cron_enabled: boolean;
  author_id?: string;
}
import { ExportModal } from './ExportModal';
import { TriggerFunctionModal } from './TriggerFunctionModal';
import { RLSPolicyModal } from './RLSPolicyModal';
import { DataTypePill } from './DataTypePill';
import { ProjectTitleIcons } from './MicrointeractionIcons';
import { TabsDropdown } from './TabsDropdown';

interface DatabaseSidebarProps {
  tables: DatabaseTable[];
  triggers: DatabaseTrigger[];
  functions: DatabaseFunction[];
  selectedTable?: DatabaseTable | null;
  projectId?: string;
  onAddTable?: () => void;
  onAddTrigger?: (trigger: Omit<DatabaseTrigger, 'id'>) => void;
  onAddFunction?: (func: Omit<DatabaseFunction, 'id'>) => void;
  onSelectTable?: (table: DatabaseTable) => void;
  onDeleteTable?: (tableId: string) => void;
  onDeleteTrigger?: (triggerId: string) => void;
  onDeleteFunction?: (functionId: string) => void;
  onUpdateTrigger?: (trigger: DatabaseTrigger) => void;
  onUpdateFunction?: (func: DatabaseFunction) => void;
  onSaveProject?: () => void;
  onShare?: () => void;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onReorderTables?: (reorderedTables: DatabaseTable[]) => void;
  onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
}

// Sortable Table Card Component
interface SortableTableCardProps {
  table: DatabaseTable;
  isSelected: boolean;
  isValidated?: boolean;
  hasWarnings?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
}

function SortableTableCard({
  table,
  isSelected,
  isValidated,
  hasWarnings,
  onSelect,
  onDelete,
  onAddComment
}: SortableTableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: table.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="touch-manipulation">
      <Card 
        className={`card-enhanced cursor-pointer group ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
        } ${isValidated ? 'card-validated' : hasWarnings ? 'card-warning' : ''}`}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm truncate">
              <div className="flex items-center gap-1" {...listeners}>
                <div className="cursor-grab active:cursor-grabbing">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grip opacity-60 hover:opacity-100">
                    <circle cx="9" cy="6" r="2"/>
                    <circle cx="9" cy="18" r="2"/>
                    <circle cx="15" cy="6" r="2"/>
                    <circle cx="15" cy="18" r="2"/>
                    <circle cx="9" cy="12" r="2"/>
                    <circle cx="15" cy="12" r="2"/>
                  </svg>
                </div>
                <span onClick={onSelect}>{table.name}</span>
              </div>
            </h4>
            <div className="flex gap-1">
              {onAddComment && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover-icon" onClick={e => {
                  e.stopPropagation();
                  onAddComment('table', table.id, table.name);
                }}>
                  <MessageCircle className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover-icon" onClick={e => {
                e.stopPropagation();
                onDelete();
              }}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            {table.fields.slice(0, 3).map(field => 
              <div key={field.id} className="flex items-center justify-between" onClick={onSelect}>
                <div className="truncate flex-1">{field.name}</div>
                <DataTypePill type={field.type} size="sm" />
              </div>)}
            {table.fields.length > 3 && <div className="text-xs text-muted-foreground" onClick={onSelect}>
                +{table.fields.length - 3} more fields
              </div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const MIN_WIDTH = 300; // Minimum width in pixels before auto-closing

export function DatabaseSidebar({
  tables,
  triggers,
  functions,
  selectedTable,
  onAddTable,
  onAddTrigger,
  onAddFunction,
  onSelectTable,
  onDeleteTable,
  onSaveProject,
  onShare,
  projectName: externalProjectName,
  projectId,
  onProjectNameChange,
  onReorderTables,
  onAddComment
}: DatabaseSidebarProps) {
  // Function to handle table reordering
  const handleTableReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = tables.findIndex(table => table.id === active.id);
      const newIndex = tables.findIndex(table => table.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Create a new array with the reordered tables
        const reorderedTables = arrayMove(tables, oldIndex, newIndex);
        
        // Update the parent component with the new order
        console.log('Tables reordered:', reorderedTables);
        onReorderTables?.(reorderedTables);
      }
    }
  };
  
  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to start
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [projectName, setProjectName] = useState(externalProjectName || 'Database Schema');
  const [editedProjectName, setEditedProjectName] = useState(externalProjectName || 'Database Schema');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [showRLSModal, setShowRLSModal] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<DatabaseTrigger | null>(null);
  const [editingFunction, setEditingFunction] = useState<DatabaseFunction | null>(null);
  const [activeTab, setActiveTab] = useState('tables');
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const resizeRef = useRef(null);
  const sidebarRef = useRef(null);
  
  // RLS policies
  const { policies, loading: policiesLoading, savePolicy, updatePolicy, deletePolicy, refetch: refetchPolicies } = useRLSPolicies(projectId);
  
  // Resize handler setup
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };
  
  const stopResizing = () => {
    setIsResizing(false);
    // Auto collapse if width is less than MIN_WIDTH
    if (sidebarWidth <= MIN_WIDTH) {
      setIsCollapsed(true);
    }
  };
  
  const resize = (e) => {
    if (isResizing) {
      const newWidth = e.clientX;
      // Limit minimum width
      if (newWidth >= 180) { // Absolute minimum for visibility
        setSidebarWidth(newWidth);
      }
    }
  };
  
  // Add event listeners for resize
  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);
  
  // Function to toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (isCollapsed) {
      // When expanding, reset to last known width or default
      setSidebarWidth(sidebarWidth < 180 ? 320 : sidebarWidth);
    }
  };
  
  // Update local state when external project name changes
  useEffect(() => {
    if (externalProjectName) {
      setProjectName(externalProjectName);
      // Only update the edited name if we're not currently editing
      if (!isEditingName) {
        setEditedProjectName(externalProjectName);
      }
    }
  }, [externalProjectName, isEditingName]);
  
  // Function to save project name changes
  const saveProjectName = () => {
    // Only update if the name has actually changed
    if (editedProjectName !== projectName) {
      setProjectName(editedProjectName);
      // Call the parent component's handler to persist the change
      onProjectNameChange?.(editedProjectName);
    }
    setIsEditingName(false);
  };
  
  const cancelNameEdit = () => {
    // Reset to the current project name without saving
    setEditedProjectName(projectName);
    setIsEditingName(false);
  };
  
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    table.fields.some(field => field.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <>
      {/* Collapsed state toggle button */}
      {isCollapsed && (
        <button 
          className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-primary text-white p-2 rounded-r-md shadow-md z-10"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}
      
      <Card 
        ref={sidebarRef} 
        className={cn(
          "h-screen flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
        )}
        style={{ width: isCollapsed ? 0 : sidebarWidth }}
      >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <RocketIcon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Your JetSchema</CardTitle>
          <ProjectTitleIcons onOpenSettings={() => {/* TODO: Project settings */}} />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Project name" 
              value={isEditingName ? editedProjectName : projectName} 
              onChange={e => {
                // Only update the local edited name, don't save yet
                setEditedProjectName(e.target.value);
                setIsEditingName(true);
              }}
              onFocus={() => setIsEditingName(true)}
              onBlur={(e) => {
                // Don't save on blur - let the user explicitly click save/cancel
                e.preventDefault();
              }}
              className={`h-8 text-sm ${isEditingName ? 'ring-1 ring-primary' : ''}`}
            />
            {isEditingName && (
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0" 
                  onClick={saveProjectName}
                  title="Save name"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-green-500"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0" 
                  onClick={cancelNameEdit}
                  title="Cancel"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-red-500"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 h-8" onClick={onSaveProject}>
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => setShowExportModal(true)}>
              <FileText className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-2 pb-2 px-2 overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          {/* Dropdown menu for tab selection - fixed position */}
          <div className="flex items-center justify-center mb-4 flex-shrink-0">
            <div className="flex-1">
              <TabsDropdown activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>


          {activeTab === "tables" && (
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              <div className="flex-shrink-0 space-y-2 mb-4 pt-2 pl-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="p-2 h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search tables..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="h-8 pl-7 text-sm" 
                  />
                </div>
                <Button size="sm" onClick={onAddTable} className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {tables.length} tables
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {tables.reduce((acc, table) => acc + table.fields.length, 0)} fields
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden h-full!" type="always">
              <div className="space-y-2">
                {filteredTables.length > 0 ? (
                  <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter}
                    onDragEnd={handleTableReorder}
                  >
                    <SortableContext 
                      items={filteredTables.map(table => table.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 pt-1 px-2 w-full">
                        {filteredTables.map(table => {
                          const hasWarnings = table.fields.length < 2 || !table.fields.some(f => f.primaryKey);
                          const isValidated = table.fields.length >= 2 && 
                                          table.fields.some(f => f.primaryKey) && 
                                          table.fields.every(f => f.name && f.type);
                          
                          return (
                            <SortableTableCard 
                              key={table.id}
                              table={table}
                              isSelected={selectedTable?.id === table.id}
                              isValidated={isValidated}
                              hasWarnings={hasWarnings}
                              onSelect={() => onSelectTable?.(table)}
                              onDelete={() => onDeleteTable?.(table.id)}
                              onAddComment={onAddComment}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Table className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tables found</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={onAddTable}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Table
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          )}

          {activeTab === "triggers" && (
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              <div className="flex-shrink-0 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Database Triggers</Label>
                <Button size="sm" onClick={() => setShowTriggerModal(true)} className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden h-full" type="always">
              <div className="space-y-2">
                {triggers.map(trigger => (
                  <Card key={trigger.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-3">
                      <div className="text-xs flex items-center justify-between">
                        <div>{trigger.name}</div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTrigger(trigger);
                              setShowTriggerModal(true);
                            }}
                            title="Edit trigger"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTrigger?.(trigger.id!);
                            }}
                            title="Delete trigger"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-[10px] h-5">{trigger.trigger_timing} {trigger.trigger_event}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {trigger.table_name}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {triggers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No triggers defined</p>
                  </div>
                )}
                </div>
              </ScrollArea>
          </div>
          )}

          {activeTab === "functions" && (
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              <div className="flex-shrink-0 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Database Functions</Label>
                <Button size="sm" onClick={() => setShowFunctionModal(true)} className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden h-full" type="always">
              <div className="space-y-2">
                {functions.map(func => (
                  <Card key={func.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{func.name}</h4>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFunction(func);
                              setShowFunctionModal(true);
                            }}
                            title="Edit function"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFunction?.(func.id!);
                            }}
                            title="Delete function"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {func.return_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {func.parameters.length} parameters
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {functions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No functions defined</p>
                  </div>
                )}
                </div>
              </ScrollArea>
          </div>
          )}

          {activeTab === "rls" && (
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              <div className="flex-shrink-0 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">RLS Policies</Label>
                <Button size="sm" className="h-8" onClick={() => setShowRLSModal(true)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden h-full" type="always">
              <div className="space-y-2">
                {policiesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </div>
                    <p className="text-sm">Loading policies...</p>
                  </div>
                ) : policies.length > 0 ? (
                  policies.map(policy => (
                    <Card key={policy.id} className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{policy.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {policy.command}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Table: {policy.table_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Role: {policy.role || 'public'}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No RLS policies defined</p>
                    <Button variant="link" size="sm" className="mt-2" onClick={() => setShowRLSModal(true)}>
                      Create your first policy
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          )}

          {activeTab === "indexes" && (
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              <div className="flex-shrink-0 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Database Indexes</Label>
                <Button size="sm" className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden h-full" type="always">
              <div className="space-y-2">
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No indexes defined</p>
                </div>
              </div>
            </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>

      <div
        ref={resizeRef}
        className="absolute top-0 right-0 w-1 h-full bg-border cursor-col-resize hover:bg-primary active:bg-primary transition-colors"
        onMouseDown={startResizing}
        title="Drag to resize (auto-collapses below 300px)"
      />

      <ExportModal 
        tables={tables} 
        open={showExportModal} 
        onOpenChange={setShowExportModal} 
        projectName={projectName} 
      />

      <TriggerFunctionModal 
        mode="trigger" 
        open={showTriggerModal} 
        onOpenChange={setShowTriggerModal} 
        tables={tables} 
        functions={functions} 
        onSave={trigger => {
          const modalTrigger = trigger as any;
          const dbTrigger: Omit<DatabaseTrigger, 'id'> = {
            name: modalTrigger.name,
            table_name: modalTrigger.table_name,
            trigger_event: modalTrigger.trigger_event,
            trigger_timing: modalTrigger.trigger_timing,
            function_id: modalTrigger.function_id,
            is_active: modalTrigger.is_active,
            conditions: modalTrigger.conditions,
            project_id: selectedTable?.project_id || ''
          };
          onAddTrigger?.(dbTrigger);
          setShowTriggerModal(false);
        }} 
      />

      <TriggerFunctionModal 
        mode="function" 
        open={showFunctionModal} 
        onOpenChange={setShowFunctionModal} 
        tables={tables} 
        functions={functions} 
        onSave={func => {
          const modalFunc = func as any;
          const dbFunc: Omit<DatabaseFunction, 'id'> = {
            name: modalFunc.name,
            project_id: selectedTable?.project_id || '',
            function_type: modalFunc.function_type,
            parameters: modalFunc.parameters || [],
            return_type: modalFunc.return_type || 'TRIGGER',
            function_body: modalFunc.function_body || '',
            is_edge_function: modalFunc.is_edge_function || false,
            edge_function_name: modalFunc.edge_function_name,
            cron_schedule: modalFunc.cron_schedule,
            is_cron_enabled: modalFunc.is_cron_enabled || false,
            description: modalFunc.description,
            author_id: '' // Will be filled by useTriggersFunctions hook
          };
          onAddFunction?.(dbFunc);
          setShowFunctionModal(false);
        }} 
      />
      
      <RLSPolicyModal
        open={showRLSModal}
        onOpenChange={setShowRLSModal}
        tables={tables}
        projectId={projectId || ''}
        onSave={async (policy) => {
          if (!projectId) {
            console.error('Cannot save RLS policy: projectId is undefined');
            return;
          }
          
          console.log('Saving RLS policy:', { ...policy, project_id: projectId });
          
          try {
            // Ensure we're passing all required fields and correct types
            const result = await savePolicy({
              ...policy,
              project_id: projectId,
              // is_permissive is required and must be a boolean
              is_permissive: policy.is_permissive === undefined ? true : policy.is_permissive,
              // author_id will be filled by useRLSPolicies hook
              author_id: '',
            });
            
            console.log('RLS policy saved successfully:', result);
            setShowRLSModal(false);
            refetchPolicies();
          } catch (error) {
            console.error('Error saving policy:', error);
            // Keep the modal open so user can fix any issues
          }
        }}
      />
    </Card>
    </>
  );
}
