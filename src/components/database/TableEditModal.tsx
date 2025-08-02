import { useState, useEffect } from 'react';
import { DatabaseTable, DatabaseField, DataType } from '@/types/database';
import { DataTypePill } from './DataTypePill';
import { ForeignKeySelector } from './ForeignKeySelector';
import { FieldCommentButton } from './FieldCommentButton';
import { CommentModal } from './CommentModal';
import { ValidationFeedback, InlineValidationIndicator } from './ValidationFeedback';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Key, Link, Star, MessageCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { validateTable, validateTableName, validateColumnName, ValidationMessage } from '@/utils/databaseValidation';

interface TableEditModalProps {
  table: DatabaseTable;
  allTables: DatabaseTable[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTableUpdate: (updatedTable: DatabaseTable) => void;
}

const DATA_TYPES: DataType[] = [
  'UUID', 'TEXT', 'VARCHAR', 'STRING', 'INT', 'INTEGER', 'INT4', 'INT8', 
  'BIGINT', 'SERIAL', 'BOOLEAN', 'BOOL', 'TIMESTAMP', 'TIMESTAMPTZ', 
  'DATE', 'TIME', 'JSON', 'JSONB', 'DECIMAL', 'NUMERIC', 'FLOAT', 
  'REAL', 'EMAIL', 'ENUM', 'ARRAY', 'BYTEA'
];

export function TableEditModal({ 
  table, 
  allTables, 
  open, 
  onOpenChange, 
  onTableUpdate 
}: TableEditModalProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingTableName, setEditingTableName] = useState(false);
  const [foreignKeySelector, setForeignKeySelector] = useState<string | null>(null);
  const [currentTable, setCurrentTable] = useState(table);
  const [validationResults, setValidationResults] = useState<ValidationMessage[]>([]);
  const [fieldValidation, setFieldValidation] = useState<Record<string, ValidationMessage[]>>({});
  const [tableNameValidation, setTableNameValidation] = useState<ValidationMessage[]>([]);
  // RLS toggle state
  const [hasRlsEnabled, setHasRlsEnabled] = useState((table as any).hasRlsEnabled || false);
  const [commentModal, setCommentModal] = useState<{ open: boolean; tableName: string; fieldName: string }>({
    open: false,
    tableName: '',
    fieldName: ''
  });

  useEffect(() => {
    setCurrentTable(table);
    setEditingField(null);
    setEditingTableName(false);
    setForeignKeySelector(null);
    setHasRlsEnabled((table as any).hasRlsEnabled || false);
  }, [table]);

  useEffect(() => {
    // Validate table name
    const tableNameResults = validateTableName(currentTable.name);
    setTableNameValidation(tableNameResults);
    
    // Validate each field
    const fieldValidationResults: Record<string, ValidationMessage[]> = {};
    currentTable.fields.forEach(field => {
      const columnMessages = validateColumnName(field.name);
      fieldValidationResults[field.id] = columnMessages;
    });
    setFieldValidation(fieldValidationResults);
    
    // Validate entire table
    const tableWithRls = {
      ...currentTable,
      hasRlsEnabled
    };
    const { messages } = validateTable(tableWithRls as any);
    setValidationResults(messages);
  }, [currentTable, hasRlsEnabled]);

  const updateField = (fieldId: string, updates: Partial<DatabaseField>) => {
    const updatedTable = {
      ...currentTable,
      fields: currentTable.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    };
    setCurrentTable(updatedTable);
    onTableUpdate(updatedTable);
  };

  const addField = () => {
    const newField: DatabaseField = {
      id: `field-${Date.now()}`,
      name: 'new_field',
      type: 'TEXT',
      nullable: true,
      primaryKey: false,
      unique: false
    };

    const updatedTable = {
      ...currentTable,
      fields: [...currentTable.fields, newField]
    };

    setCurrentTable(updatedTable);
    onTableUpdate(updatedTable);
    setEditingField(newField.id);
    toast.success('New field added!');
  };

  const deleteField = (fieldId: string) => {
    const updatedTable = {
      ...currentTable,
      fields: currentTable.fields.filter(field => field.id !== fieldId)
    };
    setCurrentTable(updatedTable);
    onTableUpdate(updatedTable);
    toast.success('Field deleted!');
  };

  const updateTableName = (name: string) => {
    const updatedTable = { ...currentTable, name };
    setCurrentTable(updatedTable);
    onTableUpdate(updatedTable);
  };

  const handleAddComment = (tableName: string, fieldName: string) => {
    setCommentModal({ open: true, tableName, fieldName });
  };

  const handleCommentSubmit = (comment: string, tagInChat: boolean, mentions: string[]) => {
    // TODO: Implement comment submission to backend
    console.log('Comment submitted:', { 
      comment, 
      tagInChat, 
      mentions,
      table: commentModal.tableName, 
      field: commentModal.fieldName 
    });
    toast.success('Comment added successfully!');
  };

