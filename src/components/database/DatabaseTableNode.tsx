import { useState, useEffect, useRef } from 'react';
import { DatabaseTable } from '@/types/database';
import { DatabaseField } from './DatabaseField';
import { DatabaseFieldWithContext } from './DatabaseFieldWithContext';
import { TableEditModal } from './TableEditModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Settings, Maximize2, Minimize2, Check, X, Copy, MessageCircle, MoveHorizontal, MoveVertical, Pencil, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateTableSQL, copyToClipboard } from '@/utils/sqlGenerator';
import { toast } from 'sonner';
import { SchemaContextMenu, SchemaElementType } from './SchemaContextMenu';

interface DatabaseTableNodeProps {
  data: {
    table: DatabaseTable;
    allTables?: DatabaseTable[];
    onEditTable?: (table: DatabaseTable) => void;
    onEditField?: (field: any) => void;
    onDeleteField?: (tableId: string, fieldId: string) => void;
    onAddField?: (tableId: string) => void;
    onAddComment?: (elementType: SchemaElementType, elementId: string, elementName: string) => void;
    onMarkAsTask?: (elementType: SchemaElementType, elementId: string, elementName: string, priority: 'low' | 'medium' | 'high') => void;
    onJumpToElement?: (elementType: SchemaElementType, elementId: string) => void;
    onValidate?: (elementType: SchemaElementType, elementId: string) => void;
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
    onMarkAsTask,
    onJumpToElement,
    onValidate,
    selected = false,
    compact: initialCompact = false
  } = data;
  
