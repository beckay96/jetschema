import { useState, useEffect } from 'react';
import { DatabaseCanvas } from '@/components/database/DatabaseCanvas';
import { DatabaseSidebar } from '@/components/database/DatabaseSidebar';
import { SQLEditor } from '@/components/database/SQLEditor';
import { DatabaseTable, DatabaseTrigger, DatabaseFunction } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Code, 
  Palette, 
  Download, 
  Share,
  Sparkles,
  Menu,
  X,
  PanelLeft,
  PanelRight
} from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [triggers, setTriggers] = useState<DatabaseTrigger[]>([]);
  const [functions, setFunctions] = useState<DatabaseFunction[]>([]);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  
  // Panel state management
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      // Default to closed panels on mobile
      if (mobile) {
        setLeftPanelOpen(false);
        setRightPanelOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close other panel when opening one
  const toggleLeftPanel = () => {
    if (!leftPanelOpen && rightPanelOpen && isMobile) {
      setRightPanelOpen(false);
    }
    setLeftPanelOpen(!leftPanelOpen);
  };

  const toggleRightPanel = () => {
    if (!rightPanelOpen && leftPanelOpen && isMobile) {
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
      position: { x: 100 + tables.length * 50, y: 100 + tables.length * 50 }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 
                    className="text-xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent'
                    }}
                  >
                    Database Designer Pro
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Visual database design and SQL management tool
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:flex">
                <Sparkles className="h-3 w-3 mr-1" />
                {tables.length} tables
              </Badge>
              
              {/* Mobile toggle buttons */}
              {isMobile && (
                <>
                  <Button 
                    variant={leftPanelOpen ? "default" : "outline"}
                    size="sm"
                    onClick={toggleLeftPanel}
                    className="lg:hidden"
                    aria-label="Toggle database sidebar"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={rightPanelOpen ? "default" : "outline"}
                    size="sm"
                    onClick={toggleRightPanel}
                    className="lg:hidden"
                    aria-label="Toggle SQL editor panel"
                  >
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)] relative">
        {/* Left Sidebar - Desktop always visible, Mobile slide-in */}
        <div className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${
                leftPanelOpen ? 'translate-x-0' : '-translate-x-full'
              }` 
            : `w-80 ${leftPanelOpen ? 'block' : 'hidden'}`
          }
          border-r bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30
        `}>
          {/* Close button for mobile */}
          {isMobile && leftPanelOpen && (
            <div className="absolute top-4 right-4 z-10">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLeftPanelOpen(false)}
              >
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
            onAddTrigger={() => console.log('Add trigger')}
            onAddFunction={() => console.log('Add function')}
            onSelectTable={setSelectedTable}
            onDeleteTable={handleDeleteTable}
          />
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Desktop toggle buttons */}
          {!isMobile && (
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleLeftPanel}
                className={leftPanelOpen ? 'bg-muted' : ''}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {!isMobile && (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleRightPanel}
                className={rightPanelOpen ? 'bg-muted' : ''}
              >
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

        {/* Right Panel - Desktop toggleable, Mobile slide-in */}
        <div className={`
          ${isMobile 
            ? `fixed inset-y-0 right-0 z-50 w-96 transform transition-transform duration-300 ease-in-out ${
                rightPanelOpen ? 'translate-x-0' : 'translate-x-full'
              }` 
            : `w-96 ${rightPanelOpen ? 'block' : 'hidden'}`
          }
          border-l bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30
        `}>
          {/* Close button for mobile */}
          {isMobile && rightPanelOpen && (
            <div className="absolute top-4 left-4 z-10">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setRightPanelOpen(false)}
              >
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
              <SQLEditor
                onTablesImported={handleTablesImported}
                currentTables={tables}
              />
            </TabsContent>

            <TabsContent value="properties" className="flex-1 p-4 pt-2">
              <Card className="h-full">
                <div className="p-4">
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
              </Card>
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

export default Index;