  const handleTableComment = () => {
    setCommentModal({ open: true, tableName: currentTable.name, fieldName: '' });
  };

  const handleSave = () => {
    // Include RLS state in the saved table
    const tableWithRls = {
      ...currentTable,
      hasRlsEnabled
    };
    onTableUpdate(tableWithRls as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingTableName ? (
              <div className="flex-1">
                <Input
                  value={currentTable.name}
                  onChange={(e) => setCurrentTable({ ...currentTable, name: e.target.value })}
                  onBlur={() => setEditingTableName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingTableName(false);
                    }
                  }}
                  autoFocus
                  className="h-6 text-lg font-semibold"
                />
              </div>
            ) : (
              <div onClick={() => setEditingTableName(true)} className="cursor-pointer flex items-center gap-2">
                {currentTable.name}
                {tableNameValidation.length > 0 && (
                  <InlineValidationIndicator messages={tableNameValidation} />
                )}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-4 mb-4">
            {/* Validation summary */}
            {validationResults.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">Schema Validation</h4>
                <ValidationFeedback messages={validationResults} showDetails={true} />
              </div>
            )}
            
            {/* RLS toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Row-Level Security (RLS)</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="rls-toggle" 
                  checked={hasRlsEnabled}
                  onCheckedChange={(checked) => setHasRlsEnabled(!!checked)}
                />
                <label htmlFor="rls-toggle" className="text-sm cursor-pointer">
                  {hasRlsEnabled ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Fields</h3>
            <Button size="sm" variant="outline" onClick={addField}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Field
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Constraints</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTable.fields.map(field => (
                  <TableRow 
                    key={field.id}
                    className={cn(
                      "group hover:bg-muted/50 transition-colors",
                      field.primaryKey && "bg-gradient-to-r from-[hsl(var(--status-primary-key)/0.15)] to-transparent dark:from-[hsl(var(--status-primary-key)/0.2)] dark:to-transparent"
                    )}
                  >
                    <TableCell className="p-2">
                      <div className="flex items-center gap-1 flex-col">
                        <div className="flex items-center gap-1.5">
                          {field.primaryKey && (
                            <Key className="h-3 w-3" style={{ color: 'hsl(var(--status-primary-key))' }} />
                          )}
                          {field.foreignKey && (
                            <Link className="h-3 w-3" style={{ color: 'hsl(var(--status-foreign-key))' }} />
                          )}
                          {field.unique && !field.primaryKey && (
                            <Star className="h-3 w-3" style={{ color: 'hsl(var(--status-unique))' }} />
                          )}
                        </div>
                        {field.foreignKey && (
                          <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700">
                            → {field.foreignKey.table}.{field.foreignKey.field}
                          </Badge>
                        )}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`unique-${field.id}`}
                            checked={field.unique}
                            onCheckedChange={(checked) => 
                              updateField(field.id, { unique: !!checked })
                            }
                          />
                          <label htmlFor={`unique-${field.id}`} className="text-xs font-medium">
                            Unique
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`nullable-${field.id}`}
                            checked={field.nullable}
                            onCheckedChange={(checked) => 
                              updateField(field.id, { nullable: !!checked })
                            }
                            disabled={field.primaryKey}
                          />
                          <label htmlFor={`nullable-${field.id}`} className="text-xs font-medium">
                            Nullable
                          </label>
                        </div>

                        <Popover 
                          open={foreignKeySelector === field.id}
                          onOpenChange={(open) => {
                            if (!open) setForeignKeySelector(null);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-6 px-2 text-xs",
                                field.foreignKey 
                                  ? "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300 text-orange-700" 
                                  : "hover:bg-muted"
                              )}
                              onClick={() => setForeignKeySelector(field.id)}
                            >
                              <Link className="h-3 w-3 mr-1" />
                              FK
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-auto" side="left">
                            <ForeignKeySelector
                              tables={allTables}
                              currentField={field}
                              currentTableId={currentTable.id}
                              onUpdate={(foreignKey) => updateField(field.id, { foreignKey })}
                              onClose={() => setForeignKeySelector(null)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                    
                    {/* Comments Cell */}
                    <TableCell className="p-2">
                      <FieldCommentButton
                        tableName={currentTable.name}
                        fieldName={field.name}
                        onAddComment={handleAddComment}
                        compact={true}
                      />
                    </TableCell>
                    
                    <TableCell className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteField(field.id)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Comment Modal */}
          <CommentModal
            open={commentModal.open}
            onOpenChange={(open) => setCommentModal(prev => ({ ...prev, open }))}
            tableName={commentModal.tableName}
            fieldName={commentModal.fieldName || 'Table'}
            onSubmit={handleCommentSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}