  const isMobile = useIsMobile();
  const [isCompact, setIsCompact] = useState(initialCompact || isMobile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(table.name);
  const [isHovering, setIsHovering] = useState(false);
  
  // Size options: small, medium, large, xlarge, huge
  const [sizeOption, setSizeOption] = useState<'small' | 'medium' | 'large' | 'xlarge' | 'huge'>(table.sizePreference || 'medium');
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Set up keyboard listener for quick field add
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isHovering && e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey && onAddField) {
        e.preventDefault();
        onAddField(table.id);
        
        // Show a brief tooltip
        const tooltip = document.createElement('div');
        tooltip.innerText = 'Adding new field';
        tooltip.className = 'fixed bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-lg z-50';
        tooltip.style.top = `${window.innerHeight / 2}px`;
        tooltip.style.left = `${window.innerWidth / 2 - 50}px`;
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
          document.body.removeChild(tooltip);
        }, 1500);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isHovering, onAddField, table.id]);
  
  const handleNameSave = () => {
    if (tempName.trim() && tempName !== table.name) {
      onEditTable?.({ ...table, name: tempName.trim() });
    }
    setIsEditingName(false);
    setTempName(table.name);
  };
  
  // Size toggle handler
  const handleSizeToggle = () => {
    const sizeOptions: Array<'small' | 'medium' | 'large' | 'xlarge' | 'huge'> = [
      'small', 'medium', 'large', 'xlarge', 'huge'
    ];
    const currentIndex = sizeOptions.indexOf(sizeOption);
    const nextSize = sizeOptions[(currentIndex + 1) % sizeOptions.length];
    setSizeOption(nextSize);
    
    // Save the size preference
    onEditTable?.({ ...table, sizePreference: nextSize });
  };

  const handleNameCancel = () => {
    setTempName(table.name);
    setIsEditingName(false);
  };

  const handleCopyTableSQL = async () => {
    try {
      const sql = generateTableSQL(table);
      await copyToClipboard(sql);
      toast.success(`${table.name} SQL copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy SQL');
    }
  };
  
  const primaryKeyFields = table.fields.filter(f => f.primaryKey);
  const foreignKeyFields = table.fields.filter(f => f.foreignKey);
  const regularFields = table.fields.filter(f => !f.primaryKey && !f.foreignKey);

  // Handle context menu actions
  const handleAddComment = (elementType: SchemaElementType, elementId: string, elementName: string) => {
    if (onAddComment) {
      onAddComment(elementType, elementId, elementName);
      // Removed toast notification as it's now handled by the status pill in ProjectEditor
    }
  };
  
  // Adapter function to bridge between old and new comment callback styles
  const handleFieldComment = (tableName: string, fieldName: string) => {
    if (onAddComment) {
      onAddComment('field', fieldName, fieldName);
    }
  };

  const handleMarkAsTask = (elementType: SchemaElementType, elementId: string, elementName: string, priority: 'low' | 'medium' | 'high') => {
    if (onMarkAsTask) {
      onMarkAsTask(elementType, elementId, elementName, priority);
      toast.success(`Marked ${elementName} as ${priority} priority task`);
    }
  };

  return (
    <>
      <div
        ref={nodeRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="nodrag" // Keep this minimal to avoid layout issues
      >
        {isHovering && !isCompact && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded border shadow-sm z-10 whitespace-nowrap">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded mx-1">F</kbd> to add field
          </div>
        )}
      </div>
      <SchemaContextMenu
        elementType="table"
        elementId={table.id}
        elementName={table.name}
        onAddComment={handleAddComment}
        onMarkAsTask={handleMarkAsTask}
        onJumpToElement={onJumpToElement}
        onValidate={onValidate}
        onCopyName={(name) => {
          try {
            navigator.clipboard.writeText(name)
              .then(() => {
                // Use status message instead of toast
                // toast.success(`Copied "${name}" to clipboard`);
              })
              .catch(err => {
                console.error('Failed to copy to clipboard:', err);
              });
          } catch (error) {
            console.error('Clipboard API error:', error);
          }
        }}
        className="w-full">
        <Card 
          className={cn(
            "transition-all duration-200 hover:shadow-lg text-black dark:text-white cursor-move flex flex-col",
            "bg-gradient-to-br from-db-table to-db-table/95 text-black dark:text-white",
            "border-db-table-border shadow-table text-black dark:text-white",
            selected && "ring-2 ring-primary ring-offset-2 text-black dark:text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]",
            "w-full min-w-[200px]",
            // Size classes based on size preference
            sizeOption === 'small' && "max-w-[250px] max-h-[150px]",
            sizeOption === 'medium' && "max-w-[350px] max-h-[250px]",
            sizeOption === 'large' && "max-w-[450px] max-h-[350px]",
            sizeOption === 'xlarge' && "max-w-[550px] max-h-[450px]",
            sizeOption === 'huge' && "max-w-[650px] max-h-[550px]",
            isCompact ? "" : "hover:translate-y-[-2px] hover:shadow-xl",
            "table-drag-handle"
          )}
          // Add drag handle attribute to make card draggable
          data-draghandle="true"
        >
          <CardHeader 
            className={cn(
              "pb-3 bg-gradient-to-r from-db-table-header to-db-table-header/90 text-white rounded-t-lg table-drag-handle",
              (isCompact || isMobile) && "pb-2"
            )}
            // Add drag handle to header
          >
            <div className="flex items-center justify-between cursor-move table-drag-handle" data-draghandle="true">
              <div className="min-w-0 flex-1">
                <div className="absolute top-1.5 left-1.5 opacity-30 hover:opacity-60 transition-opacity duration-200">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 8H8V4H4V8ZM10 20H14V16H10V20ZM4 20H8V16H4V20ZM4 14H8V10H4V14ZM10 14H14V10H10V14ZM16 4V8H20V4H16ZM10 8H14V4H10V8ZM16 14H20V10H16V14ZM16 20H20V16H16V20Z" fill="currentColor"/>
                  </svg>
                </div>
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
                
                {/* Field completion progress bar */}
                {!(isCompact || isMobile) && !isEditingName && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>{table.fields.length} fields added</span>
                      <span className="opacity-80">{table.fields.filter(f => f.primaryKey).length > 0 ? 'PK defined' : 'No PK yet'}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${table.fields.filter(f => f.primaryKey).length > 0 ? 'bg-emerald-400' : 'bg-blue-400'}`}
                        style={{ width: `${Math.min(100, table.fields.length * 10)}%` }}
                      />
                    </div>
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
                  </div>
                )}
              </div>
              
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 text-white hover:bg-white/20"
                  title={`Size: ${sizeOption} (click to toggle)`}
                  onClick={handleSizeToggle}
                >
                  {(sizeOption === 'small' || sizeOption === 'medium') && <ArrowsOut className="w-3 h-3" />}
                  {(sizeOption === 'large' || sizeOption === 'xlarge' || sizeOption === 'huge') && <ArrowsIn className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 text-white hover:bg-white/20"
                  title="Copy SQL"
                  onClick={handleCopyTableSQL}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 text-white hover:bg-white/20"
                  onClick={() => onEditTable?.(table)}
                  title="Edit Table"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 text-white hover:bg-white/20"
                  onClick={() => onAddField?.(table.id)}
                  title="Add Field"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
      
      <CardContent className={cn(
        "p-0 flex-1 min-h-0 overflow-y-auto",
        (isCompact || isMobile) && "max-h-48"
      )}>
        <div className={cn("space-y-1", isMobile ? "p-2" : "p-3")}>
          {/* Primary Key Fields */}
          {primaryKeyFields.map(field => (
            <DatabaseFieldWithContext
              key={field.id}
              field={field}
              tableName={table.name}
              tableId={table.id}
              onEdit={() => onEditField?.(field)}
              onDelete={(fieldId) => onDeleteField?.(table.id, fieldId)}
              onAddComment={onAddComment}
              onMarkAsTask={onMarkAsTask}
              onJumpToElement={onJumpToElement}
              onValidate={onValidate}
              compact={isCompact || isMobile}
            />
          ))}
          
          {/* Foreign Key Fields */}
          {foreignKeyFields.map(field => (
            <DatabaseFieldWithContext
              key={field.id}
              field={field}
              tableName={table.name}
              tableId={table.id}
              onEdit={() => onEditField?.(field)}
              onDelete={(fieldId) => onDeleteField?.(table.id, fieldId)}
              onAddComment={onAddComment}
              onMarkAsTask={onMarkAsTask}
              onJumpToElement={onJumpToElement}
              onValidate={onValidate}
              compact={isCompact || isMobile}
            />
          ))}
          
          {/* Regular Fields */}
          {regularFields.map(field => (
            <DatabaseFieldWithContext
              key={field.id}
              field={field}
              tableName={table.name}
              tableId={table.id}
              onEdit={() => onEditField?.(field)}
              onDelete={(fieldId) => onDeleteField?.(table.id, fieldId)}
              onAddComment={onAddComment}
              onMarkAsTask={onMarkAsTask}
              onJumpToElement={onJumpToElement}
              onValidate={onValidate}
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
    </SchemaContextMenu>
  </>
);

}