import { useState } from 'react';
import { DatabaseTable, DatabaseField, DataType } from '@/types/database';
import { DataTypePill } from './DataTypePill';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Key, Link, Star, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DatabaseTableViewProps {
  tables: DatabaseTable[];
  onTableUpdate?: (tables: DatabaseTable[]) => void;
  onTableSelect?: (table: DatabaseTable | null) => void;
  selectedTable?: DatabaseTable | null;
}

const DATA_TYPES: DataType[] = [
  'UUID', 'TEXT', 'VARCHAR', 'STRING', 'INT', 'INTEGER', 'INT4', 'INT8', 
  'BIGINT', 'SERIAL', 'BOOLEAN', 'BOOL', 'TIMESTAMP', 'TIMESTAMPTZ', 
  'DATE', 'TIME', 'JSON', 'JSONB', 'DECIMAL', 'NUMERIC', 'FLOAT', 
  'REAL', 'EMAIL', 'ENUM', 'ARRAY', 'BYTEA'
];

export function DatabaseTableView({ 
  tables, 
  onTableUpdate, 
  onTableSelect,
  selectedTable 
}: DatabaseTableViewProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ tableId: string; fieldId: string } | null>(null);

  const toggleTableExpansion = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  const updateField = (tableId: string, fieldId: string, updates: Partial<DatabaseField>) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        return {
          ...table,
          fields: table.fields.map(field => 
            field.id === fieldId ? { ...field, ...updates } : field
          )
        };
      }
      return table;
    });
    onTableUpdate?.(updatedTables);
  };

  const addField = (tableId: string) => {
    const newField: DatabaseField = {
      id: `field-${Date.now()}`,
      name: 'new_field',
      type: 'TEXT',
      nullable: true,
      primaryKey: false,
      unique: false
    };

    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        return {
          ...table,
          fields: [...table.fields, newField]
        };
      }
      return table;
    });

    onTableUpdate?.(updatedTables);
    setEditingField({ tableId, fieldId: newField.id });
    toast.success('New field added!');
  };

  const deleteField = (tableId: string, fieldId: string) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        return {
          ...table,
          fields: table.fields.filter(field => field.id !== fieldId)
        };
      }
      return table;
    });
    onTableUpdate?.(updatedTables);
    toast.success('Field deleted!');
  };

  const addTable = () => {
    const newTable: DatabaseTable = {
      id: `table-${Date.now()}`,
      name: `new_table_${tables.length + 1}`,
      fields: [
        {
          id: `field-${Date.now()}`,
          name: 'id',
          type: 'UUID',
          nullable: false,
          primaryKey: true,
          unique: true
        }
      ],
      position: { x: 100, y: 100 }
    };

    onTableUpdate?.([...tables, newTable]);
    setExpandedTables(new Set([...expandedTables, newTable.id]));
    toast.success('New table added!');
  };

  const deleteTable = (tableId: string) => {
    const updatedTables = tables.filter(table => table.id !== tableId);
    onTableUpdate?.(updatedTables);
    
    const newExpanded = new Set(expandedTables);
    newExpanded.delete(tableId);
    setExpandedTables(newExpanded);
    
    if (selectedTable?.id === tableId) {
      onTableSelect?.(null);
    }
    toast.success('Table deleted!');
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20">
      <div className="p-4 border-b bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Table View</h2>
            <p className="text-sm text-muted-foreground">
              ClickUp-style database management
            </p>
          </div>
          <Button onClick={addTable} className="bg-gradient-to-r from-primary to-primary/80">
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {tables.map(table => (
          <Card 
            key={table.id} 
            className={cn(
              "transition-all duration-200 hover:shadow-lg border-2",
              selectedTable?.id === table.id && "ring-2 ring-primary ring-offset-2",
              "bg-gradient-to-br from-card to-card/95"
            )}
            onClick={() => onTableSelect?.(table)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTableExpansion(table.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    {expandedTables.has(table.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <CardTitle 
                    className="text-lg text-card-foreground"
                  >
                    {table.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {table.fields.length} fields
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addField(table.id);
                    }}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTable(table.id);
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedTables.has(table.id) && (
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30">
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead>Constraints</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.fields.map(field => (
                      <TableRow 
                        key={field.id}
                        className={cn(
                          "group hover:bg-muted/50 transition-colors",
                          field.primaryKey && "bg-gradient-to-r from-yellow-50 to-transparent"
                        )}
                      >
                        <TableCell className="p-2">
                          <div className="flex items-center gap-1">
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
                        
                        <TableCell className="p-2">
                          {editingField?.tableId === table.id && editingField?.fieldId === field.id ? (
                            <Input
                              value={field.name}
                              onChange={(e) => updateField(table.id, field.id, { name: e.target.value })}
                              onBlur={() => setEditingField(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                              className="h-8 text-sm"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
                              onClick={() => setEditingField({ tableId: table.id, fieldId: field.id })}
                            >
                              {field.name}
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell className="p-2">
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateField(table.id, field.id, { type: value as DataType })}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue>
                                <DataTypePill type={field.type} size="sm" />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {DATA_TYPES.map(type => (
                                <SelectItem key={type} value={type}>
                                  <DataTypePill type={type} size="sm" />
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        
                        <TableCell className="p-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`pk-${field.id}`}
                                checked={field.primaryKey}
                                onCheckedChange={(checked) => 
                                  updateField(table.id, field.id, { 
                                    primaryKey: !!checked,
                                    nullable: checked ? false : field.nullable 
                                  })
                                }
                              />
                              <label htmlFor={`pk-${field.id}`} className="text-xs font-medium">
                                PK
                              </label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`unique-${field.id}`}
                                checked={field.unique}
                                onCheckedChange={(checked) => 
                                  updateField(table.id, field.id, { unique: !!checked })
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
                                  updateField(table.id, field.id, { nullable: !!checked })
                                }
                                disabled={field.primaryKey}
                              />
                              <label htmlFor={`nullable-${field.id}`} className="text-xs font-medium">
                                Nullable
                              </label>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteField(table.id, field.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        ))}

        {tables.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No tables yet</p>
              <p className="text-sm">Click "Add Table" to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}