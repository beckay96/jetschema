import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus, Database, Info } from 'lucide-react';
import { DatabaseTable } from '@/types/database';
import { DatabaseIndex } from '@/hooks/useIndexes';

interface IndexModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (index: Omit<DatabaseIndex, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  tables: DatabaseTable[];
  projectId: string;
  editingIndex?: DatabaseIndex | null;
}

const INDEX_TYPES = [
  { value: 'BTREE', label: 'B-Tree (Default)', description: 'Best for equality and range queries' },
  { value: 'HASH', label: 'Hash', description: 'Best for equality queries only' },
  { value: 'GIN', label: 'GIN', description: 'Best for arrays, JSONB, full-text search' },
  { value: 'GIST', label: 'GiST', description: 'Best for geometric data, full-text search' },
  { value: 'SPGIST', label: 'SP-GiST', description: 'Best for partitioned data' },
  { value: 'BRIN', label: 'BRIN', description: 'Best for very large tables with natural ordering' }
];

export function IndexModal({ open, onOpenChange, onSave, tables, projectId, editingIndex }: IndexModalProps) {
  const [name, setName] = useState('');
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<string[]>(['']);
  const [indexType, setIndexType] = useState<'BTREE' | 'HASH' | 'GIN' | 'GIST' | 'SPGIST' | 'BRIN'>('BTREE');
  const [isUnique, setIsUnique] = useState(false);
  const [isPartial, setIsPartial] = useState(false);
  const [whereClause, setWhereClause] = useState('');
  const [description, setDescription] = useState('');

  const selectedTable = tables.find(t => t.name === tableName);

  useEffect(() => {
    if (editingIndex) {
      setName(editingIndex.name);
      setTableName(editingIndex.table_name);
      setColumns(editingIndex.columns);
      setIndexType(editingIndex.index_type);
      setIsUnique(editingIndex.is_unique);
      setIsPartial(editingIndex.is_partial);
      setWhereClause(editingIndex.where_clause || '');
      setDescription(editingIndex.description || '');
    } else {
      // Reset form
      setName('');
      setTableName('');
      setColumns(['']);
      setIndexType('BTREE');
      setIsUnique(false);
      setIsPartial(false);
      setWhereClause('');
      setDescription('');
    }
  }, [editingIndex, open]);

  const handleSave = async () => {
    if (!name || !tableName || columns.filter(Boolean).length === 0) return;

    await onSave({
      name,
      table_name: tableName,
      columns: columns.filter(Boolean),
      index_type: indexType,
      is_unique: isUnique,
      is_partial: isPartial,
      where_clause: whereClause || undefined,
      description: description || undefined,
      project_id: projectId,
      author_id: '' // Will be set by the hook
    });

    onOpenChange(false);
  };

  const addColumn = () => {
    setColumns([...columns, '']);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, value: string) => {
    const newColumns = [...columns];
    newColumns[index] = value;
    setColumns(newColumns);
  };

  const generateIndexName = () => {
    if (tableName && columns.filter(Boolean).length > 0) {
      const columnsPart = columns.filter(Boolean).join('_');
      const typePart = isUnique ? 'unique' : 'idx';
      setName(`${typePart}_${tableName}_${columnsPart}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {editingIndex ? 'Edit Index' : 'Create Index'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Index Tips:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Indexes speed up queries but slow down writes</li>
                <li>• Create indexes on frequently queried columns</li>
                <li>• Unique indexes enforce data uniqueness</li>
                <li>• Partial indexes can be smaller and faster</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Index Name *</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., idx_users_email"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={generateIndexName}
                  disabled={!tableName || columns.filter(Boolean).length === 0}
                >
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="table">Table *</Label>
              <Select value={tableName} onValueChange={setTableName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.name}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Columns */}
          <div className="space-y-3">
            <Label>Columns *</Label>
            {columns.map((column, index) => (
              <div key={index} className="flex gap-2">
                <Select value={column} onValueChange={(value) => updateColumn(index, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTable?.fields.map((field) => (
                      <SelectItem key={field.id} value={field.name}>
                        {field.name} ({field.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {columns.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeColumn(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addColumn}
              disabled={!selectedTable}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Index Type</Label>
              <Select value={indexType} onValueChange={(value: any) => setIndexType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDEX_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div>{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isUnique}
                  onCheckedChange={setIsUnique}
                />
                <Label>Unique Index</Label>
                <Badge variant={isUnique ? "default" : "secondary"}>
                  {isUnique ? "UNIQUE" : "NON-UNIQUE"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isPartial}
                  onCheckedChange={setIsPartial}
                />
                <Label>Partial Index</Label>
              </div>
            </div>
          </div>

          {/* Partial Index WHERE clause */}
          {isPartial && (
            <div className="space-y-2">
              <Label htmlFor="where">WHERE Clause</Label>
              <Textarea
                id="where"
                value={whereClause}
                onChange={(e) => setWhereClause(e.target.value)}
                placeholder="e.g., active = true"
                className="font-mono"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Only index rows that match this condition
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this index optimizes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name || !tableName || columns.filter(Boolean).length === 0}
            >
              {editingIndex ? 'Update' : 'Create'} Index
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}