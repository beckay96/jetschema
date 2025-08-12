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
import { useTriggersFunctions } from '@/hooks/useTriggersFunctions';
import { useRLSPolicies, RLSPolicy } from '@/hooks/useRLSPolicies';
import type { DatabaseTrigger, DatabaseFunction } from '@/types/database';
import { ExportModal } from '../ExportingAndSaving/ExportModal';
import { TriggerFunctionModal } from './TriggerFunctionModal';
import { RLSPolicyModal } from './RLSPolicyModal';
import { DataTypePill } from '../../Settings/DataTypePill';
import { ProjectTitleIcons } from '../Other/MicrointeractionIcons';
import { IndexesSidebar } from '../IndexesComponents/IndexesSidebar';
import { EnumerationsSidebar } from '../EnumerationsComponents/EnumerationsSidebar';
import { StorageBucketsSidebar } from '../StorageBucketsComponents/StorageBucketsSidebar';
import { EnumerationModal } from '../EnumerationsComponents/EnumerationModal';
import { StorageBucketModal } from '../StorageBucketsComponents/StorageBucketModal';
import { useEnumerations } from '@/hooks/useEnumerations';
import { useStorageBuckets } from '@/hooks/useStorageBuckets';
import { TabsDropdown } from './TabsDropdown';

