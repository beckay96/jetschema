import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Download, Upload, Copy, Check } from 'lucide-react';
import { parseCreateTableStatement, convertParsedTablesToDatabase } from '@/utils/sqlParser';
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
  const [sqlCode, setSqlCode] = useState(`-- Paste your SQL schema here
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`);
  const [copied, setCopied] = useState(false);
  const handleParseSql = () => {
    try {
      const parsedTables = parseCreateTableStatement(sqlCode);
      if (parsedTables.length === 0) {
        toast.error('No CREATE TABLE statements found in the SQL');
        return;
      }
      const dbTables = convertParsedTablesToDatabase(parsedTables);
      onTablesImported?.(dbTables);
      toast.success(`Successfully imported ${dbTables.length} tables`);
    } catch (error) {
      console.error('Error parsing SQL:', error);
      toast.error('Error parsing SQL. Please check your syntax.');
    }
  };
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      toast.success('SQL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };
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
  return <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center justify-between">
          <CardTitle className="text-lg">SQL Editor</CardTitle>
          <div className="flex md:flex-row  sm:flex-col gap-1">
            <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="h-8">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLoadExample} className="h-8">
              <Upload className="h-3 w-3 mr-1" />
              Example
            </Button>
            <Button size="sm" onClick={handleParseSql} className="h-8">
              <Play className="h-3 w-3 mr-1" />
              Parse SQL
            </Button>
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
            <div className="h-full border border-border rounded-lg overflow-hidden">
              <Editor height="100%" language="sql" value={sqlCode} onChange={value => setSqlCode(value || '')} theme="vs-light" options={{
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
            <div className="h-full border border-border rounded-lg overflow-hidden">
              <Editor height="100%" language="sql" value="-- Generated SQL will appear here when you have tables in the canvas" options={{
              readOnly: true,
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
              automaticLayout: true
            }} theme="vs-light" />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>;
}