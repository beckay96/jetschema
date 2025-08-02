import React, { useState, useEffect } from 'react';
import { DatabaseField, DatabaseTable, DataType } from '@/types/database';
import { ForeignKeySelector } from './ForeignKeySelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Key, Link, Star, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateColumnName, ValidationMessage } from '@/utils/databaseValidation';
import { toast } from 'sonner';
import { InlineValidationIndicator } from './ValidationFeedback';

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

  // Handle saving the field
  const handleSave = () => {
    if (validateField(editedField.name)) {
      onFieldUpdate(tableId, editedField);
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
