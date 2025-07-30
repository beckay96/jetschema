import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { DatabaseCanvas } from '@/components/database/DatabaseCanvas';
import { TableView } from '@/components/database/TableView';
import { DatabaseSidebar } from '@/components/database/DatabaseSidebar';
import { SQLEditor } from '@/components/database/SQLEditor';
import { DatabaseTable, DatabaseTrigger, DatabaseFunction } from '@/types/database';
import { CommentTaskDrawer, SchemaComment, SchemaTask } from '@/components/database/CommentTaskDrawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Code, Palette, PanelLeft, PanelRight, ArrowLeft, X, Grid, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SaveStatus } from '@/components/SaveStatus';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import '@/styles/panel-styles.css'; // Custom panel styles (replacing missing package CSS)
import { toast } from 'sonner';

const ProjectEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject } = useProjects();
  
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [triggers, setTriggers] = useState<DatabaseTrigger[]>([]);
  const [functions, setFunctions] = useState<DatabaseFunction[]>([]);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [projectName, setProjectName] = useState('');
  
  // Comments and tasks state
  const [comments, setComments] = useState<SchemaComment[]>([]);
  const [tasks, setTasks] = useState<SchemaTask[]>([]);
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);

  // Panel state management
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  
  // View mode state - 'diagram' (default) or 'table'
  const [viewMode, setViewMode] = useState<'diagram' | 'table'>('diagram');

  const currentProject = projects.find(p => p.id === id);
  
  // Track changes to mark as unsaved
  useEffect(() => {
    if (currentProject) {
      const initialData = currentProject.project_data || {};
      const currentData = { tables, triggers, functions };
      const hasChanges = 
        JSON.stringify(initialData.tables || []) !== JSON.stringify(tables) ||
        JSON.stringify(initialData.triggers || []) !== JSON.stringify(triggers) ||
        JSON.stringify(initialData.functions || []) !== JSON.stringify(functions);
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [tables, triggers, functions, currentProject]);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load project data
  useEffect(() => {
    if (currentProject) {
      const projectData = currentProject.project_data || {};
      setTables(projectData.tables || []);
      setTriggers(projectData.triggers || []);
      setFunctions(projectData.functions || []);
      setProjectName(currentProject.name);
      
      // Load comments and tasks if they exist
      setComments(projectData.comments || []);
      setTasks(projectData.tasks || []);
    }
  }, [currentProject]);

  // Close other panel when opening one
  const toggleLeftPanel = () => {
    if (!leftPanelOpen && rightPanelOpen) {
      setRightPanelOpen(false);
    }
    setLeftPanelOpen(!leftPanelOpen);
  };

  const toggleRightPanel = () => {
    if (!rightPanelOpen && leftPanelOpen) {
      setLeftPanelOpen(false);
    }
    setRightPanelOpen(!rightPanelOpen);
  };

  // Comment and task management handlers
  const handleAddComment = (elementType: 'table' | 'field', elementId: string, elementName: string) => {
    const newComment: SchemaComment = {
      id: `comment-${Date.now()}`,
      elementType,
      elementId,
      elementName,
      content: `Add your comment about ${elementName} here...`,
      createdAt: new Date(),
      read: false,
    };
    
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setCommentDrawerOpen(true);
    // Also save the project with the new comment
    handleSaveProject(tables, triggers, functions, updatedComments, tasks, true);
    toast.success(`Added comment for ${elementName}`);
  };

  const handleMarkAsTask = (elementType: 'table' | 'field', elementId: string, elementName: string, priority: 'low' | 'medium' | 'high') => {
    const newTask: SchemaTask = {
      id: `task-${Date.now()}`,
      elementType,
      elementId,
      elementName,
      description: `Review and complete ${elementName}`,
      priority,
      createdAt: new Date(),
      completed: false,
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setCommentDrawerOpen(true);
    // Also save the project with the new task
    handleSaveProject(tables, triggers, functions, comments, updatedTasks, true);
    toast.success(`Marked ${elementName} as ${priority} priority task`);
  };
  
  // Mark comment as read handler
  const handleMarkCommentRead = (commentId: string) => {
    const updatedComments = comments.map(comment => 
      comment.id === commentId ? { ...comment, read: true } : comment
    );
    setComments(updatedComments);
    handleSaveProject(tables, triggers, functions, updatedComments, tasks, true);
    toast.success("Comment marked as read");
  };
  
  // Mark task as complete handler
  const handleMarkTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: true, completedAt: new Date() } : task
    );
    setTasks(updatedTasks);
    handleSaveProject(tables, triggers, functions, comments, updatedTasks, true);
    toast.success("Task marked as complete");
  };
  
  // Navigate to element handler
  const handleNavigateToElement = (elementType: string, elementId: string) => {
    // Set view mode to diagram for navigation
    setViewMode('diagram');
    
    // Find the element and select/focus on it
    if (elementType === 'table') {
      const table = tables.find(t => t.id === elementId);
      if (table) {
        setSelectedTable(table);
        toast.info(`Navigated to table ${table.name}`);
      }
    } else if (elementType === 'field') {
      // Find which table contains this field
      for (const table of tables) {
        const field = table.fields.find(f => f.id === elementId);
        if (field) {
          setSelectedTable(table);
          toast.info(`Navigated to field ${field.name} in table ${table.name}`);
          break;
        }
      }
    }
    
    // Close the drawer after navigation
    setCommentDrawerOpen(false);
  };

  const handleTablesImported = (importedTables: DatabaseTable[]) => {
    // Update local state first
    setTables(importedTables);
    // Persist using the freshly imported tables to avoid saving an empty array
    handleSaveProject(importedTables, triggers, functions, comments, tasks, true);
  };

  const handleAddTable = () => {
    const newTable: DatabaseTable = {
      id: `table-${Date.now()}`,
      name: `new_table_${tables.length + 1}`,
      fields: [],
      position: {
        x: 100 + tables.length * 50,
        y: 100 + tables.length * 50,
      },
    };
    const updatedTables = [...tables, newTable];
    setTables(updatedTables);
    setSelectedTable(newTable);
    // Don't auto-save, let the auto-save handle it
  };

  const handleDeleteTable = (tableId: string) => {
    const updatedTables = tables.filter((t) => t.id !== tableId);
    setTables(updatedTables);
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
    // Don't auto-save, let the auto-save handle it
  };
  
  // Edit an existing table's data
  const handleEditTable = (tableId: string, data: Partial<DatabaseTable>) => {
    const updatedTables = tables.map(table => 
      table.id === tableId ? { ...table, ...data } : table
    );
    setTables(updatedTables);
    // Don't auto-save, let the auto-save handle it
  };
  
  // Edit a field in a table
  const handleEditField = (tableId: string, fieldId: string, fieldData: Partial<any>) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        const updatedFields = table.fields.map(field => 
          field.id === fieldId ? { ...field, ...fieldData } : field
        );
        return { ...table, fields: updatedFields };
      }
      return table;
    });
    setTables(updatedTables);
    // Don't auto-save, let the auto-save handle it
  };
  
  // Delete a field from a table
  const handleDeleteField = (tableId: string, fieldId: string) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        return {
          ...table,
          fields: table.fields.filter(field => field.id !== fieldId)
        };
      }
      return table;
    });
    setTables(updatedTables);
    // Don't auto-save, let the auto-save handle it
  };
  
  // Add a new field to a table
  const handleAddField = (tableId: string, field?: any) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        const newField = field || {
          id: `field-${Date.now()}`,
          name: `new_field_${table.fields.length + 1}`,
          type: 'VARCHAR',
          nullable: true,
          primaryKey: false,
          unique: false,
          foreignKey: null,
          defaultValue: null
        };
        return {
          ...table,
          fields: [...table.fields, newField]
        };
      }
      return table;
    });
    setTables(updatedTables);
    // Don't auto-save, let the auto-save handle it
  };
  
  // Save canvas changes explicitly
  const handleSaveCanvasChanges = (updatedTables: DatabaseTable[]) => {
    setTables(updatedTables);
    handleSaveProject(updatedTables, triggers, functions, comments, tasks, false);
  };

  // Save project to Supabase. Accepts optional explicit data to avoid
  // stale closures when state updates are asynchronous.
  const handleSaveProject = async (
    tablesData: DatabaseTable[] = tables,
    triggersData: DatabaseTrigger[] = triggers,
    functionsData: DatabaseFunction[] = functions,
    commentsData: SchemaComment[] = comments,
    tasksData: SchemaTask[] = tasks,
    silent: boolean = false
  ) => {
    if (!currentProject) return;

    setIsSaving(true);
    
    const projectData = {
      tables: tablesData,
      triggers: triggersData,
      functions: functionsData,
      comments: commentsData,
      tasks: tasksData,
    };

    try {
      await updateProject(currentProject.id, {
        name: projectName,
        project_data: projectData,
      });
      
      if (!silent) {
        setLastSavedTime(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save immediately when project name changes
  const handleProjectNameChange = (name: string) => {
    setProjectName(name);
    // Save project name change immediately without debouncing
    handleSaveProject(tables, triggers, functions, comments, tasks, false);
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="shrink-0">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Projects</span>
              </Button>
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <img src="/rocket-logo.svg" alt="JetSchema Logo" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                <h1 className="text-sm sm:text-lg font-semibold truncate">{projectName}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <SaveStatus 
                isSaving={isSaving} 
                isSaved={!hasUnsavedChanges} 
                className="hidden sm:flex"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveProject()}
                className="h-8"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Badge variant="secondary" className="hidden sm:flex">
                {tables.length} tables
              </Badge>
              
              {/* Comments & Tasks Drawer */}
              <CommentTaskDrawer 
                comments={comments}
                tasks={tasks}
                onMarkCommentRead={handleMarkCommentRead}
                onMarkTaskComplete={handleMarkTaskComplete}
                onNavigateToElement={handleNavigateToElement}
                open={commentDrawerOpen}
                onOpenChange={setCommentDrawerOpen}
              />
              
              {/* View Mode Toggle */}
              <div className="border rounded-md flex items-center overflow-hidden">
                <Button 
                  variant={viewMode === 'diagram' ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`h-8 rounded-none px-2 ${viewMode === 'diagram' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('diagram')}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Diagram</span>
                </Button>
                <Button 
                  variant={viewMode === 'table' ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`h-8 rounded-none px-2 ${viewMode === 'table' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  <Grid className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Table</span>
                </Button>
              </div>
              
              {/* Mobile toggle buttons */}
              {isMobile && (
                <>
                  <Button variant="outline" size="sm" onClick={toggleLeftPanel}>
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleRightPanel}>
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isMobile ? (
        // Mobile Layout - Slide-in panels
        <div className="flex h-[calc(100vh-80px)] relative">
          {/* Left Sidebar - Mobile slide-in */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full'}
            border-r bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden
          `}>
            {/* Close button for mobile */}
            <div className="absolute top-4 right-4 z-10">
              <Button variant="ghost" size="sm" onClick={() => setLeftPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <DatabaseSidebar
              tables={tables}
              triggers={triggers}
              functions={functions}
              selectedTable={selectedTable}
              onAddTable={handleAddTable}
              onAddTrigger={(trigger) => console.log('Add trigger', trigger)}
              onAddFunction={(func) => console.log('Add function', func)}
              onSelectTable={setSelectedTable}
              onDeleteTable={handleDeleteTable}
              onSaveProject={handleSaveProject}
              projectName={projectName}
              onProjectNameChange={handleProjectNameChange}
            />
          </div>

          {/* Main Canvas - Mobile */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <DatabaseCanvas
                tables={tables}
                setTables={setTables}
                selectedTable={selectedTable}
                setSelectedTable={setSelectedTable}
                onAddTable={handleAddTable}
                onDeleteTable={handleDeleteTable}
                onEditTable={handleEditTable}
                onEditField={handleEditField}
                onDeleteField={handleDeleteField}
                onAddField={handleAddField}
                onSave={handleSaveCanvasChanges}
                onAddComment={handleAddComment}
                onMarkAsTask={handleMarkAsTask}
                onNavigateToElement={handleNavigateToElement}
              />
            </div>
          </div>

          {/* Right Panel - Mobile slide-in */}
          <div className={`
            fixed inset-y-0 right-0 z-50 w-96 transform transition-transform duration-300 ease-in-out ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
            border-l bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden
          `}>
            {/* Close button for mobile */}
            <div className="absolute top-4 left-4 z-10">
              <Button variant="ghost" size="sm" onClick={() => setRightPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Mobile toggle buttons - Floating in canvas */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-40">
            <Button variant="outline" size="sm" onClick={toggleLeftPanel} className="shadow-md">
              <PanelLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={toggleRightPanel} className="shadow-md">
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>
          
        </div>
      ) : (
        // Desktop Layout - Resizable panels
        <PanelGroup direction="horizontal" className="h-[calc(100vh-80px)]">
          {/* Left Sidebar - Desktop resizable */}
          <Panel 
            defaultSize={20} 
            minSize={0}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setLeftPanelOpen(false)}
            onExpand={() => setLeftPanelOpen(true)}
            className="border-r bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden"
          >
            <div ref={leftPanelRef} className="h-full">
              <DatabaseSidebar
                tables={tables}
                triggers={triggers}
                functions={functions}
                selectedTable={selectedTable}
                onAddTable={handleAddTable}
                onAddTrigger={(trigger) => console.log('Add trigger', trigger)}
                onAddFunction={(func) => console.log('Add function', func)}
                onSelectTable={setSelectedTable}
                onDeleteTable={handleDeleteTable}
                onSaveProject={handleSaveProject}
                projectName={projectName}
                onProjectNameChange={handleProjectNameChange}
              />
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-2 md:w-3 hover:w-4 cursor-col-resize bg-muted-foreground/10 hover:bg-muted-foreground/40 transition-all relative group">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-0.5 h-8 bg-muted-foreground/60 rounded-full"></div>
            </div>
          </PanelResizeHandle>

          {/* Main Canvas - Desktop */}
          <Panel defaultSize={60} minSize={30} className="relative">
            {/* Toggle buttons - Only shown when panel is collapsed and only on mobile */}
            {!leftPanelOpen && (
              <div className="absolute top-4 left-4 z-10 md:hidden">
                <Button variant="outline" size="sm" onClick={() => setLeftPanelOpen(true)}>
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {!rightPanelOpen && (
              <div className="absolute top-4 right-4 z-10 md:hidden">
                <Button variant="outline" size="sm" onClick={() => setRightPanelOpen(true)}>
                  <PanelRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="h-full">
              {viewMode === 'diagram' ? (
                <DatabaseCanvas
                  tables={tables}
                  setTables={setTables}
                  selectedTable={selectedTable}
                  setSelectedTable={setSelectedTable}
                  onAddTable={handleAddTable}
                  onDeleteTable={handleDeleteTable}
                  onEditTable={handleEditTable}
                  onEditField={handleEditField}
                  onDeleteField={handleDeleteField}
                  onAddField={handleAddField}
                  onSave={handleSaveCanvasChanges}
                  onAddComment={handleAddComment}
                  onMarkAsTask={handleMarkAsTask}
                  onNavigateToElement={handleNavigateToElement}
                />
              ) : (
                <TableView
                  tables={tables}
                  onTableSelect={setSelectedTable}
                  onTableUpdate={(updatedTables) => {
                    setTables(updatedTables);
                    setHasUnsavedChanges(true);
                  }}
                  onAddTable={handleAddTable}
                  onDeleteTable={handleDeleteTable}
                  onAddComment={(tableName, fieldName) => {
                    // Implement comment functionality
                    console.log(`Add comment for ${tableName}.${fieldName}`);
                    // This would typically open a comment dialog or similar
                  }}
                  selectedTable={selectedTable}
                />
              )}
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-2 md:w-3 hover:w-4 cursor-col-resize bg-muted-foreground/10 hover:bg-muted-foreground/40 transition-all relative group">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-0.5 h-8 bg-muted-foreground/60 rounded-full"></div>
            </div>
          </PanelResizeHandle>

          {/* Right Panel - Desktop resizable */}
          <Panel 
            defaultSize={20} 
            minSize={0} 
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setRightPanelOpen(false)}
            onExpand={() => setRightPanelOpen(true)}
            className="border-l bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden"
          >
            <div ref={rightPanelRef} className="h-full">
              <Tabs defaultValue="sql" className="h-full flex flex-col">
            <div className="p-4 pb-0">
              <TabsList className="w-full">
                <TabsTrigger value="sql" className="flex-1">
                  <Code className="h-4 w-4 mr-2" />
                  SQL
                </TabsTrigger>
                <TabsTrigger value="properties" className="flex-1">
                  <Palette className="h-4 w-4 mr-2" />
                  Properties
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="sql" className="flex-1 p-4 pt-2">
              <SQLEditor onTablesImported={handleTablesImported} currentTables={tables} />
            </TabsContent>

            <TabsContent value="properties" className="flex-1 p-4 pt-2">
              <div className="h-full">
                {selectedTable ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Table Properties</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure {selectedTable.name} table settings
                      </p>
                    </div>
                    {/* Table properties form would go here */}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a table to edit properties</p>
                  </div>
                )}
              </div>
            </TabsContent>
              </Tabs>
            </div>
          </Panel>
        </PanelGroup>
      )}
      
      {/* Mobile backdrop - Only shown on mobile */}
      {isMobile && (leftPanelOpen || rightPanelOpen) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }} 
        />
      )}
    </div>
  );
};

export default ProjectEditor;