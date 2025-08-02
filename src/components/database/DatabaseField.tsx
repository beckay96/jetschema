import { DatabaseField as DatabaseFieldType } from '@/types/database';
import { DataTypePill } from './DataTypePill';
import { FieldCommentButton } from './FieldCommentButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Key, Link, Star, Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseFieldProps {
  field: DatabaseFieldType;
  tableName?: string;
  onEdit?: (field: DatabaseFieldType) => void;
  onDelete?: (fieldId: string) => void;
  onAddComment?: (tableName: string, fieldName: string) => void;
  compact?: boolean;
}

export function DatabaseField({ field, tableName, onEdit, onDelete, onAddComment, compact = false }: DatabaseFieldProps) {
  return (
    <div className={cn(
      "group flex items-center justify-between p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50 transition-all",
      compact && "p-1.5"
    )}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="flex items-center gap-1">
           {field.primaryKey && (
             <Key className="h-3 w-3 text-[hsl(var(--status-primary-key))]" />
           )}
           {field.foreignKey && (
             <Link className="h-3 w-3 text-[hsl(var(--status-foreign-key))]" />
           )}
          {field.unique && !field.primaryKey && (
            <Star className="h-3 w-3 text-[hsl(var(--status-unique))]" />
          )}
        </div>
        
        <span className={cn(
          "font-medium truncate",
          compact ? "text-sm" : "text-base",
          field.primaryKey && "font-semibold text-[hsl(var(--status-primary-key))]"
        )}>
          {field.name}
        </span>
        
        <DataTypePill type={field.type} size={compact ? "sm" : "md"} />
        
        <div className="flex gap-1">
          {!field.nullable && (
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{
                borderColor: 'hsl(var(--status-not-null) / 0.3)',
                color: 'hsl(var(--status-not-null))',
                backgroundColor: 'hsl(var(--status-not-null) / 0.1)'
              }}
            >
              NOT NULL
            </Badge>
          )}
          {field.defaultValue && (
            <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground">
              DEFAULT
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {tableName && (
          <FieldCommentButton
            tableName={tableName}
            fieldName={field.name}
            onAddComment={onAddComment}
            compact={compact}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onEdit?.(field)}
        >
          <Edit3 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete?.(field.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}