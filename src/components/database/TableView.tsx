import React, { useState } from 'react';
import { DatabaseTable, DataType, DatabaseField as DatabaseFieldType } from '@/types/database';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DataTypePill } from './DataTypePill';
import { FieldCommentButton } from './FieldCommentButton';
import { Plus, Edit, Settings, Trash2 } from 'lucide-react';
import { TableEditModal } from './TableEditModal';
import { FieldEditModal } from './FieldEditModal';

interface TableViewProps {
  tables: DatabaseTable[];
  onTableSelect?: (table: DatabaseTable | null) => void;
  onTableUpdate?: (tables: DatabaseTable[]) => void;
  onAddTable?: (table: DatabaseTable) => void;
  onDeleteTable?: (tableId: string) => void;
  onAddComment?: (tableName: string, fieldName: string) => void;
  selectedTable?: DatabaseTable | null;
}

/**
 * TableView component displays database tables in a tabular format
 * as an alternative to the diagram/canvas view
 */
export function TableView({ 
  tables, 
  onTableSelect,
  onTableUpdate,
  onAddTable,
  onDeleteTable,
  onAddComment,
  selectedTable 
}: TableViewProps) {
  const [editingTable, setEditingTable] = useState<DatabaseTable | null>(null);
  const [editingField, setEditingField] = useState<{tableId: string, field: DatabaseFieldType} | null>(null);
  
  const handleEditTable = (table: DatabaseTable) => {
    setEditingTable({...table});
  };

  const handleSaveTable = (updatedTable: DatabaseTable) => {
    if (onTableUpdate) {
      const updatedTables = tables.map(t => 
        t.id === updatedTable.id ? updatedTable : t
      );
      onTableUpdate(updatedTables);
    }
    setEditingTable(null);
  };
  
  const handleAddField = (tableId: string) => {
    if (onTableUpdate) {
      const updatedTables = tables.map(t => {
        if (t.id === tableId) {
          const newField = {
            id: `field-${Date.now()}`,
            name: `new_field_${t.fields.length + 1}`,
            type: 'VARCHAR' as DataType,
            nullable: true,
            primaryKey: false,
            unique: false,
            foreignKey: null,
            defaultValue: null,
            comment: null
          };
          return {
            ...t,
            fields: [...t.fields, newField]
          };
        }
        return t;
      });
      onTableUpdate(updatedTables);
    }
  };
  
  const handleDeleteField = (tableId: string, fieldId: string) => {
    if (onTableUpdate) {
      const updatedTables = tables.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            fields: t.fields.filter(f => f.id !== fieldId)
          };
        }
        return t;
      });
      onTableUpdate(updatedTables);
    }
  };
  
  const handleEditField = (tableId: string, field: DatabaseFieldType) => {
    setEditingField({ tableId, field });
  };
  
  const handleSaveField = (tableId: string, updatedField: DatabaseFieldType) => {
    if (onTableUpdate) {
      const updatedTables = tables.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            fields: t.fields.map(f => f.id === updatedField.id ? updatedField : f)
          };
        }
        return t;
      });
      onTableUpdate(updatedTables);
    }
    setEditingField(null);
  };
  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <h2 className="text-lg font-semibold mb-4">Database Tables</h2>
      
      {tables.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">No tables defined</p>
          <p className="text-sm">Create a new table to get started</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-6 pb-4">
            {tables.map(table => (
              <Card 
                key={table.id} 
                className={`overflow-hidden transition-all hover:border-primary/50 ${
                  selectedTable?.id === table.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
              >
                <CardHeader className="py-3 px-4 bg-muted/50 cursor-pointer" onClick={() => onTableSelect?.(table)}>
                  <CardTitle className="text-md flex items-center justify-between">
                    <span>{table.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="ml-2">
                        {table.fields.length} fields
                      </Badge>
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTable(table);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  {table.comment && (
                    <p className="text-sm text-muted-foreground mt-1">{table.comment}</p>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Actions</TableHead>
                        <TableHead className="w-1/4">Field</TableHead>
                        <TableHead className="w-1/4">Type</TableHead>
                        <TableHead className="w-1/4">Constraints</TableHead>
                        <TableHead className="w-1/4">Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.fields.map(field => (
                        <TableRow key={field.id} className="group hover:bg-muted/40">
                          <TableCell className="font-medium">
                            {field.name}
                          </TableCell>
                          <TableCell>
                            <DataTypePill type={field.type} size="sm" />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {field.primaryKey && (
                                <Badge variant="default" className="text-xs">PK</Badge>
                              )}
                              {field.unique && !field.primaryKey && (
                                <Badge variant="outline" className="text-xs">Unique</Badge>
                              )}
                              {!field.nullable && (
                                <Badge variant="secondary" className="text-xs">Not Null</Badge>
                              )}
                              {field.foreignKey && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                                  title={`References ${field.foreignKey.table}.${field.foreignKey.field}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Find the referenced table and select it
                                    const referencedTable = tables.find(t => t.name === field.foreignKey?.table);
                                    if (referencedTable && onTableSelect) {
                                      onTableSelect(referencedTable);
                                    }
                                  }}
                                >
                                  FK: {field.foreignKey.table}.{field.foreignKey.field}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {field.defaultValue || '-'}
                          </TableCell>
                          <TableCell className="opacity-0 group-hover:opacity-100 transition-opacity w-36 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <FieldCommentButton
                                fieldId={field.id}
                                tableName={table.name}
                                fieldName={field.name}
                                onAddComment={onAddComment}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleEditField(table.id, field)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteField(table.id, field.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="bg-muted/30 p-2 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => handleAddField(table.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Field
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs text-destructive h-7"
                    onClick={() => onDeleteTable?.(table.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete Table
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
      
      {/* Table Edit Modal */}
      {editingTable && (
        <TableEditModal
          open={!!editingTable}
          table={editingTable}
          allTables={tables}
          onTableUpdate={handleSaveTable}
          onOpenChange={(open) => {
            if (!open) setEditingTable(null);
          }}
        />
      )}

      {/* Field Edit Modal */}
      {editingField && (
        <FieldEditModal
          field={editingField.field}
          tableId={editingField.tableId}
          allTables={tables}
          open={!!editingField}
          onOpenChange={(open) => {
            if (!open) setEditingField(null);
          }}
          onFieldUpdate={handleSaveField}
        />
      )}
    </div>
  );
}
