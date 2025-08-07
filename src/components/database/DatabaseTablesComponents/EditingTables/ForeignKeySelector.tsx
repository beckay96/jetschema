import { useState } from 'react';
import { DatabaseTable, DatabaseField } from '@/types/database';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForeignKeySelectorProps {
  tables: DatabaseTable[];
  currentField: DatabaseField;
  currentTableId: string;
  onUpdate: (foreignKey: { table: string; field: string } | undefined) => void;
  onClose?: () => void;
}

export function ForeignKeySelector({ 
  tables, 
  currentField, 
  currentTableId, 
  onUpdate, 
  onClose 
}: ForeignKeySelectorProps) {
  const [selectedTable, setSelectedTable] = useState<string>(currentField.foreignKey?.table || '');
  const [selectedField, setSelectedField] = useState<string>(currentField.foreignKey?.field || '');

  // Filter out current table and get available tables
  const availableTables = tables.filter(table => table.id !== currentTableId);
  
  // Get fields for selected table
  const selectedTableData = tables.find(table => table.name === selectedTable);
  const availableFields = selectedTableData?.fields || [];

  const handleApply = () => {
    if (selectedTable && selectedField) {
      onUpdate({ table: selectedTable, field: selectedField });
    } else {
      onUpdate(undefined);
    }
    onClose?.();
  };

  const handleRemove = () => {
    onUpdate(undefined);
    onClose?.();
  };

  return (
    <Card className="w-full max-w-md border-2 border-primary/20 bg-gradient-to-br from-card to-card/95">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Link className="h-4 w-4" style={{ color: 'hsl(var(--status-foreign-key))' }} />
            Foreign Key Reference
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          Link this field to another table's primary key
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current FK Display */}
        {currentField.foreignKey && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">Current Reference:</div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">
                {currentField.foreignKey.table}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {currentField.foreignKey.field}
              </Badge>
            </div>
          </div>
        )}

        {/* Table Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Reference Table</label>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select a table..." />
            </SelectTrigger>
            <SelectContent>
              {availableTables.map(table => (
                <SelectItem key={table.id} value={table.name}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                    {table.name}
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {table.fields.length} fields
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Field Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Reference Field</label>
          <Select 
            value={selectedField} 
            onValueChange={setSelectedField}
            disabled={!selectedTable}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select a field..." />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map(field => (
                <SelectItem key={field.id} value={field.name}>
                  <div className="flex items-center gap-2">
                    {field.primaryKey && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--status-primary-key))' }} />
                    )}
                    {field.unique && !field.primaryKey && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--status-unique))' }} />
                    )}
                    <span className={cn(
                      "text-sm",
                      field.primaryKey && "font-semibold",
                      field.primaryKey && "text-primary"
                    )}>
                      {field.name}
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {field.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        {selectedTable && selectedField && (
          <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="text-xs text-primary font-medium mb-1">Preview:</div>
            <div className="flex items-center gap-2 text-sm">
              <code className="text-xs bg-background px-2 py-1 rounded border">
                {currentField.name}
              </code>
              <ArrowRight className="h-3 w-3 text-primary" />
              <code className="text-xs bg-background px-2 py-1 rounded border">
                {selectedTable}.{selectedField}
              </code>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleApply}
            disabled={!selectedTable || !selectedField}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            size="sm"
          >
            {currentField.foreignKey ? 'Update' : 'Apply'} FK
          </Button>
          {currentField.foreignKey && (
            <Button 
              onClick={handleRemove}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              Remove FK
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}