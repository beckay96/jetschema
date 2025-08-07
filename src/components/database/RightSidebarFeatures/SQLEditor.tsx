import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Play, Download, Upload, Copy, Check, ChevronDown } from 'lucide-react';
import { parseCreateTableStatement, convertParsedTablesToDatabase } from '@/utils/sqlParser';
import { generateAllTablesSQL } from '@/utils/sqlGenerator';
import { DatabaseTable } from '@/types/database';
import { toast } from 'sonner';

interface SQLEditorProps {
  onTablesImported?: (tables: DatabaseTable[]) => void;
  currentTables?: DatabaseTable[];
}
export function SQLEditor({
  onTablesImported,
  currentTables = []
}: SQLEditorProps) {
  // Start with empty SQL editor - no default template
  const [sqlCode, setSqlCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parsedTables, setParsedTables] = useState<DatabaseTable[]>([]);
  const [parseAction, setParseAction] = useState<'add' | 'overwrite' | null>(null);
  // Available SQL templates (empty for now, can be populated later)
  const [templates] = useState<{name: string, sql: string}[]>([]);

  const { theme } = useTheme();

  // No default template is loaded on initial render

  // Generate SQL from current tables
  const generatedSQL = useMemo(() => {
    if (currentTables.length === 0) {
      return '-- No tables in the canvas. Add some tables to see the generated SQL here.';
    }
    return generateAllTablesSQL(currentTables);
  }, [currentTables]);
  const handleParseSql = () => {
    try {
      console.log('Starting SQL parse with content:', sqlCode);
      const parsedResult = parseCreateTableStatement(sqlCode);
      console.log('Parsed tables result:', parsedResult);
      
      if (parsedResult.length === 0) {
        console.log('No tables found in SQL');
        toast.error('No CREATE TABLE statements found in the SQL');
        return;
      }
      
      const dbTables = convertParsedTablesToDatabase(parsedResult);
      console.log('Converted database tables:', dbTables);
      
      // Check for duplicate table names
      const tableNames = dbTables.map(table => table.name);
      const duplicateTableNames = tableNames.filter((name, index) => tableNames.indexOf(name) !== index);
      
      if (duplicateTableNames.length > 0) {
        toast.error(`Duplicate table names found: ${[...new Set(duplicateTableNames)].join(', ')}`);
        return;
      }
      
      // Check for duplicate field names within each table
      const tablesWithDuplicateFields = dbTables.filter(table => {
        const fieldNames = table.fields.map(field => field.name);
        const uniqueFieldNames = new Set(fieldNames);
        return fieldNames.length !== uniqueFieldNames.size;
      });
      
      if (tablesWithDuplicateFields.length > 0) {
        const tableDetails = tablesWithDuplicateFields.map(table => {
          const fieldNames = table.fields.map(field => field.name);
          const duplicateFields = fieldNames.filter(
            (name, index) => fieldNames.indexOf(name) !== index
          );
          return `${table.name} (duplicate fields: ${[...new Set(duplicateFields)].join(', ')})`;
        });
        
        toast.error(`Tables with duplicate field names: ${tableDetails.join('; ')}`);
        return;
      }
      
      // If project is empty, directly import without confirmation
      if (currentTables.length === 0) {
        onTablesImported?.(dbTables);
        toast.success(`Successfully imported ${dbTables.length} tables`);
        return;
      }
      
      // For non-empty projects, show confirmation dialog
      setParsedTables(dbTables);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error parsing SQL:', error);
      toast.error('Error parsing SQL. Please check your syntax.');
    }
  };
  
  const handleParseAction = (action: 'add' | 'overwrite') => {
    setParseAction(action);
    setIsDialogOpen(false);
    
    if (action === 'overwrite') {
      onTablesImported?.(parsedTables);
      toast.success(`Successfully imported ${parsedTables.length} tables`);
    } else if (action === 'add') {
      // Merge existing tables with new tables
      const mergedTables = [...currentTables, ...parsedTables];
      onTablesImported?.(mergedTables);
      toast.success(`Successfully added ${parsedTables.length} tables`);
    }
  };
  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('SQL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCopyGenerated = () => {
    handleCopyToClipboard(generatedSQL);
  };
  /**
   * Load a template into the SQL editor
   * @param templateSql - SQL template content to load
   */
  const handleLoadTemplate = (templateSql: string, templateName: string) => {
    setSqlCode(templateSql);
    toast.success(`Template "${templateName}" loaded`);
  };
  
  /**
   * Load an example e-commerce schema
   */
  const handleLoadExample = () => {
    const exampleSQL = `-- E-commerce Database Schema
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  inventory_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);`;
    setSqlCode(exampleSQL);
    toast.success('Example schema loaded');
  };
  return <Card className="h-screen flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center justify-between">
          <CardTitle className="text-lg">SQL Editor</CardTitle>
          <div className="flex md:flex-row sm:flex-col gap-1">
            <Button size="sm" onClick={handleParseSql} className="h-8">
              <Play className="h-3 w-3 mr-1" />
              Parse SQL
            </Button>
            
            {/* Templates dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Templates
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {templates.length > 0 ? (
                  templates.map((template, index) => (
                    <DropdownMenuItem 
                      key={index}
                      onClick={() => handleLoadTemplate(template.sql, template.name)}
                    >
                      {template.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No templates available</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLoadExample}>
                  Example: E-commerce
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            PostgreSQL
          </Badge>
          <Badge variant="outline" className="text-xs">
            {currentTables.length} tables
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs defaultValue="editor" className="h-full flex flex-col">
          <TabsList className="mx-4 mb-2 w-fit">
            <TabsTrigger value="editor">SQL Editor</TabsTrigger>
            <TabsTrigger value="generated">Generated SQL</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 mx-4 mb-4">
            <div className="h-full border border-border bg-gray-200 dark:bg-black rounded-lg overflow-hidden">
              <Editor height="100%" language="sql" value={sqlCode} onChange={value => setSqlCode(value || '')} theme={theme === 'dark' ? 'vs-dark' : 'vs-light'} options={{
              minimap: {
                enabled: false
              },
              fontSize: 14,
              lineHeight: 20,
              padding: {
                top: 16,
                bottom: 16
              },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              tabSize: 2,
              insertSpaces: true
            }} />
            </div>
          </TabsContent>

          <TabsContent value="generated" className="flex-1 mx-4 mb-4">
            <div className="h-full border border-border rounded-lg overflow-hidden relative">
              <div className="absolute top-2 right-2 z-10">
                <Button variant="outline" size="sm" onClick={handleCopyGenerated} className="h-7 text-xs">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <Editor 
                height="100%" 
                language="sql" 
                value={generatedSQL}
                theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 20,
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true
                }} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Parse Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Parse SQL</DialogTitle>
            <DialogDescription>
              You have existing tables in your project. What would you like to do with the parsed tables?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              You're about to import {parsedTables.length} table(s).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleParseAction('add')}>
              Add to Existing
            </Button>
            <Button variant="destructive" onClick={() => handleParseAction('overwrite')}>
              Overwrite All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>;
}