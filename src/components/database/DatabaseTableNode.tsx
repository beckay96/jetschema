import { useState } from 'react';
import { DatabaseTable } from '@/types/database';
import { DatabaseField } from './DatabaseField';
import { TableEditModal } from './TableEditModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseTableNodeProps {
  data: {
    table: DatabaseTable;
    allTables?: DatabaseTable[];
    onEditTable?: (table: DatabaseTable) => void;
    onEditField?: (field: any) => void;
    onDeleteField?: (tableId: string, fieldId: string) => void;
    onAddField?: (tableId: string) => void;
    selected?: boolean;
    compact?: boolean;
  };
}

export function DatabaseTableNode({ data }: DatabaseTableNodeProps) {
  const { 
    table, 
    allTables = [],
    onEditTable, 
    onEditField, 
    onDeleteField, 
    onAddField,
    selected = false,
    compact: initialCompact = false
  } = data;
  
  const [isCompact, setIsCompact] = useState(initialCompact);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const primaryKeyFields = table.fields.filter(f => f.primaryKey);
  const foreignKeyFields = table.fields.filter(f => f.foreignKey);
  const regularFields = table.fields.filter(f => !f.primaryKey && !f.foreignKey);

  return (
    <Card className={cn(
      "w-80 transition-all duration-200 hover:shadow-lg text-white",
      "bg-gradient-to-br from-db-table to-db-table/95 text-white",
      "border-db-table-border shadow-table text-white",
      selected && "ring-2 ring-primary ring-offset-2 text-white",
      isCompact && "w-64"
    )}>
      <CardHeader className={cn(
        "pb-3 bg-gradient-to-r from-db-table-header to-db-table-header/90 text-white rounded-t-lg",
        isCompact && "pb-2"
      )}>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "font-bold truncate",
              isCompact ? "text-sm" : "text-lg"
            )}>
              {table.name}
            </h3>
            {!isCompact && table.comment && (
              <p className="text-sm text-white/80 mt-1 truncate">
                {table.comment}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              onClick={() => setIsCompact(!isCompact)}
            >
              {isCompact ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              onClick={() => setShowEditModal(true)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {!isCompact && (
          <div className="flex gap-1 mt-2">
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
              {table.fields.length} fields
            </Badge>
            {primaryKeyFields.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-100 border-yellow-300/30">
                {primaryKeyFields.length} PK
              </Badge>
            )}
            {foreignKeyFields.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-100 border-blue-300/30">
                {foreignKeyFields.length} FK
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className={cn(
        "p-0 max-h-96 overflow-y-auto",
        isCompact && "max-h-48"
      )}>
        <div className="p-3 space-y-1">
          {/* Primary Key Fields */}
          {primaryKeyFields.map(field => (
            <DatabaseField
              key={field.id}
              field={field}
              onEdit={onEditField}
              onDelete={(fieldId) => onDeleteField?.(table.id, fieldId)}
              compact={isCompact}
            />
          ))}
          
          {/* Foreign Key Fields */}
          {foreignKeyFields.map(field => (
            <DatabaseField
              key={field.id}
              field={field}
              onEdit={onEditField}
              onDelete={(fieldId) => onDeleteField?.(table.id, fieldId)}
              compact={isCompact}
            />
          ))}
          
          {/* Regular Fields */}
          {regularFields.map(field => (
            <DatabaseField
              key={field.id}
              field={field}
              onEdit={onEditField}
              onDelete={(fieldId) => onDeleteField?.(table.id, fieldId)}
              compact={isCompact}
            />
          ))}
          
          {/* Add Field Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-foreground",
              isCompact ? "h-7 text-xs" : "h-8 text-sm"
            )}
            onClick={() => onAddField?.(table.id)}
          >
            <Plus className={cn("mr-2", isCompact ? "h-3 w-3" : "h-4 w-4")} />
            Add Field
          </Button>
        </div>
      </CardContent>

      <TableEditModal
        table={table}
        allTables={allTables}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onTableUpdate={(updatedTable) => {
          onEditTable?.(updatedTable);
          setShowEditModal(false);
        }}
      />
    </Card>
  );
}