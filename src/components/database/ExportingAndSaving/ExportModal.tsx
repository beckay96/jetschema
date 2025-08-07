import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Download, Copy, Check } from 'lucide-react';
import { DatabaseTable } from '@/types/database';
import { generateAllTablesSQL, copyToClipboard, downloadTextFile } from '@/utils/sqlGenerator';
import { toast } from 'sonner';

interface ExportModalProps {
  tables: DatabaseTable[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
}

export function ExportModal({ tables, open, onOpenChange, projectName }: ExportModalProps) {
  const [copiedOption, setCopiedOption] = useState<string | null>(null);

  const handleCopySQL = async () => {
    try {
      const sql = generateAllTablesSQL(tables);
      await copyToClipboard(sql);
      setCopiedOption('sql');
      toast.success('SQL copied to clipboard');
      setTimeout(() => setCopiedOption(null), 2000);
    } catch (error) {
      toast.error('Failed to copy SQL');
    }
  };

  const handleDownloadSQL = () => {
    const sql = generateAllTablesSQL(tables);
    const filename = `${projectName.replace(/\s+/g, '_').toLowerCase()}_schema.sql`;
    downloadTextFile(sql, filename);
    toast.success('SQL file downloaded');
  };

  const handleDownloadPDF = () => {
    // Generate a simple text representation that can be converted to PDF
    const content = generatePDFContent();
    const filename = `${projectName.replace(/\s+/g, '_').toLowerCase()}_tables.txt`;
    downloadTextFile(content, filename);
    toast.success('Tables documentation downloaded');
  };

  const generatePDFContent = () => {
    let content = `${projectName} - Database Schema\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    content += '='.repeat(50) + '\n\n';

    tables.forEach((table, index) => {
      content += `Table ${index + 1}: ${table.name}\n`;
      content += '-'.repeat(30) + '\n';
      
      if (table.comment) {
        content += `Description: ${table.comment}\n\n`;
      }
      
      content += 'Fields:\n';
      table.fields.forEach(field => {
        content += `  - ${field.name} (${field.type})`;
        if (field.primaryKey) content += ' [PRIMARY KEY]';
        if (field.unique && !field.primaryKey) content += ' [UNIQUE]';
        if (!field.nullable) content += ' [NOT NULL]';
        if (field.foreignKey) content += ` [FK -> ${field.foreignKey.table}.${field.foreignKey.field}]`;
        content += '\n';
      });
      
      content += '\n' + '='.repeat(50) + '\n\n';
    });

    return content;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Database Schema</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleCopySQL}>
            <CardContent className="p-4 flex items-center gap-3">
              {copiedOption === 'sql' ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 text-primary" />
              )}
              <div>
                <h4 className="font-medium">Copy SQL to Clipboard</h4>
                <p className="text-sm text-muted-foreground">Copy complete schema as SQL</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleDownloadSQL}>
            <CardContent className="p-4 flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-medium">Download SQL File</h4>
                <p className="text-sm text-muted-foreground">Save schema as .sql file</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleDownloadPDF}>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-medium">Download Tables Documentation</h4>
                <p className="text-sm text-muted-foreground">Save tables overview as text file</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}