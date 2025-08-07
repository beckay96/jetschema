import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, Trash2 } from 'lucide-react';
import { DatabaseEnumeration, EnumerationModalProps } from '@/types/enumerations';
import { toast } from 'sonner';

export function EnumerationModal({
  open,
  onOpenChange,
  enumeration,
  onSave,
  onDelete
}: EnumerationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!enumeration;

  useEffect(() => {
    if (enumeration) {
      setName(enumeration.name);
      setDescription(enumeration.description || '');
      setValues([...enumeration.values]);
    } else {
      setName('');
      setDescription('');
      setValues([]);
    }
    setNewValue('');
  }, [enumeration, open]);

  const handleAddValue = () => {
    if (newValue.trim() && !values.includes(newValue.trim())) {
      setValues([...values, newValue.trim()]);
      setNewValue('');
    } else if (values.includes(newValue.trim())) {
      toast.error('Value already exists in enumeration');
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    setValues(values.filter(v => v !== valueToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddValue();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Enumeration name is required');
      return;
    }

    if (values.length === 0) {
      toast.error('At least one value is required');
      return;
    }

    // Validate enumeration name (PostgreSQL naming rules)
    const nameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(name)) {
      toast.error('Enumeration name must start with a letter or underscore and contain only letters, numbers, and underscores');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing) {
        await onSave({
          id: enumeration!.id,
          name: name.trim(),
          description: description.trim() || undefined,
          values
        });
        toast.success('Enumeration updated successfully');
      } else {
        await onSave({
          name: name.trim(),
          description: description.trim() || undefined,
          values
        });
        toast.success('Enumeration created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving enumeration:', error);
      toast.error('Failed to save enumeration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!enumeration || !onDelete) return;

    if (!confirm('Are you sure you want to delete this enumeration? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(enumeration.id);
      toast.success('Enumeration deleted successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting enumeration:', error);
      toast.error('Failed to delete enumeration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Enumeration' : 'Create New Enumeration'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="enum-name">Name *</Label>
            <Input
              id="enum-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., user_status, priority_level"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Must start with a letter or underscore, contain only letters, numbers, and underscores
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="enum-description">Description</Label>
            <Textarea
              id="enum-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what this enumeration represents"
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Values Section */}
          <div className="space-y-4">
            <Label>Enumeration Values *</Label>
            
            {/* Add New Value */}
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Add a new value"
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleAddValue}
                disabled={!newValue.trim() || isLoading}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Values */}
            {values.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Values:</p>
                <div className="flex flex-wrap gap-2">
                  {values.map((value, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {value}
                      <button
                        type="button"
                        onClick={() => handleRemoveValue(value)}
                        disabled={isLoading}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {values.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No values added yet. Add at least one value to create the enumeration.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {isEditing && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !name.trim() || values.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