import type { DatabaseSidebarProps, SortableTableCardProps } from '@/types/database';

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
  
  // Handler to prevent drag events from triggering onClick
  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger select if we're not dragging
    if (!isDragging) {
      onSelect();
    }
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      className={cn(
        "touch-manipulation",
        isDragging ? "shadow-lg" : ""
      )}
    >
      <Card 
        className={cn(
          "card-enhanced group transition-all duration-150",
          "border border-border",
          isSelected ? "ring-2 ring-primary bg-primary/5" : "",
          isValidated ? "card-validated" : hasWarnings ? "card-warning" : "",
          isDragging ? "shadow-xl scale-[1.02]" : "" // Enhanced visual feedback during dragging
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-2">
          {/* Card Header with Drag Handle */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm truncate">
              <div 
                className="flex items-center gap-1 drag-handle w-full cursor-grab active:cursor-grabbing" 
                {...listeners}
              >
                <div className="drag-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grip opacity-60 group-hover:opacity-100">
                    <circle cx="9" cy="6" r="2"/>
                    <circle cx="9" cy="18" r="2"/>
                    <circle cx="15" cy="6" r="2"/>
                    <circle cx="15" cy="18" r="2"/>
                    <circle cx="9" cy="12" r="2"/>
                    <circle cx="15" cy="12" r="2"/>
                  </svg>
                </div>
                <span className="cursor-pointer">{table.name}</span>
              </div>
            </h4>
            <div className="flex gap-1">
              {onAddComment && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover-icon z-10" onClick={e => {
                  e.stopPropagation();
                  onAddComment('table', table.id, table.name);
                }}>
                  <MessageCircle className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover-icon z-10" onClick={e => {
                e.stopPropagation();
                onDelete();
              }}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          {/* Table Fields - Part of the draggable component but with separate click handling */}
          <div className="space-y-1 text-xs text-muted-foreground">
            {table.fields.slice(0, 3).map(field => 
              <div key={field.id} className="flex items-center justify-between cursor-pointer" onClick={handleCardClick}>
                <div className="truncate flex-1">{field.name}</div>
                <DataTypePill type={field.type} size="sm" />
              </div>)}
            {table.fields.length > 3 && 
              <div className="text-xs text-muted-foreground cursor-pointer" onClick={handleCardClick}>
                +{table.fields.length - 3} more fields
              </div>
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// No minimum width needed - relies on parent Panel's minSize

const DatabaseSidebar = ({
  tables,
  triggers,
  functions,
  selectedTable,
  projectId,
  onAddTable,
  onAddTrigger,
  onAddFunction,
  onSelectTable,
  onDeleteTable,
  onDeleteTrigger,
  onDeleteFunction,
  onUpdateTrigger,
  onUpdateFunction,
  onSaveProject,
  projectName = 'Untitled Project',
  onProjectNameChange,
  onReorderTables,
  onAddComment,
  // No resize props needed - handled by parent Panel component
}: DatabaseSidebarProps) => {
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
  // Use the projectName prop directly
  const [localProjectName, setLocalProjectName] = useState(projectName || 'Database Schema');
  const [editedProjectName, setEditedProjectName] = useState(projectName || 'Database Schema');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [showRLSModal, setShowRLSModal] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<DatabaseTrigger | null>(null);
  const [editingFunction, setEditingFunction] = useState<DatabaseFunction | null>(null);
  const [showEnumerationModal, setShowEnumerationModal] = useState(false);
  const [showStorageBucketModal, setShowStorageBucketModal] = useState(false);
  const [editingEnumeration, setEditingEnumeration] = useState(null);
  const [editingStorageBucket, setEditingStorageBucket] = useState(null);
  const [editingPolicy, setEditingPolicy] = useState<RLSPolicy | null>(null);
  const [activeTab, setActiveTab] = useState('tables');
  // No longer using collapse state from props - controlled by parent Panel
  
  // RLS policies
  const { policies, loading: policiesLoading, savePolicy, updatePolicy, deletePolicy, refetch: refetchPolicies } = useRLSPolicies(projectId);
  
  // Enumerations
  const { enumerations, loading: enumerationsLoading, createEnumeration, updateEnumeration, deleteEnumeration } = useEnumerations(projectId || '');
  
  // Storage Buckets
  const { buckets, loading: bucketsLoading, createStorageBucket, updateStorageBucket, deleteStorageBucket } = useStorageBuckets(projectId || '');
  
  // Reference for the sidebar container element
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // No custom resize handlers - we'll rely on the parent Panel's resize handle
  
  // Update local state when project name prop changes
  useEffect(() => {
    if (projectName) {
      setLocalProjectName(projectName);
      // Only update the edited name if we're not currently editing
      if (!isEditingName) {
        setEditedProjectName(projectName);
      }
    }
  }, [projectName, isEditingName]);
  
  // Function to save project name changes
  const saveProjectName = () => {
    if (projectName !== editedProjectName) {
      setLocalProjectName(editedProjectName);
      if (onProjectNameChange) {
        onProjectNameChange(editedProjectName);
      }
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
      {/* No longer using custom collapse button - using parent Panel's collapse functionality */}
      
      <div 
        ref={sidebarRef}
        className="h-screen flex flex-col transition-all duration-300 ease-in-out bg-background relative opacity-100"
        // No fixed width - adapt to parent Panel width
      >
      <div className="pb-3 px-4 pt-4 border-b border-border bg-background w-full">
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
      </div>

      <div className="flex-1 pt-0 px-2 overflow-hidden bg-background">
        <div className="h-full flex flex-col overflow-hidden">
          {/* Dropdown menu for tab selection - fixed position */}
          <div className="flex items-center justify-center mt-3 mb-2 flex-shrink-0">
            <div className="flex-1">
              <TabsDropdown activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>


          {activeTab === "tables" && (
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              <div className="flex-shrink-0 space-y-2 mb-2 pt-1 pl-2">
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

            <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden h-full! px-0.5" type="always">
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
                      <div className="space-y-1.5 pt-1 w-full">
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
                    <Card key={policy.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                      setEditingPolicy(policy);
                      setShowRLSModal(true);
                    }}>
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
            <IndexesSidebar tables={tables} projectId={projectId || ''} />
          )}

          {activeTab === "enumerations" && (
            <EnumerationsSidebar
              projectId={projectId || ''}
              enumerations={enumerations}
              onEnumerationSelect={(enumeration) => {
                // Handle enumeration selection if needed
                console.log('Selected enumeration:', enumeration);
              }}
              onEnumerationCreate={() => {
                setEditingEnumeration(null);
                setShowEnumerationModal(true);
              }}
              onEnumerationEdit={(enumeration) => {
                setEditingEnumeration(enumeration);
                setShowEnumerationModal(true);
              }}
              onEnumerationDelete={async (id) => {
                try {
                  await deleteEnumeration(id);
                } catch (error) {
                  console.error('Error deleting enumeration:', error);
                }
              }}
            />
          )}

          {activeTab === "storage" && (
            <StorageBucketsSidebar
              projectId={projectId || ''}
              buckets={buckets}
              onBucketSelect={(bucket) => {
                // Handle bucket selection if needed
                console.log('Selected bucket:', bucket);
              }}
              onBucketCreate={() => {
                setEditingStorageBucket(null);
                setShowStorageBucketModal(true);
              }}
              onBucketEdit={(bucket) => {
                setEditingStorageBucket(bucket);
                setShowStorageBucketModal(true);
              }}
              onBucketDelete={async (id) => {
                try {
                  await deleteStorageBucket(id);
                } catch (error) {
                  console.error('Error deleting storage bucket:', error);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* No custom resize handle - using parent Panel's resize handle */}

      <ExportModal 
        tables={tables} 
        open={showExportModal} 
        onOpenChange={setShowExportModal} 
        projectName={projectName} 
      />

      <TriggerFunctionModal 
        mode="trigger" 
        open={showTriggerModal} 
        onOpenChange={(open) => {
          setShowTriggerModal(open);
          if (!open) setEditingTrigger(null); // Reset editing trigger when modal closes
        }} 
        tables={tables} 
        functions={functions} 
        existingTrigger={editingTrigger}
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
        onOpenChange={(open) => {
          setShowFunctionModal(open);
          if (!open) setEditingFunction(null); // Reset editing function when modal closes
        }} 
        tables={tables} 
        functions={functions} 
        existingFunction={editingFunction}
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
        onOpenChange={(open) => {
          setShowRLSModal(open);
          if (!open) setEditingPolicy(null); // Reset editing policy when modal closes
        }}
        tables={tables}
        projectId={projectId || ''}
        editingPolicy={editingPolicy}
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
              // Don't override author_id - let useRLSPolicies hook set it to user.id
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
      
      <EnumerationModal
        open={showEnumerationModal}
        onOpenChange={(open) => {
          setShowEnumerationModal(open);
          if (!open) setEditingEnumeration(null);
        }}
        enumeration={editingEnumeration}
        onSave={async (enumData) => {
          try {
            if (editingEnumeration) {
              await updateEnumeration({ ...enumData, id: editingEnumeration.id });
            } else {
              await createEnumeration(enumData as any);
            }
          } catch (error) {
            console.error('Error saving enumeration:', error);
            throw error;
          }
        }}
        onDelete={editingEnumeration ? async (id) => {
          try {
            await deleteEnumeration(id);
          } catch (error) {
            console.error('Error deleting enumeration:', error);
            throw error;
          }
        } : undefined}
      />
      
      <StorageBucketModal
        open={showStorageBucketModal}
        onOpenChange={(open) => {
          setShowStorageBucketModal(open);
          if (!open) setEditingStorageBucket(null);
        }}
        bucket={editingStorageBucket}
        availableTables={tables.map(t => t.name)}
        onSave={async (bucketData) => {
          try {
            if (editingStorageBucket) {
              await updateStorageBucket({ ...bucketData, id: editingStorageBucket.id });
            } else {
              await createStorageBucket(bucketData as any);
            }
          } catch (error) {
            console.error('Error saving storage bucket:', error);
            throw error;
          }
        }}
        onDelete={editingStorageBucket ? async (id) => {
          try {
            await deleteStorageBucket(id);
          } catch (error) {
            console.error('Error deleting storage bucket:', error);
            throw error;
          }
        } : undefined}
      />
    </div>
    </>
  );
};

export default DatabaseSidebar;
