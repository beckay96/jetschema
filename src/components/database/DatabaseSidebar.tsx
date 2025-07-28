import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Table, Plus, Settings, Zap, Code, Search, FileText, Save, Trash2, Shield, ArrowUpDown, Share2, Lock, Unlock } from 'lucide-react';
import { DatabaseTable, DatabaseTrigger, DatabaseFunction } from '@/types/database';
import { ExportModal } from './ExportModal';
import { TriggerFunctionModal } from './TriggerFunctionModal';
import { RLSPolicyModal } from './RLSPolicyModal';
import { IndexModal } from './IndexModal';
import { useRLSPolicies } from '@/hooks/useRLSPolicies';
import { useIndexes } from '@/hooks/useIndexes';
import { useValidation } from '@/hooks/useValidation';
import { DragDropTableList } from './DragDropTableList';
import { ValidationPanel } from './ValidationPanel';
import { DataTypePill } from './DataTypePill';
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
  onSaveProject?: () => void;
  onReorderTables?: (tables: DatabaseTable[]) => void;
  onShare?: () => void;
}
export function DatabaseSidebar({
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
  onSaveProject,
  onReorderTables,
  onShare
}: DatabaseSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectName, setProjectName] = useState('Database Schema');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [showRLSModal, setShowRLSModal] = useState(false);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [isDragLocked, setIsDragLocked] = useState(false);

  // RLS and Index hooks
  const { policies, savePolicy, updatePolicy, deletePolicy } = useRLSPolicies(projectId);
  const { indexes, saveIndex, updateIndex, deleteIndex } = useIndexes(projectId);
  
  // Validation hook
  const { errors: validationErrors, loading: validationLoading, runValidation } = useValidation(tables, policies, indexes);
  
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    table.fields.some(field => field.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  return <Card className="h-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5 border border-primary/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                DataBlaze
              </CardTitle>
              <p className="text-xs text-muted-foreground">Database design but FAST!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0" 
              onClick={() => setIsDragLocked(!isDragLocked)}
              title={isDragLocked ? "Unlock drag & drop" : "Lock drag & drop"}
            >
              {isDragLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onShare}>
              <Share2 className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowExportModal(true)}>
              <FileText className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Input 
            placeholder="Project name" 
            value={projectName} 
            onChange={e => setProjectName(e.target.value)} 
            className="h-8 text-sm bg-background/50 border-primary/20 focus:border-primary/40" 
          />
          
          <Button size="sm" variant="default" className="w-full h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" onClick={onSaveProject}>
            <Save className="h-3 w-3 mr-1" />
            Save Project
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <Tabs defaultValue="tables" className="h-full flex flex-col overflow-hidden">
          <TabsList className="mb-2 w-full mx-2 bg-gradient-to-r from-muted/50 to-muted/30 flex flex-wrap">
            <TabsTrigger value="tables" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Table className="h-3 w-3 mr-1" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="rls" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-3 w-3 mr-1" />
              RLS
            </TabsTrigger>
            <TabsTrigger value="indexes" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="h-3 w-3 mr-1" />
              Indexes
            </TabsTrigger>
            <TabsTrigger value="triggers" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="h-3 w-3 mr-1" />
              Triggers
            </TabsTrigger>
            <TabsTrigger value="functions" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Code className="h-3 w-3 mr-1" />
              Functions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="flex-1 mx-4 mb-4 space-y-3 overflow-hidden flex flex-col">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search tables..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="h-8 pl-7 text-sm bg-background/50 border-primary/20 focus:border-primary/40" 
                  />
                </div>
                <Button size="sm" onClick={onAddTable} className="h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex gap-2 text-xs">
                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
                  {tables.length} tables
                </Badge>
                <Badge variant="outline" className="text-xs bg-secondary/10 border-secondary/30 text-secondary-foreground">
                  {tables.reduce((acc, table) => acc + table.fields.length, 0)} fields
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                <DragDropTableList
                  tables={filteredTables}
                  selectedTable={selectedTable}
                  onSelectTable={onSelectTable}
                  onReorderTables={onReorderTables}
                  isDragLocked={isDragLocked}
                />

                {filteredTables.length === 0 && <div className="text-center py-8 text-muted-foreground">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-muted/50 mb-4">
                      <Table className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tables found</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10" onClick={onAddTable}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Table
                    </Button>
                  </div>}
                
                {/* Validation Panel */}
                {validationErrors.length > 0 && (
                  <div className="mt-4">
                    <ValidationPanel 
                      errors={validationErrors}
                      onRefreshValidation={runValidation}
                      loading={validationLoading}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* RLS Policies Tab */}
          <TabsContent value="rls" className="flex-1 mx-4 mb-4 overflow-hidden flex flex-col">
            <div className="space-y-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Row Level Security
                </Label>
                <Button size="sm" onClick={() => setShowRLSModal(true)} className="h-8 bg-gradient-to-r from-primary to-primary/80">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {policies.map(policy => (
                  <Card key={policy.id} className="cursor-pointer hover:bg-gradient-to-br hover:from-muted/30 hover:to-muted/20 transition-all">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{policy.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {policy.command}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {policy.table_name} • {policy.is_permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {policies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-muted/50 mb-4">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No RLS policies defined</p>
                      <p className="text-xs mt-1">Secure your data with access policies</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Indexes Tab */}
          <TabsContent value="indexes" className="flex-1 mx-4 mb-4 overflow-hidden flex flex-col">
            <div className="space-y-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Database Indexes
                </Label>
                <Button size="sm" onClick={() => setShowIndexModal(true)} className="h-8 bg-gradient-to-r from-primary to-primary/80">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {indexes.map(index => (
                  <Card key={index.id} className="cursor-pointer hover:bg-gradient-to-br hover:from-muted/30 hover:to-muted/20 transition-all">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{index.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {index.index_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {index.table_name} • {index.columns.join(', ')} • {index.is_unique ? 'UNIQUE' : 'NON-UNIQUE'}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {indexes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-muted/50 mb-4">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No indexes defined</p>
                      <p className="text-xs mt-1">Speed up queries with indexes</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="triggers" className="flex-1 mx-4 mb-4 overflow-hidden flex flex-col">
            <div className="space-y-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Database Triggers
                </Label>
                <Button size="sm" onClick={() => setShowTriggerModal(true)} className="h-8 bg-gradient-to-r from-primary to-primary/80">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {triggers.map(trigger => <Card key={trigger.id} className="cursor-pointer hover:bg-gradient-to-br hover:from-muted/30 hover:to-muted/20 transition-all">
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
                  </Card>)}

                {triggers.length === 0 && <div className="text-center py-8 text-muted-foreground">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-muted/50 mb-4">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No triggers defined</p>
                      <p className="text-xs mt-1">Automate actions with triggers</p>
                    </div>
                  </div>}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="functions" className="flex-1 mx-4 mb-4 overflow-hidden flex flex-col">
            <div className="space-y-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" />
                  Database Functions
                </Label>
                <Button size="sm" onClick={() => setShowFunctionModal(true)} className="h-8 bg-gradient-to-r from-primary to-primary/80">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {functions.map(func => <Card key={func.id} className="cursor-pointer hover:bg-gradient-to-br hover:from-muted/30 hover:to-muted/20 transition-all">
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
                  </Card>)}

                {functions.length === 0 && <div className="text-center py-8 text-muted-foreground">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-muted/50 mb-4">
                      <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No functions defined</p>
                      <p className="text-xs mt-1">Create reusable database logic</p>
                    </div>
                  </div>}
              </div>
            </ScrollArea>
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
        onSave={(trigger) => {
          onAddTrigger?.(trigger as any);
          setShowTriggerModal(false);
        }}
      />

      <TriggerFunctionModal
        mode="function"
        open={showFunctionModal}
        onOpenChange={setShowFunctionModal}
        tables={tables}
        functions={[]}
        onSave={(func) => {
          onAddFunction?.(func as any);
          setShowFunctionModal(false);
        }}
      />

      <RLSPolicyModal
        open={showRLSModal}
        onOpenChange={setShowRLSModal}
        onSave={async (policy) => { await savePolicy(policy); }}
        tables={tables}
        projectId={projectId || ''}
      />

      <IndexModal
        open={showIndexModal}
        onOpenChange={setShowIndexModal}
        onSave={async (index) => { await saveIndex(index); }}
        tables={tables}
        projectId={projectId || ''}
      />
    </Card>;
}