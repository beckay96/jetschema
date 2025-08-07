import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';
import { DatabaseTable } from '@/types/database';
import { DataTypePill } from '../../../Settings/DataTypePill';

interface SortableTableItemProps {
  table: DatabaseTable;
  selectedTable?: DatabaseTable | null;
  onSelectTable?: (table: DatabaseTable) => void;
  isDragLocked?: boolean;
}

function SortableTableItem({ table, selectedTable, onSelectTable, isDragLocked = false }: SortableTableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 ${
        selectedTable?.id === table.id 
          ? 'ring-2 ring-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md' 
          : 'hover:bg-gradient-to-br hover:from-muted/30 hover:to-muted/20 border-primary/10'
      }`} 
      onClick={() => onSelectTable?.(table)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div 
            {...(isDragLocked ? {} : attributes)} 
            {...(isDragLocked ? {} : listeners)}
            className={`transition-opacity ${
              isDragLocked 
                ? 'cursor-not-allowed opacity-30' 
                : 'cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100'
            }`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-sm truncate flex-1">{table.name}</h4>
          <Badge variant="outline" className="text-xs">
            {table.fields.length} fields
          </Badge>
        </div>
        
        <div className="space-y-1 ml-6">
          {table.fields.slice(0, 3).map(field => (
            <div key={field.id} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground truncate flex-1">
                {field.name}
              </span>
              <DataTypePill type={field.type} size="sm" />
            </div>
          ))}
          {table.fields.length > 3 && (
            <div className="text-xs text-muted-foreground ml-0">
              +{table.fields.length - 3} more fields
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface DragDropTableListProps {
  tables: DatabaseTable[];
  selectedTable?: DatabaseTable | null;
  onSelectTable?: (table: DatabaseTable) => void;
  onReorderTables?: (tables: DatabaseTable[]) => void;
  isDragLocked?: boolean;
}

export function DragDropTableList({ 
  tables, 
  selectedTable, 
  onSelectTable, 
  onReorderTables,
  isDragLocked = false
}: DragDropTableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    if (isDragLocked) return;
    
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = tables.findIndex(table => table.id === active.id);
      const newIndex = tables.findIndex(table => table.id === over.id);
      
      const newTables = arrayMove(tables, oldIndex, newIndex);
      onReorderTables?.(newTables);
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tables.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tables.map(table => (
            <SortableTableItem 
              key={table.id} 
              table={table}
              selectedTable={selectedTable}
              onSelectTable={onSelectTable}
              isDragLocked={isDragLocked}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}