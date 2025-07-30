import { DatabaseField as DatabaseFieldType } from '@/types/database';
import { DatabaseField } from './DatabaseField';
import { SchemaContextMenu, SchemaElementType } from './SchemaContextMenu';
import { toast } from 'sonner';

interface DatabaseFieldWithContextProps {
  field: DatabaseFieldType;
  tableName?: string;
  tableId?: string;
  onEdit?: (field: DatabaseFieldType) => void;
  onDelete?: (fieldId: string) => void;
  onAddComment?: (elementType: SchemaElementType, elementId: string, elementName: string) => void;
  onMarkAsTask?: (elementType: SchemaElementType, elementId: string, elementName: string, priority: 'low' | 'medium' | 'high') => void;
  onJumpToElement?: (elementType: SchemaElementType, elementId: string) => void;
  onValidate?: (elementType: SchemaElementType, elementId: string) => void;
  compact?: boolean;
}

export function DatabaseFieldWithContext({ 
  field, 
  tableName, 
  tableId,
  onEdit, 
  onDelete, 
  onAddComment,
  onMarkAsTask,
  onJumpToElement,
  onValidate,
  compact = false 
}: DatabaseFieldWithContextProps) {
  
  // Bridge adapter for old-style onAddComment callback
  const handleLegacyComment = () => {
    if (onAddComment && tableName) {
      onAddComment('field', field.id, field.name);
    }
  };
  
  return (
    <SchemaContextMenu
      elementType="field"
      elementId={field.id}
      elementName={field.name}
      onAddComment={onAddComment}
      onMarkAsTask={onMarkAsTask}
      onJumpToElement={onJumpToElement}
      onValidate={onValidate}
      onCopyName={(name) => {
        navigator.clipboard.writeText(name);
        toast.success(`Copied "${name}" to clipboard`);
      }}
      className="w-full"
    >
      <DatabaseField
        field={field}
        tableName={tableName}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddComment={handleLegacyComment}
        compact={compact}
      />
    </SchemaContextMenu>
  );
}
