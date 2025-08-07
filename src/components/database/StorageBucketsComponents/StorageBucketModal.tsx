import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Save, Trash2, Database, Link } from 'lucide-react';
import { StorageBucket, StorageBucketModalProps, COMMON_MIME_TYPES } from '@/types/storageBuckets';
import { toast } from 'sonner';

export function StorageBucketModal({
  open,
  onOpenChange,
  bucket,
  onSave,
  onDelete,
  availableTables
}: StorageBucketModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [fileSizeLimit, setFileSizeLimit] = useState<string>('');
  const [allowedMimeTypes, setAllowedMimeTypes] = useState<string[]>([]);
  const [linkedTables, setLinkedTables] = useState<string[]>([]);
  const [newMimeType, setNewMimeType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!bucket;

  useEffect(() => {
    if (bucket) {
      setName(bucket.name);
      setDescription(bucket.description || '');
      setIsPublic(bucket.public);
      setFileSizeLimit(bucket.file_size_limit ? (bucket.file_size_limit / (1024 * 1024)).toString() : '');
      setAllowedMimeTypes([...bucket.allowed_mime_types || []]);
      setLinkedTables([...bucket.linked_tables || []]);
    } else {
      setName('');
      setDescription('');
      setIsPublic(false);
      setFileSizeLimit('');
      setAllowedMimeTypes([]);
      setLinkedTables([]);
    }
    setNewMimeType('');
  }, [bucket, open]);

  const handleAddMimeType = (mimeType: string) => {
    if (mimeType && !allowedMimeTypes.includes(mimeType)) {
      setAllowedMimeTypes([...allowedMimeTypes, mimeType]);
      setNewMimeType('');
    }
  };

  const handleRemoveMimeType = (mimeType: string) => {
    setAllowedMimeTypes(allowedMimeTypes.filter(mt => mt !== mimeType));
  };

  const handleToggleLinkedTable = (tableName: string) => {
    if (linkedTables.includes(tableName)) {
      setLinkedTables(linkedTables.filter(t => t !== tableName));
    } else {
      setLinkedTables([...linkedTables, tableName]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Bucket name is required');
      return;
    }

    // Validate bucket name (Supabase storage naming rules)
    const nameRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!nameRegex.test(name)) {
      toast.error('Bucket name must be lowercase, start and end with alphanumeric characters, and can contain hyphens');
      return;
    }

    const fileSizeLimitBytes = fileSizeLimit ? parseInt(fileSizeLimit) * 1024 * 1024 : undefined;

    setIsLoading(true);
    try {
      if (isEditing) {
        await onSave({
          id: bucket!.id,
          name: name.trim(),
          description: description.trim() || undefined,
          public: isPublic,
          file_size_limit: fileSizeLimitBytes,
          allowed_mime_types: allowedMimeTypes.length > 0 ? allowedMimeTypes : undefined,
          linked_tables: linkedTables.length > 0 ? linkedTables : undefined
        });
        toast.success('Storage bucket updated successfully');
      } else {
        await onSave({
          name: name.trim(),
          description: description.trim() || undefined,
          public: isPublic,
          file_size_limit: fileSizeLimitBytes,
          allowed_mime_types: allowedMimeTypes.length > 0 ? allowedMimeTypes : undefined,
          linked_tables: linkedTables.length > 0 ? linkedTables : undefined
        });
        toast.success('Storage bucket created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving storage bucket:', error);
      toast.error('Failed to save storage bucket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!bucket || !onDelete) return;

    if (!confirm('Are you sure you want to delete this storage bucket plan? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(bucket.id);
      toast.success('Storage bucket deleted successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting storage bucket:', error);
      toast.error('Failed to delete storage bucket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Storage Bucket' : 'Create New Storage Bucket'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="bucket-name">Name *</Label>
            <Input
              id="bucket-name"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              placeholder="e.g., user-avatars, document-uploads"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Must be lowercase, start and end with alphanumeric characters, can contain hyphens
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="bucket-description">Description</Label>
            <Textarea
              id="bucket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what this bucket will store"
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="bucket-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoading}
            />
            <Label htmlFor="bucket-public">Public bucket</Label>
            <p className="text-xs text-muted-foreground">
              {isPublic ? 'Files will be publicly accessible' : 'Files require authentication to access'}
            </p>
          </div>

          {/* File Size Limit */}
          <div className="space-y-2">
            <Label htmlFor="file-size-limit">File Size Limit (MB)</Label>
            <Input
              id="file-size-limit"
              type="number"
              value={fileSizeLimit}
              onChange={(e) => setFileSizeLimit(e.target.value)}
              placeholder="e.g., 10 (leave empty for no limit)"
              disabled={isLoading}
            />
          </div>

          {/* Allowed MIME Types */}
          <div className="space-y-4">
            <Label>Allowed File Types</Label>
            
            {/* Quick Add Common Types */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Common Types:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_MIME_TYPES.map((mimeType) => (
                  <Button
                    key={mimeType}
                    variant={allowedMimeTypes.includes(mimeType) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAddMimeType(mimeType)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {mimeType.split('/')[1]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom MIME Type */}
            <div className="flex gap-2">
              <Input
                value={newMimeType}
                onChange={(e) => setNewMimeType(e.target.value)}
                placeholder="Custom MIME type (e.g., application/pdf)"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={() => handleAddMimeType(newMimeType)}
                disabled={!newMimeType.trim() || isLoading}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected MIME Types */}
            {allowedMimeTypes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Types:</p>
                <div className="flex flex-wrap gap-2">
                  {allowedMimeTypes.map((mimeType, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {mimeType}
                      <button
                        type="button"
                        onClick={() => handleRemoveMimeType(mimeType)}
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
          </div>

          {/* Linked Tables */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <Label>Linked Tables</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Select tables that will reference files in this bucket
            </p>
            
            {availableTables.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {availableTables.map((tableName) => (
                  <div
                    key={tableName}
                    className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-accent"
                    onClick={() => handleToggleLinkedTable(tableName)}
                  >
                    <input
                      type="checkbox"
                      checked={linkedTables.includes(tableName)}
                      onChange={() => handleToggleLinkedTable(tableName)}
                      disabled={isLoading}
                    />
                    <Database className="h-4 w-4" />
                    <span className="text-sm">{tableName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tables available for linking. Create tables first to link them to storage buckets.
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
              disabled={isLoading || !name.trim()}
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
