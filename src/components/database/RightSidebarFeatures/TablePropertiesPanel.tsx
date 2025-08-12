import { useState, useEffect, useCallback } from 'react';
import { DatabaseTable, DatabaseField, DataType } from '@/types/database';
import { DataTypePill } from '@/components/Settings/DataTypePill';
import { ForeignKeySelector } from '@/components/database/DatabaseTablesComponents/EditingTables/ForeignKeySelector';
import { FieldCommentButton } from '@/components/database/DatabaseTablesComponents/EditingTables/FieldCommentButton';
import { ValidationFeedback, InlineValidationIndicator } from '@/components/database/RightSidebarFeatures/ValidationFeedback';
import { validateTable, validateTableName, validateColumnName, ValidationMessage } from '@/utils/databaseValidation';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Key, Link, Star, Shield, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TablePropertiesPanelProps {
  table: DatabaseTable;
  allTables: DatabaseTable[];
  onTableUpdate: (updatedTable: DatabaseTable) => void;
  onHighlightRequested?: () => void;
}

const DATA_TYPES: DataType[] = [
  'UUID', 'TEXT', 'VARCHAR', 'STRING', 'INT', 'INTEGER', 'INT4', 'INT8', 
  'BIGINT', 'SERIAL', 'BOOLEAN', 'BOOL', 'TIMESTAMP', 'TIMESTAMPTZ', 
  'DATE', 'TIME', 'JSON', 'JSONB', 'DECIMAL', 'NUMERIC', 'FLOAT', 
  'REAL', 'EMAIL', 'ENUM', 'ARRAY', 'BYTEA'
];

