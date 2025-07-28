import { useState } from 'react';
import { DatabaseCanvas } from '@/components/database/DatabaseCanvas';
import { DatabaseTableView } from '@/components/database/DatabaseTableView';
import { DatabaseSidebar } from '@/components/database/DatabaseSidebar';
import { SQLEditor } from '@/components/database/SQLEditor';
import { CommentModal } from '@/components/database/CommentModal';
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
  Grid3X3,
  Network,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose
} from '@/components/ui/drawer';

const Index = () => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [triggers, setTriggers] = useState<DatabaseTrigger[]>([]);
  const [functions, setFunctions] = useState<DatabaseFunction[]>([]);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [commentModal, setCommentModal] = useState<{
    open: boolean;
    tableName: string;
    fieldName: string;
  }>({ open: false, tableName: '', fieldName: '' });
  const isMobile = useIsMobile();

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

  const handleAddComment = (tableName: string, fieldName: string) => {
    setCommentModal({ open: true, tableName, fieldName });
  };

  const handleCommentSubmit = (comment: string, tagInChat: boolean) => {
    // TODO: Save comment to database and handle chat tagging
    console.log('Comment submitted:', { 
      tableName: commentModal.tableName, 
      fieldName: commentModal.fieldName, 
      comment, 
      tagInChat 
    });
    
    toast.success('Comment added successfully!');
    
    if (tagInChat) {
      toast.info('Field tagged in team chat!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              {isMobile && (
                <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="h-[85vh]">
                    <DrawerHeader className="text-left">
                      <DrawerTitle className="flex items-center justify-between">
                        Database Objects
                        <DrawerClose asChild>
                          <Button variant="ghost" size="sm" className="p-1">
                            <X className="h-4 w-4" />
                          </Button>
                        </DrawerClose>
                      </DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-4 flex-1 overflow-auto">
                      <DatabaseSidebar
                        tables={tables}
                        triggers={triggers}
                        functions={functions}
                        selectedTable={selectedTable}
                        onAddTable={handleAddTable}
                        onAddTrigger={() => console.log('Add trigger')}
                        onAddFunction={() => console.log('Add function')}
                        onSelectTable={(table) => {
                          setSelectedTable(table);
                          setSidebarOpen(false);
                        }}
                        onDeleteTable={handleDeleteTable}
                      />
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
              
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
                  <Database className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Database Designer Pro
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                    Visual database design and SQL management tool
                  </p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-base font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    DB Designer
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              <Badge variant="secondary" className="hidden sm:flex text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {tables.length} tables
              </Badge>
              
              {isMobile && (
                <Drawer open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm" className="p-2">
                      <Code className="h-4 w-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="h-[85vh]">
                    <DrawerHeader className="text-left">
                      <DrawerTitle className="flex items-center justify-between">
                        SQL & Properties
                        <DrawerClose asChild>
                          <Button variant="ghost" size="sm" className="p-1">
                            <X className="h-4 w-4" />
                          </Button>
                        </DrawerClose>
                      </DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-4 flex-1 overflow-auto">
                      <Tabs defaultValue="sql" className="h-full flex flex-col">
                        <TabsList className="w-full mb-4">
                          <TabsTrigger value="sql" className="flex-1">
                            <Code className="h-4 w-4 mr-2" />
                            SQL
                          </TabsTrigger>
                  <TabsTrigger value="properties" className="flex-1">
                    <Palette className="h-4 w-4 mr-2" />
                    Create
                  </TabsTrigger>
                        </TabsList>

                        <TabsContent value="sql" className="flex-1">
                          <SQLEditor
                            onTablesImported={handleTablesImported}
                            currentTables={tables}
                          />
                        </TabsContent>

                        <TabsContent value="properties" className="flex-1">
                          <Card className="h-full">
                            <div className="p-4 space-y-4">
                              <div>
                                <h3 className="font-semibold mb-2">Manual Creation</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Create tables, fields, and relationships manually
                                </p>
                              </div>
                              
                              <div className="space-y-3">
                                <Button 
                                  onClick={handleAddTable} 
                                  className="w-full justify-start"
                                  variant="outline"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add New Table
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  className="w-full justify-start" 
                                  disabled
                                >
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  AI Chat - Coming Soon!
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
              
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="sm:hidden p-2">
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex ${isMobile ? 'flex-col' : ''} h-[calc(100vh-80px)]`}>
        {/* Desktop Left Sidebar */}
        {!isMobile && (
          <div className="w-80 border-r bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30">
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
        )}

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="p-2 md:p-3 border-b bg-card/30 backdrop-blur">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'canvas' | 'table')} className="w-full md:w-fit">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="canvas" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Network className="h-3 w-3 md:h-4 md:w-4" />
                  {isMobile ? 'Canvas' : 'Canvas View'}
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Grid3X3 className="h-3 w-3 md:h-4 md:w-4" />
                  {isMobile ? 'Table' : 'Table View'}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex-1">
            {viewMode === 'canvas' ? (
              <DatabaseCanvas
                tables={tables}
                onTableUpdate={setTables}
                onTableSelect={setSelectedTable}
                onAddComment={handleAddComment}
                selectedTable={selectedTable}
              />
            ) : (
              <DatabaseTableView
                tables={tables}
                onTableUpdate={setTables}
                onTableSelect={setSelectedTable}
                selectedTable={selectedTable}
              />
            )}
          </div>
        </div>

        {/* Desktop Right Panel */}
        {!isMobile && (
          <div className="w-96 border-l bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30">
            <Tabs defaultValue="sql" className="h-full flex flex-col">
              <div className="p-4 pb-0">
                <TabsList className="w-full">
                  <TabsTrigger value="sql" className="flex-1">
                    <Code className="h-4 w-4 mr-2" />
                    SQL
                  </TabsTrigger>
                          <TabsTrigger value="properties" className="flex-1">
                            <Palette className="h-4 w-4 mr-2" />
                            Create
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
                  <div className="p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Manual Creation</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create tables, fields, and relationships manually
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        onClick={handleAddTable} 
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Table
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        disabled
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Chat - Coming Soon!
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <CommentModal
        open={commentModal.open}
        onOpenChange={(open) => setCommentModal(prev => ({ ...prev, open }))}
        tableName={commentModal.tableName}
        fieldName={commentModal.fieldName}
        onSubmit={handleCommentSubmit}
      />
    </div>
  );
};

export default Index;
