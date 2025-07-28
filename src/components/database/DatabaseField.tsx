import { DatabaseField as DatabaseFieldType } from '@/types/database';
import { DataTypePill } from './DataTypePill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Key, Link, Star, Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseFieldProps {
  field: DatabaseFieldType;
  onEdit?: (field: DatabaseFieldType) => void;
  onDelete?: (fieldId: string) => void;
  compact?: boolean;
}

export function DatabaseField({ field, onEdit, onDelete, compact = false }: DatabaseFieldProps) {
  return (
    <div className={cn(
      "group flex items-center justify-between p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50 transition-all",
      compact && "p-1.5"
    )}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="flex items-center gap-1">
          {field.primaryKey && (
            <Key className="h-3 w-3 text-yellow-500" />
          )}
          {field.foreignKey && (
            <Link className="h-3 w-3 text-blue-500" />
          )}
          {field.unique && !field.primaryKey && (
            <Star className="h-3 w-3 text-purple-500" />
          )}
        </div>
        
        <span className={cn(
          "font-medium truncate",
          compact ? "text-sm" : "text-base",
          field.primaryKey && "text-yellow-700 font-semibold"
        )}>
          {field.name}
        </span>
        
        <DataTypePill type={field.type} size={compact ? "sm" : "md"} />
        
        <div className="flex gap-1">
          {!field.nullable && (
            <Badge variant="outline" className="text-xs border-red-200 text-red-600">
              NOT NULL
            </Badge>
          )}
          {field.defaultValue && (
            <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
              DEFAULT
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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