export function TablePropertiesPanel({ 
  table, 
  allTables, 
  onTableUpdate,
  onHighlightRequested 
}: TablePropertiesPanelProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingTableName, setEditingTableName] = useState(false);
  const [foreignKeySelector, setForeignKeySelector] = useState<string | null>(null);
  const [currentTable, setCurrentTable] = useState(table);
  const [validationResults, setValidationResults] = useState<ValidationMessage[]>([]);
  const [fieldValidation, setFieldValidation] = useState<Record<string, ValidationMessage[]>>({});
  const [tableNameValidation, setTableNameValidation] = useState<ValidationMessage[]>([]);
  const [hasRlsEnabled, setHasRlsEnabled] = useState((table as any).hasRlsEnabled || false);

  // Update local state when table prop changes
  useEffect(() => {
    setCurrentTable(table);
    setEditingField(null);
    setEditingTableName(false);
    setForeignKeySelector(null);
    setHasRlsEnabled((table as any).hasRlsEnabled || false);
  }, [table]);

  // Run validation whenever table changes
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

  // Add a new field to the table
  const addField = useCallback(() => {
    const newField: DatabaseField = {
      id: `field-${Date.now()}`,
      name: 'new_field',
      type: 'TEXT',
      nullable: true,
      primaryKey: false,
      unique: false,
      indexed: false
    };

    const updatedTable = {
      ...currentTable,
      fields: [...currentTable.fields, newField]
    };

    setCurrentTable(updatedTable);
    onTableUpdate(updatedTable);
    setEditingField(newField.id);
    toast.success('New field added!');
  }, [currentTable, onTableUpdate]);

  // Update a field's properties
  const updateField = (id: string, updates: Partial<DatabaseField>) => {
    const updatedFields = currentTable.fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    );
    
    const updatedTable = { ...currentTable, fields: updatedFields };
    setCurrentTable(updatedTable);
    onTableUpdate(updatedTable);
  };

  // Handle field edit
  const handleEditField = (fieldId: string) => {
    setEditingField(fieldId);
    if (onHighlightRequested) onHighlightRequested();
  };

  // Delete a field
  const deleteField = (fieldId: string) => {
    const updatedTable = {
      ...currentTable,
      fields: currentTable.fields.filter(field => field.id !== fieldId)
    };
    setCurrentTable(updatedTable);
    onTableUpdate(updatedTable);
    toast.success('Field deleted!');
  };

  // Update table name
  const updateTableName = (name: string) => {
    const updatedTable = { ...currentTable, name };
    setCurrentTable(updatedTable);
    onTableUpdate(updatedTable);
  };

  return (
    <div className="space-y-4 max-h-screen overflow-y-auto">
      {/* Table Name */}
      <div className="flex items-center mb-4">
        {editingTableName ? (
          <div className="flex-1">
            <Input
              value={currentTable.name}
              onChange={(e) => setCurrentTable({ ...currentTable, name: e.target.value })}
              onBlur={() => {
                setEditingTableName(false);
                updateTableName(currentTable.name);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingTableName(false);
                  updateTableName(currentTable.name);
                }
              }}
              autoFocus
              className="h-8 text-lg font-semibold"
            />
          </div>
        ) : (
          <div 
            onClick={() => setEditingTableName(true)} 
            className="cursor-pointer flex items-center gap-2"
          >
            <h3 className="text-lg font-semibold">{currentTable.name}</h3>
            {tableNameValidation.length > 0 && (
              <InlineValidationIndicator messages={tableNameValidation} />
            )}
          </div>
        )}
      </div>

      {/* Validation summary */}
      {validationResults.length > 0 && (
        <div className="bg-muted/50 p-3 rounded-md mb-4">
          <h4 className="text-sm font-medium mb-2">Schema Validation</h4>
          <ValidationFeedback messages={validationResults} showDetails={true} />
        </div>
      )}
      
      {/* RLS toggle */}
      <div className="flex items-center justify-start gap-x-4 mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Row-Level Security (RLS)</span>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox 
            id="rls-toggle" 
            checked={hasRlsEnabled}
            onCheckedChange={(checked) => {
              setHasRlsEnabled(!!checked);
              const updatedTable = { 
                ...currentTable, 
                hasRlsEnabled: !!checked 
              };
              onTableUpdate(updatedTable as any);
            }}
          />
          <label htmlFor="rls-toggle" className="text-sm cursor-pointer">
            {hasRlsEnabled ? 'Enabled' : 'Disabled'}
          </label>
        </div>
      </div>
      
      {/* Fields header with add button */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Fields</h3>
        <Button size="sm" variant="outline" onClick={addField}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Field
        </Button>
      </div>

      {/* Fields table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/10">
              <TableHead className="w-2"></TableHead>
              <TableHead className="w-[20%] justify-center items-center">Name</TableHead>
              <TableHead className="w-[20%] justify-center items-center">Type</TableHead>
              <TableHead className="w-[44%] justify-center items-center">Constraints</TableHead>
              <TableHead className="w-[6%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTable.fields.map(field => (
              <TableRow 
                key={field.id}
                className={cn(
                  "group hover:bg-muted/50 transition-colors border-b border-muted",
                  field.primaryKey && "bg-gradient-to-r from-[hsl(var(--status-primary-key)/0.15)] to-transparent dark:from-[hsl(var(--status-primary-key)/0.2)] dark:to-transparent text-black dark:text-white"
                )}
              >
                {/* Field icons column */}
                <TableCell className="p-2 w-2">
                  <div className="flex items-center gap-1.5 ">
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
                </TableCell>
                
                {/* Field Name column */}
                <TableCell className="p-2">
                  <div className="flex items-center justify-center h-full gap-2">
                    {editingField === field.id ? (
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingField(null);
                          }
                        }}
                        autoFocus
                        className="h-7 text-sm"
                      />
                    ) : (
                      <>
                        <div 
                          onClick={() => setEditingField(field.id)} 
                          className="cursor-pointer hover:underline flex items-center gap-2"
                        >
                          <span className="text-sm">{field.name}</span>
                          {fieldValidation[field.id]?.length > 0 && (
                            <InlineValidationIndicator messages={fieldValidation[field.id]} />
                          )}
                        </div>
                        {field.foreignKey && (
                          <Badge variant="outline" className="text-xs flex flex-row bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
                            → {field.foreignKey.table}.{field.foreignKey.field}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
                
                {/* Data Type column */}
                <TableCell className="p-2">
                  <Select
                    value={field.type}
                    onValueChange={(value) => updateField(field.id, { type: value as DataType })}
                  >
                    <SelectTrigger className="h-7 w-full min-w-[120px]">
                      <SelectValue>
                        <DataTypePill type={field.type} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="min-w-[200px] max-h-[300px]">
                      {DATA_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          <DataTypePill type={type} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Constraints column */}
                <TableCell className="p-2">
                  <div className="flex flex-cols-3 flex-wrap gap-x-2 gap-y-2">
                    <div className="flex flex-row gap-1.5">
                      <label htmlFor={`unique-${field.id}`} className="text-xs font-medium text-muted-foreground">
                        Unique
                      </label>
                      <Checkbox
                        id={`unique-${field.id}`}
                        checked={field.unique}
                        onCheckedChange={(checked) => 
                          updateField(field.id, { unique: !!checked })
                        }
                        className="mt-0.5"
                      />
                    </div>
                    
                    <div className="flex flex-row gap-1.5">
                      <label htmlFor={`nullable-${field.id}`} className="text-xs font-medium text-muted-foreground">
                        Nullable
                      </label>
                      <Checkbox
                        id={`nullable-${field.id}`}
                        checked={field.nullable}
                        onCheckedChange={(checked) => 
                          updateField(field.id, { nullable: !!checked })
                        }
                        disabled={field.primaryKey}
                        className="mt-0.5"
                      />
                    </div>
                    
                    <div className="flex flex-row gap-1.5">
                      <label htmlFor={`primary-${field.id}`} className="text-xs font-medium text-muted-foreground">
                        Primary Key
                      </label>
                      <Checkbox
                        id={`primary-${field.id}`}
                        checked={field.primaryKey}
                        onCheckedChange={(checked) => 
                          updateField(field.id, { 
                            primaryKey: !!checked,
                            nullable: checked ? false : field.nullable
                          })
                        }
                        className="mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="flex flex-row gap-1.5">
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
                          "h-6 px-2 w-full items-center gap-1 text-xs mt-2",
                          field.foreignKey 
                            ? "bg-gradient-to-r from-orange-500 to-background text-black hover:animate-bounce hover:text-black dark:text-white dark:bg-orange-900/20 dark:border-orange-800/50" 
                            : "hover:bg-muted text-black dark:text-white hover:dark:text-orange-500 hover:text-orange-500"
                        )}
                        onClick={() => setForeignKeySelector(field.id)}
                      >
                        <Link className="h-3 w-3 mr-1" />
                        {field.foreignKey ? "Edit FK" : "Add FK"}
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
                
                {/* Actions column */}
                <TableCell className="p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-60 hover:opacity-100 border border-transparent hover:bg-white hover:dark:bg-black hover:border-red-500 dark:hover:border-red-500"
                    onClick={() => deleteField(field.id)}
                  >
                    <Trash2 className="text-red-500 dark:text-red-500 h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add field button (bottom) */}
      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={addField}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Field
        </Button>
      </div>
    </div>
  );
}
