import { useState, useEffect, useCallback, useRef } from 'react';
import { DatabaseTable, DatabaseField, DataType } from '@/types/database';
import { DataTypePill } from '@/components/Settings/DataTypePill';
import { ForeignKeySelector } from '@/components/database/DatabaseTablesComponents/EditingTables/ForeignKeySelector';
import { FieldCommentButton } from '@/components/database/DatabaseTablesComponents/EditingTables/FieldCommentButton';
import { useIndexes } from '@/hooks/useIndexes';
import { useAuth } from '@/hooks/useAuth';
import { IndexConfirmationDialog } from '@/components/database/IndexesComponents/IndexConfirmationDialog';
import { IndexModal } from '@/components/database/IndexesComponents/IndexModal';

import { ValidationFeedback, InlineValidationIndicator } from '@/components/database/RightSidebarFeatures/ValidationFeedback';
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
  /**
   * If true, automatically add a new field when the modal opens
   */
  addFieldOnOpen?: boolean;
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
  onTableUpdate,
  addFieldOnOpen = false
}: TableEditModalProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingTableName, setEditingTableName] = useState(false);
  const [foreignKeySelector, setForeignKeySelector] = useState<string | null>(null);
  const [currentTable, setCurrentTable] = useState(table);
  const [validationResults, setValidationResults] = useState<ValidationMessage[]>([]);
  const [fieldValidation, setFieldValidation] = useState<Record<string, ValidationMessage[]>>({});
  const { saveIndex, deleteIndex, refetch: refetchIndexes } = useIndexes(currentTable.project_id);
  const { user } = useAuth();
  const [tableNameValidation, setTableNameValidation] = useState<ValidationMessage[]>([]);
  // RLS toggle state
  const [hasRlsEnabled, setHasRlsEnabled] = useState((table as any).hasRlsEnabled || false);
  const [commentModal, setCommentModal] = useState<{ 
    open: boolean, 
    tableName: string, 
    fieldName: string 
  }>({ open: false, tableName: '', fieldName: '' });
  
  // Index modal and confirmation states
  const [indexModal, setIndexModal] = useState(false);
  const [currentFieldForIndex, setCurrentFieldForIndex] = useState<string>('');
  const [indexConfirmation, setIndexConfirmation] = useState({
    open: false,
    isDelete: false,
    fieldId: '',
    fieldName: '',
    tableName: currentTable?.name || ''
  });
  
  // Track if we've already added a field on open to prevent infinite recursion
  const fieldAddedOnOpenRef = useRef(false);

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

  useEffect(() => {
    setCurrentTable(table);
    setEditingField(null);
    setEditingTableName(false);
    setForeignKeySelector(null);
    setHasRlsEnabled((table as any).hasRlsEnabled || false);
    
    // Reset the field added flag when modal opens/closes or table changes
    if (!open) {
      fieldAddedOnOpenRef.current = false;
    }
  }, [table, open]);

  // Separate useEffect to handle addFieldOnOpen without causing infinite recursion
  useEffect(() => {
    if (open && addFieldOnOpen && !fieldAddedOnOpenRef.current) {
      fieldAddedOnOpenRef.current = true;
      // Use setTimeout to ensure the modal is fully rendered before adding the field
      setTimeout(() => {
        addField();
      }, 100);
    }
  }, [open, addFieldOnOpen, addField]);

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

  const updateField = (id: string, updates: Partial<DatabaseField>) => {
    // Special handling for indexed property
    if ('indexed' in updates) {
      const field = currentTable.fields.find(f => f.id === id);
      if (field) {
        // If turning on indexed, show confirmation/modal
        if (updates.indexed === true && !field.indexed) {
          setIndexConfirmation({
            open: true,
            isDelete: false,
            fieldId: id,
            fieldName: field.name,
            tableName: currentTable.name
          });
          return; // Don't update yet
        }
        // If turning off indexed, show confirmation
        else if (updates.indexed === false && field.indexed) {
          setIndexConfirmation({
            open: true,
            isDelete: true,
            fieldId: id,
            fieldName: field.name,
            tableName: currentTable.name
          });
          return; // Don't update yet
        }
      }
    }
    
    const updatedFields = currentTable.fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    );
    
    const updatedTable = { ...currentTable, fields: updatedFields };
    setCurrentTable(updatedTable);
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

  const handleAddComment = (elementType: 'table' | 'field', elementId: string, elementName: string, commentText: string, isTask: boolean) => {
    // Log the comment data
    console.log('Comment added:', {
      elementType,
      elementId,
      elementName,
      commentText,
      isTask
    });
    
    // TODO: Implement backend integration to save the comment
    // This should be replaced with actual API calls to save comments to the database
    
    toast.success(`${isTask ? 'Task' : 'Comment'} added successfully`);
    
    // You can still open the comment modal if needed
    // setCommentModal({ open: true, tableName: elementName, fieldName: '' });
  };

  const handleCommentSubmit = (comment: string, isTask: boolean) => {
    // TODO: Implement comment submission to backend
    console.log('Comment submitted from modal:', { 
      comment, 
      isTask,
      table: commentModal.tableName, 
      field: commentModal.fieldName 
    });
    
    // This would typically call the same backend API as handleAddComment
    toast.success(`${isTask ? 'Task' : 'Comment'} added successfully!`);
    
    // Close the comment modal after submission
    setCommentModal({ ...commentModal, open: false });
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
                <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/10">
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="w-[25%]">Field Name</TableHead>
                  <TableHead className="w-[20%]">Data Type</TableHead>
                  <TableHead className="w-[30%]">Constraints</TableHead>
                  <TableHead className="w-[20%]">Comments</TableHead>
                  <TableHead className="w-[6%]"></TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                {currentTable.fields.map(field => (
                  <TableRow 
                    key={field.id}
                    className={cn(
                      "group hover:bg-muted/50 transition-colors border-b border-muted",
                      field.primaryKey && "bg-gradient-to-r from-[hsl(var(--status-primary-key)/0.15)] to-transparent dark:from-[hsl(var(--status-primary-key)/0.2)] dark:to-transparent"
                    )}
                  >
                    {/* Field icons column */}
                    <TableCell className="p-2 w-8">
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
                        {field.indexed && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database-backup" style={{ color: 'hsl(var(--status-index))' }}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.5 3.55 3 9 3s9-1.5 9-3V5"/><path d="M3 12c0 1.5 3.55 3 9 3s9-1.5 9-3"/><path d="M13 5v4h6"/><path d="M16 6 13 9"/></svg>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Field Name column */}
                    <TableCell className="p-2">
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
                        <div 
                          onClick={() => setEditingField(field.id)} 
                          className="cursor-pointer hover:underline flex items-center gap-2"
                        >
                          <span className="text-sm">{field.name}</span>
                          {fieldValidation[field.id]?.length > 0 && (
                            <InlineValidationIndicator messages={fieldValidation[field.id]} />
                          )}
                        </div>
                      )}
                      {field.foreignKey && (
                        <Badge variant="outline" className="text-xs mt-1 bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
                          → {field.foreignKey.table}.{field.foreignKey.field}
                        </Badge>
                      )}
                    </TableCell>
                    
                    {/* Data Type column */}
                    <TableCell className="p-2">
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(field.id, { type: value as DataType })}
                      >
                        <SelectTrigger className="h-7 w-full min-w-[180px]">
                          <SelectValue>
                            <DataTypePill type={field.type} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="min-w-[200px]">
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
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="flex flex-col gap-1.5">
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
                        
                        <div className="flex flex-col gap-1.5">
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
                      </div>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <label htmlFor={`indexed-${field.id}`} className="text-xs font-medium text-muted-foreground">
                          Indexed
                        </label>
                        <div className="flex items-center">
                          <Checkbox
                            id={`indexed-${field.id}`}
                            checked={field.indexed}
                            onCheckedChange={(checked) => 
                              updateField(field.id, { indexed: !!checked })
                            }
                            className="mt-0.5"
                          />
                        </div>
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
                                ? "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-400" 
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
                    </TableCell>
                    
                    {/* Comments Cell */}
                    <TableCell className="p-2">
                      <FieldCommentButton
                        fieldId={field.id}
                        tableName={currentTable.name}
                        fieldName={field.name}
                        onAddComment={(elementType, elementId, elementName, commentText, isTask) => 
                          handleAddComment(elementType, elementId, elementName, commentText, isTask)}
                        compact={true}
                      />
                    </TableCell>
                    
                    {/* Delete button column */}
                    <TableCell className="p-2 w-8">
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

          {/* Comment Modal - Now handled by EnhancedCommentPopover in FieldCommentButton */}

          {/* Index Confirmation Dialog */}
          <IndexConfirmationDialog
            open={indexConfirmation.open}
            onOpenChange={(open) => setIndexConfirmation({...indexConfirmation, open})}
            isDelete={indexConfirmation.isDelete}
            fieldName={indexConfirmation.fieldName}
            tableName={indexConfirmation.tableName}
            onConfirm={async () => {
              // Handle index creation/deletion
              const field = currentTable.fields.find(f => f.id === indexConfirmation.fieldId);
              
              if (field) {
                if (indexConfirmation.isDelete) {
                  // Handle index deletion
                  try {
                    // Find and delete any existing index on this field
                    // For simplicity, we'll use a standard naming convention
                    await deleteIndex(`idx_${indexConfirmation.tableName}_${indexConfirmation.fieldName}`);
                    
                    // Update UI
                    const updatedFields = currentTable.fields.map(f => 
                      f.id === indexConfirmation.fieldId ? { ...f, indexed: false } : f
                    );
                    const updatedTable = { ...currentTable, fields: updatedFields };
                    setCurrentTable(updatedTable);
                    
                    // Refresh the indexes list
                    refetchIndexes();
                  } catch (error) {
                    console.error('Error deleting index:', error);
                    toast.error('Failed to delete index');
                  }
                } else {
                  // Handle index creation with default settings
                  try {
                    // Create a basic BTREE index
                    const indexName = `idx_${indexConfirmation.tableName}_${indexConfirmation.fieldName}`;
                    await saveIndex({
                      name: indexName,
                      table_name: indexConfirmation.tableName,
                      columns: [indexConfirmation.fieldName],
                      index_type: 'BTREE',
                      is_unique: false,
                      is_partial: false,
                      project_id: currentTable.project_id,
                      author_id: user?.id || ''
                    });
                    
                    // Update UI
                    const updatedFields = currentTable.fields.map(f => 
                      f.id === indexConfirmation.fieldId ? { ...f, indexed: true } : f
                    );
                    const updatedTable = { ...currentTable, fields: updatedFields };
                    setCurrentTable(updatedTable);
                    
                    // Refresh the indexes list
                    refetchIndexes();
                    toast.success(`Index created on ${indexConfirmation.fieldName}`);
                  } catch (error) {
                    console.error('Error creating index:', error);
                    toast.error('Failed to create index');
                  }
                }
              }
              setIndexConfirmation({...indexConfirmation, open: false});
            }}
            onCancel={() => {
              setIndexConfirmation({...indexConfirmation, open: false});
            }}
            onOpenIndexModal={() => {
              setCurrentFieldForIndex(indexConfirmation.fieldName);
              setIndexConfirmation({...indexConfirmation, open: false});
              setIndexModal(true);
            }}
          />

          {/* Index Modal */}
          <IndexModal
            open={indexModal}
            onOpenChange={setIndexModal}
            onSave={async (index) => {
              try {
                // Save the index via the hook
                await saveIndex(index);
                
                // After saving the index, make sure the field is marked as indexed
                if (indexConfirmation.fieldId) {
                  const updatedFields = currentTable.fields.map(f => 
                    f.id === indexConfirmation.fieldId ? { ...f, indexed: true } : f
                  );
                  const updatedTable = { ...currentTable, fields: updatedFields };
                  setCurrentTable(updatedTable);
                  onTableUpdate(updatedTable);
                }
                
                // Refresh the indexes list
                refetchIndexes();
                toast.success(`Index ${index.name} created successfully`);
              } catch (error) {
                console.error('Error saving index:', error);
                toast.error('Failed to create index');
              }
              setIndexModal(false);
            }}
            tables={[currentTable]}
            projectId={currentTable.project_id}
            initialFieldName={indexConfirmation.fieldName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}