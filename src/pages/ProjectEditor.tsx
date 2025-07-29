import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';

// Auto-save hook
function useAutoSave(saveFunction: () => Promise<void>, dependencies: any[], delay = 2000) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveFunction();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, dependencies);
}

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
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentProject = projects.find(p => p.id === id);

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
    setTables(importedTables);
    toast.success(`Successfully imported ${importedTables.length} tables!`);
  };

  const handleAddTable = () => {
    const newTable: DatabaseTable = {
      id: `table-${Date.now()}`,
      name: `new_table_${tables.length + 1}`,
      fields: [],
      position: {
        x: 100 + tables.length * 50,
        y: 100 + tables.length * 50
      }
    };
    setTables([...tables, newTable]);
    setSelectedTable(newTable);
    toast.success('New table added!');
  };

  const handleDeleteTable = (tableId: string) => {
    setTables(tables.filter(t => t.id !== tableId));
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
    toast.success('Table deleted!');
  };

  const handleSaveProject = async () => {
    if (!currentProject) return;
    
    const projectData = {
      tables,
      triggers,
      functions
    };

    await updateProject(currentProject.id, {
      name: projectName,
      project_data: projectData
    });
  };

  // Auto-save whenever tables, triggers, functions, or project name changes
  useAutoSave(handleSaveProject, [tables, triggers, functions, projectName]);

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
            
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
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
      <div className="flex h-[calc(100vh-80px)] relative">
        {/* Left Sidebar */}
        <div className={`
          ${isMobile ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full'}` : `w-80 ${leftPanelOpen || !isMobile ? 'block' : 'hidden'}`}
          border-r bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden
        `}>
          {/* Close button for mobile */}
          {isMobile && leftPanelOpen && (
            <div className="absolute top-4 right-4 z-10">
              <Button variant="ghost" size="sm" onClick={() => setLeftPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
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
            onProjectNameChange={setProjectName}
          />
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Desktop toggle buttons */}
          {!isMobile && (
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleLeftPanel} className={leftPanelOpen ? 'bg-muted' : ''}>
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {!isMobile && (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleRightPanel} className={rightPanelOpen ? 'bg-muted' : ''}>
                <PanelRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex-1">
            <DatabaseCanvas
              tables={tables}
              onTableUpdate={setTables}
              onTableSelect={setSelectedTable}
              selectedTable={selectedTable}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className={`
          ${isMobile ? `fixed inset-y-0 right-0 z-50 w-96 transform transition-transform duration-300 ease-in-out ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}` : `w-96 ${rightPanelOpen || !isMobile ? 'block' : 'hidden'}`}
          border-l bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden
        `}>
          {/* Close button for mobile */}
          {isMobile && rightPanelOpen && (
            <div className="absolute top-4 left-4 z-10">
              <Button variant="ghost" size="sm" onClick={() => setRightPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
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

        {/* Mobile backdrop */}
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
    </div>
  );
};

export default ProjectEditor;