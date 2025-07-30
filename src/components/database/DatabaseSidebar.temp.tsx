import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Table, Plus, Settings, Zap, Code, Search, FileText, Save, Trash2 } from 'lucide-react';
import { DatabaseTable, DatabaseTrigger, DatabaseFunction } from '@/types/database';
import { ExportModal } from './ExportModal';
import { TriggerFunctionModal } from './TriggerFunctionModal';
import { DataTypePill } from './DataTypePill';
import { ProjectTitleIcons } from './MicrointeractionIcons';

interface DatabaseSidebarProps {
  tables: DatabaseTable[];
  triggers: DatabaseTrigger[];
  functions: DatabaseFunction[];
  selectedTable?: DatabaseTable | null;
  onAddTable?: () => void;
  onAddTrigger?: (trigger: Omit<DatabaseTrigger, 'id'>) => void;
  onAddFunction?: (func: Omit<DatabaseFunction, 'id'>) => void;
  onSelectTable?: (table: DatabaseTable) => void;
  onDeleteTable?: (tableId: string) => void;
  onSaveProject?: () => void;
  onShare?: () => void;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onReorderTables?: (reorderedTables: DatabaseTable[]) => void; // New prop for table reordering
}

// Sortable Table Card Component
interface SortableTableCardProps {
  table: DatabaseTable;
  isSelected: boolean;
  isValidated: boolean;
  hasWarnings: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableTableCard({
  table,
  isSelected,
  isValidated,
  hasWarnings,
  onSelect,
  onDelete
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
        <CardContent className="p-3">
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
  onProjectNameChange,
  onReorderTables
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    table.fields.some(field => field.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">DataBlaze</CardTitle>
          <ProjectTitleIcons onOpenSettings={() => {/* TODO: Project settings */}} />
        </div>
        
        <div className="space-y-2">
          <Input 
            placeholder="Project name" 
            value={projectName} 
            onChange={e => {
              setProjectName(e.target.value);
              onProjectNameChange?.(e.target.value);
            }} 
            className="h-8 text-sm" 
          />
          
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

      <CardContent className="flex-1 pt-6 pb-12 px-6 overflow-hidden">
        <Tabs defaultValue="tables" className="h-full flex flex-col overflow-hidden">
          <TabsList className="w-full mx-0 flex flex-wrap shrink-0">
            <TabsTrigger value="tables" className="flex-1">
              <Table className="h-3 w-3 mr-1" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="triggers" className="flex-1">
              <Zap className="h-3 w-3 mr-1" />
              Triggers
            </TabsTrigger>
            <TabsTrigger value="functions" className="flex-1">
              <Code className="h-3 w-3 mr-1" />
              Functions
            </TabsTrigger>
            <TabsTrigger value="rls" className="flex-1">
              <Settings className="h-3 w-3 mr-1" />
              RLS
            </TabsTrigger>
            <TabsTrigger value="indexes" className="flex-1">
              <Database className="h-3 w-3 mr-1" />
              Indexes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="flex-1 space-y-4 mt-4 overflow-hidden flex flex-col">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
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

            <ScrollArea className="h-full overflow-y-auto overflow-x-hidden" type="always">
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
                      <div className="space-y-2">
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
          </TabsContent>

          <TabsContent value="triggers" className="flex-1 space-y-4 mt-4 overflow-hidden flex flex-col">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Database Triggers</Label>
                <Button size="sm" onClick={() => setShowTriggerModal(true)} className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <ScrollArea className="flex-1 h-[calc(100%-50px)] overflow-y-auto overflow-x-hidden" type="always">
                <div className="space-y-2">
                  {triggers.map(trigger => (
                    <Card key={trigger.id} className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{trigger.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {trigger.timing}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {trigger.event} on {trigger.table}
                        </p>
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
          </TabsContent>

          <TabsContent value="functions" className="flex-1 space-y-4 mt-4 overflow-hidden flex flex-col">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Database Functions</Label>
                <Button size="sm" onClick={() => setShowFunctionModal(true)} className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <ScrollArea className="flex-1 h-[calc(100%-50px)] overflow-y-auto overflow-x-hidden" type="always">
                <div className="space-y-2">
                  {functions.map(func => (
                    <Card key={func.id} className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{func.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {func.returnType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {func.parameters.length} parameters
                        </p>
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
          </TabsContent>

          <TabsContent value="rls" className="flex-1 space-y-4 mt-4 overflow-hidden flex flex-col">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">RLS Policies</Label>
                <Button size="sm" className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <ScrollArea className="flex-1 h-[calc(100%-50px)] overflow-y-auto overflow-x-hidden" type="always">
                <div className="space-y-2">
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No RLS policies defined</p>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="indexes" className="flex-1 space-y-4 mt-4 overflow-hidden flex flex-col">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Database Indexes</Label>
                <Button size="sm" className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <ScrollArea className="flex-1 h-[calc(100%-50px)] overflow-y-auto overflow-x-hidden" type="always">
                <div className="space-y-2">
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No indexes defined</p>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

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
        functions={[]} 
        onSave={trigger => {
          const modalTrigger = trigger as any;
          const dbTrigger: Omit<DatabaseTrigger, 'id'> = {
            name: modalTrigger.name,
            table: modalTrigger.table_name,
            event: modalTrigger.trigger_event,
            timing: modalTrigger.trigger_timing,
            code: modalTrigger.function_body || '',
            description: modalTrigger.description
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
        functions={[]} 
        onSave={func => {
          const modalFunc = func as any;
          const dbFunc: Omit<DatabaseFunction, 'id'> = {
            name: modalFunc.name,
            returnType: modalFunc.return_type || 'TRIGGER',
            parameters: modalFunc.parameters || [],
            code: modalFunc.function_body || '',
            description: modalFunc.description
          };
          onAddFunction?.(dbFunc);
          setShowFunctionModal(false);
        }} 
      />
    </Card>
  );
}
