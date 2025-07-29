import React from 'react';
import { DatabaseTable, DataType } from '@/types/database';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DataTypePill } from './DataTypePill';

interface TableViewProps {
  tables: DatabaseTable[];
  onTableSelect?: (table: DatabaseTable | null) => void;
  selectedTable?: DatabaseTable | null;
}

/**
 * TableView component displays database tables in a tabular format
 * as an alternative to the diagram/canvas view
 */
export function TableView({ 
  tables, 
  onTableSelect,
  selectedTable 
}: TableViewProps) {
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
                className={`overflow-hidden cursor-pointer transition-all hover:border-primary/50 ${
                  selectedTable?.id === table.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => onTableSelect?.(table)}
              >
                <CardHeader className="py-3 px-4 bg-muted/50">
                  <CardTitle className="text-md flex items-center justify-between">
                    <span>{table.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {table.fields.length} fields
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">Field</TableHead>
                        <TableHead className="w-1/4">Type</TableHead>
                        <TableHead className="w-1/4">Constraints</TableHead>
                        <TableHead className="w-1/4">Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.fields.map(field => (
                        <TableRow key={field.id}>
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
                                <Badge variant="outline" className="text-xs">FK</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {field.defaultValue || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
