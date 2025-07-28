import { useState } from 'react';
import { DatabaseTable } from '@/types/database';
import { DatabaseField } from './DatabaseField';
import { TableEditModal } from './TableEditModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Settings, Maximize2, Minimize2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DatabaseTableNodeProps {
  data: {
    table: DatabaseTable;
    allTables?: DatabaseTable[];
    onEditTable?: (table: DatabaseTable) => void;
    onEditField?: (field: any) => void;
    onDeleteField?: (tableId: string, fieldId: string) => void;
    onAddField?: (tableId: string) => void;
    onAddComment?: (tableName: string, fieldName: string) => void;
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
    onAddComment,
    selected = false,
    compact: initialCompact = false
  } = data;
  
  const isMobile = useIsMobile();
  const [isCompact, setIsCompact] = useState(initialCompact || isMobile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(table.name);
  
  const handleNameSave = () => {
    if (tempName.trim() && tempName !== table.name) {
      onEditTable?.({ ...table, name: tempName.trim() });
    }
    setIsEditingName(false);
    setTempName(table.name);
  };

  const handleNameCancel = () => {
    setTempName(table.name);
    setIsEditingName(false);
  };
  
  const primaryKeyFields = table.fields.filter(f => f.primaryKey);
  const foreignKeyFields = table.fields.filter(f => f.foreignKey);
  const regularFields = table.fields.filter(f => !f.primaryKey && !f.foreignKey);

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg text-white table-drag-handle cursor-move flex flex-col",
      "bg-gradient-to-br from-db-table to-db-table/95 text-white",
      "border-db-table-border shadow-table text-white",
      selected && "ring-2 ring-primary ring-offset-2 text-white",
      isMobile 
        ? "w-72 max-h-80 min-w-[280px]" 
        : isCompact 
          ? "w-64 max-h-64" 
          : "w-80 max-h-96"
    )}>
      <CardHeader className={cn(
        "pb-3 bg-gradient-to-r from-db-table-header to-db-table-header/90 text-white rounded-t-lg",
        (isCompact || isMobile) && "pb-2"
      )}>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className={cn(
                    "bg-white/20 border-white/30 text-white placeholder:text-white/60",
                    (isCompact || isMobile) ? "text-sm h-7" : "text-lg h-8"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') handleNameCancel();
                  }}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  onClick={handleNameSave}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  onClick={handleNameCancel}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <h3 
                className={cn(
                  "font-bold truncate cursor-pointer hover:bg-white/10 px-2 py-1 rounded",
                  (isCompact || isMobile) ? "text-sm" : "text-lg"
                )}
                onClick={() => setIsEditingName(true)}
                title="Click to edit table name"
              >
                {table.name}
              </h3>
            )}
            {!(isCompact || isMobile) && !isEditingName && table.comment && (
              <p className="text-sm text-white/80 mt-1 truncate">
                {table.comment}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                onClick={() => setIsCompact(!isCompact)}
              >
                {isCompact ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
            )}
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
        
        {!(isCompact || isMobile) && (
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
        "p-0 flex-1 min-h-0 overflow-y-auto",
        (isCompact || isMobile) && "max-h-48"
      )}>
        <div className={cn("space-y-1", isMobile ? "p-2" : "p-3")}>
          {/* Primary Key Fields */}
          {primaryKeyFields.map(field => (
            <DatabaseField
              key={field.id}
              field={field}
              tableName={table.name}
              onEdit={() => setShowEditModal(true)}
              onDelete={(fieldId) => onDeleteField?.(table.id, fieldId)}
              onAddComment={onAddComment}
              compact={isCompact || isMobile}
            />
          ))}
          
          {/* Foreign Key Fields */}
          {foreignKeyFields.map(field => (
            <DatabaseField
              key={field.id}
              field={field}
              tableName={table.name}
              onEdit={() => setShowEditModal(true)}
              onDelete={(fieldId) => onDeleteField?.(table.id, fieldId)}
              onAddComment={onAddComment}
              compact={isCompact || isMobile}
            />
          ))}
          
          {/* Regular Fields */}
          {regularFields.map(field => (
            <DatabaseField
              key={field.id}
              field={field}
              tableName={table.name}
              onEdit={() => setShowEditModal(true)}
              onDelete={(fieldId) => onDeleteField?.(table.id, fieldId)}
              onAddComment={onAddComment}
              compact={isCompact || isMobile}
            />
          ))}
          
          {/* Add Field Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-foreground",
              (isCompact || isMobile) ? "h-7 text-xs" : "h-8 text-sm"
            )}
            onClick={() => onAddField?.(table.id)}
          >
            <Plus className={cn("mr-2", (isCompact || isMobile) ? "h-3 w-3" : "h-4 w-4")} />
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
        }}
      />
    </Card>
  );
}