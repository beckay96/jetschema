import React, { useState, useEffect, useCallback } from 'react';
import { DatabaseField, DatabaseTable, DataType } from '@/types/database';
import { useIndexes, DatabaseIndex } from '@/hooks/useIndexes';
import { useAuth } from '@/hooks/useAuth';
import { ForeignKeySelector } from './ForeignKeySelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Key, Link, Star, Info, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateColumnName, ValidationMessage } from '@/utils/databaseValidation';
import { toast } from 'sonner';
import { InlineValidationIndicator } from '../../RightSidebarFeatures/ValidationFeedback';

/**
 * Data types available in the database
 * This list should match the available types in the backend
 */
const DATA_TYPES: DataType[] = [
  'UUID', 'TEXT', 'VARCHAR', 'STRING', 'INT', 'INTEGER', 'INT4', 'INT8', 
  'BIGINT', 'SERIAL', 'BOOLEAN', 'BOOL', 'TIMESTAMP', 'TIMESTAMPTZ', 
  'DATE', 'TIME', 'JSON', 'JSONB', 'DECIMAL', 'NUMERIC', 'FLOAT', 
  'REAL', 'EMAIL', 'ENUM', 'ARRAY', 'BYTEA'
];

interface FieldEditModalProps {
  field: DatabaseField;
  tableId: string;
  allTables: DatabaseTable[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldUpdate: (tableId: string, updatedField: DatabaseField) => void;
}

/**
 * FieldEditModal component
 * A modal dialog for editing a database field's properties
 */
export function FieldEditModal({
  field,
  tableId,
  allTables,
  open,
  onOpenChange,
  onFieldUpdate
}: FieldEditModalProps) {
  const [editedField, setEditedField] = useState<DatabaseField>({...field});
  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([]);
  const [foreignKeyOpen, setForeignKeyOpen] = useState(false);
  
  // Get project ID from the current table
  const currentTable = allTables.find(t => t.id === tableId);
  const projectId = currentTable?.project_id;
  
  const { saveIndex, deleteIndex, indexes = [] } = useIndexes(projectId);
  const { user } = useAuth();

  // Reset field state when the modal opens with a new field
  useEffect(() => {
    setEditedField({...field});
    validateField(field.name);
  }, [field, open]);

  // Validate field name
  const validateField = (name: string) => {
    const messages = validateColumnName(name);
    setValidationMessages(messages);
    return messages.length === 0;
  };

  // Update a single field property
  const updateFieldProperty = <K extends keyof DatabaseField>(
    property: K,
    value: DatabaseField[K]
  ) => {
    setEditedField(prev => {
      const updated = { ...prev, [property]: value };
      
      // Special handling for primary key changes
      if (property === 'primaryKey' && value === true) {
        // If setting as primary key, also set as not nullable and unique
        updated.nullable = false;
        updated.unique = true;
      }
      
      return updated;
    });
  };

  // Find any existing index for this field
  const findExistingIndex = useCallback(() => {
    // Find if there's an existing single-column index for this field
    const currentTable = allTables.find(t => t.id === tableId);
    if (!currentTable) return null;
    
    return indexes.find(index => 
      index.table_name === currentTable.name &&
      index.columns.length === 1 &&
      index.columns[0] === field.name
    );
  }, [indexes, tableId, field.name, allTables]);

  // Handle creating or updating an index
  const handleIndexOperation = async (wasIndexed: boolean, isNowIndexed: boolean) => {
    if (!user) {
      console.error('User not authenticated for index operation');
      return;
    }

    const currentTable = allTables.find(t => t.id === tableId);
    if (!currentTable || !currentTable.project_id) {
      console.error('Table not found or missing project_id for index operation');
      return;
    }
    
    const projectId = currentTable.project_id;

    // If indexing status changed
    if (wasIndexed !== isNowIndexed) {
      if (isNowIndexed) {
        // Create new index
        try {
          const indexName = `idx_${currentTable.name}_${editedField.name}`;
          await saveIndex({
            name: indexName,
            table_name: currentTable.name,
            columns: [editedField.name],
            index_type: 'BTREE', // Default to BTREE index type
            is_unique: editedField.unique || false,
            is_partial: false,
            project_id: projectId,
            author_id: user.id
          });
          toast.success(`Index created for ${editedField.name}`);
        } catch (error) {
          console.error('Failed to create index:', error);
          toast.error('Failed to create index');
        }
      } else {
        // Delete existing index
        const existingIndex = findExistingIndex();
        if (existingIndex) {
          try {
            await deleteIndex(existingIndex.id);
            toast.success(`Index removed from ${editedField.name}`);
          } catch (error) {
            console.error('Failed to delete index:', error);
            toast.error('Failed to delete index');
          }
        }
      }
    }
  };

  // Handle saving the field
  const handleSave = async () => {
    if (validateField(editedField.name)) {
      const wasIndexed = field.indexed || false;
      const isNowIndexed = editedField.indexed || false;
      
      // First update the field in the database schema
      onFieldUpdate(tableId, editedField);
      
      // Then handle index creation/deletion if needed
      await handleIndexOperation(wasIndexed, isNowIndexed);
      
      onOpenChange(false);
      toast.success(`Field "${editedField.name}" updated`);
    } else {
      toast.error('Please fix validation errors before saving');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Field Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="field-name" className="text-right">
              Name
            </Label>
            <div className="col-span-3">
              <Input
                id="field-name"
                value={editedField.name}
                onChange={(e) => {
                  const name = e.target.value;
                  updateFieldProperty('name', name);
                  validateField(name);
                }}
                className={cn(
                  validationMessages.length > 0 && 'border-red-500'
                )}
              />
              {validationMessages.length > 0 && (
                <div className="mt-1">
                  <InlineValidationIndicator messages={validationMessages} />
                </div>
              )}
            </div>
          </div>
          
          {/* Field Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="field-type" className="text-right">
              Data Type
            </Label>
            <div className="col-span-3">
              <Select 
                value={editedField.type} 
                onValueChange={(value) => updateFieldProperty('type', value as DataType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Primary Key */}
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label 
                htmlFor="primary-key"
                className="inline-flex items-center gap-1"
              >
                Primary Key
                <Key className="h-3 w-3" />
              </Label>
            </div>
            <div className="col-span-3">
              <Checkbox 
                id="primary-key" 
                checked={editedField.primaryKey}
                onCheckedChange={(checked) => 
                  updateFieldProperty('primaryKey', !!checked)
                }
              />
            </div>
          </div>
          
          {/* Unique */}
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label 
                htmlFor="unique"
                className="inline-flex items-center gap-1"
              >
                Unique
                <Star className="h-3 w-3" />
              </Label>
            </div>
            <div className="col-span-3">
              <Checkbox 
                id="unique" 
                checked={editedField.unique}
                onCheckedChange={(checked) => 
                  updateFieldProperty('unique', !!checked)
                }
              />
            </div>
          </div>
          
          {/* Nullable */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nullable" className="text-right">
              Nullable
            </Label>
            <div className="col-span-3">
              <Checkbox 
                id="nullable" 
                checked={editedField.nullable}
                disabled={editedField.primaryKey}
                onCheckedChange={(checked) => 
                  updateFieldProperty('nullable', !!checked)
                }
              />
            </div>
          </div>
          
          {/* Indexed */}
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label 
                htmlFor="indexed"
                className="inline-flex items-center gap-1"
                title="Creates a database index to improve query performance"
              >
                Indexed
                <Search className="h-3 w-3" style={{ color: 'hsl(var(--status-index))' }} />
              </Label>
            </div>
            <div className="col-span-3">
              <Checkbox 
                id="indexed" 
                checked={editedField.indexed || false}
                onCheckedChange={(checked) => {
                  updateFieldProperty('indexed', !!checked);
                  // Index creation/deletion will be handled in handleSave
                }}
              />
            </div>
          </div>
          
          {/* Default Value */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="default-value" className="text-right">
              Default Value
            </Label>
            <div className="col-span-3">
              <Input
                id="default-value"
                value={editedField.defaultValue || ''}
                onChange={(e) => updateFieldProperty('defaultValue', e.target.value || null)}
                placeholder="No default"
              />
            </div>
          </div>
          
          {/* Foreign Key */}
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label 
                htmlFor="foreign-key"
                className="inline-flex items-center gap-1"
              >
                Foreign Key
                <Link className="h-3 w-3" />
              </Label>
            </div>
            <div className="col-span-3">
              <Popover open={foreignKeyOpen} onOpenChange={setForeignKeyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      editedField.foreignKey && "bg-orange-50 border-orange-200 text-orange-800"
                    )}
                  >
                    <Link className="h-3 w-3 mr-2" />
                    {editedField.foreignKey 
                      ? `${editedField.foreignKey.table}.${editedField.foreignKey.field}`
                      : "Set Foreign Key Reference"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-auto" side="right">
                  <ForeignKeySelector
                    tables={allTables}
                    currentField={editedField}
                    currentTableId={tableId}
                    onUpdate={(foreignKey) => {
                      updateFieldProperty('foreignKey', foreignKey);
                      setForeignKeyOpen(false);
                    }}
                    onClose={() => setForeignKeyOpen(false)}
                  />
                </PopoverContent>
              </Popover>
              
              {editedField.foreignKey && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-6 text-xs"
                  onClick={() => updateFieldProperty('foreignKey', null)}
                >
                  Remove Reference
                </Button>
              )}
            </div>
          </div>
          
          {/* Description / Comment */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <div className="col-span-3">
              <Input
                id="description"
                value={editedField.comment || ''}
                onChange={(e) => updateFieldProperty('comment', e.target.value || null)}
                placeholder="Add field description"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FieldEditModal;
