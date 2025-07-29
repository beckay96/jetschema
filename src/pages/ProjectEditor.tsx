import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { DatabaseCanvas } from '@/components/database/DatabaseCanvas';
import { DatabaseSidebar } from '@/components/database/DatabaseSidebar';
import { SQLEditor } from '@/components/database/SQLEditor';
import { DatabaseTable, DatabaseTrigger, DatabaseFunction } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Code, Palette, PanelLeft, PanelRight, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SaveStatus } from '@/components/SaveStatus';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import '@/styles/panel-styles.css'; // Custom panel styles (replacing missing package CSS)

const ProjectEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject } = useProjects();
  
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [triggers, setTriggers] = useState<DatabaseTrigger[]>([]);
  const [functions, setFunctions] = useState<DatabaseFunction[]>([]);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [projectName, setProjectName] = useState('');

  // Panel state management
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

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

  const handleTablesImported = (importedTables: DatabaseTable[]) => {
    // Update local state first
    setTables(importedTables);
    // Persist using the freshly imported tables to avoid saving an empty array
    handleSaveProject(importedTables, triggers, functions, true);
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

  // Save project to Supabase. Accepts optional explicit data to avoid
  // stale closures when state updates are asynchronous.
  const handleSaveProject = async (
    tablesData: DatabaseTable[] = tables,
    triggersData: DatabaseTrigger[] = triggers,
    functionsData: DatabaseFunction[] = functions,
    silent: boolean = false
  ) => {
    if (!currentProject) return;

    setIsSaving(true);
    
    const projectData = {
      tables: tablesData,
      triggers: triggersData,
      functions: functionsData,
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
    // Debounce name changes slightly to avoid saving on every keystroke
    setTimeout(() => {
      handleSaveProject();
    }, 500);
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
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
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
                disabled={!currentProject || isSaving || !hasUnsavedChanges}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Badge variant="secondary" className="hidden sm:flex">
                {tables.length} tables
              </Badge>
              
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
                onTableUpdate={(updatedTables) => {
                  setTables(updatedTables);
                  handleSaveProject(); // Save immediately when tables are updated
                }}
                onTableSelect={setSelectedTable}
                selectedTable={selectedTable}
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
            {/* Desktop toggle buttons - Only shown when panel is collapsed */}
            {!leftPanelOpen && (
              <div className="absolute top-4 left-4 z-10">
                <Button variant="outline" size="sm" onClick={() => setLeftPanelOpen(true)}>
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {!rightPanelOpen && (
              <div className="absolute top-4 right-4 z-10">
                <Button variant="outline" size="sm" onClick={() => setRightPanelOpen(true)}>
                  <PanelRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="h-full">
              <DatabaseCanvas
                tables={tables}
                onTableUpdate={(updatedTables) => {
                  setTables(updatedTables);
                  handleSaveProject();
                }}
                onTableSelect={setSelectedTable}
                selectedTable={selectedTable}
              />
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