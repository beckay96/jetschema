import { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [triggers, setTriggers] = useState<DatabaseTrigger[]>([]);
  const [functions, setFunctions] = useState<DatabaseFunction[]>([]);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);

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
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
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

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
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
      </div>
    </div>
  );
};

export default Index;
