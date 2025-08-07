import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { DatabaseTable } from '@/types/database';
import { DataTypePill } from '../../Settings/DataTypePill';

interface SortableTableCardProps {
  table: DatabaseTable;
  isSelected: boolean;
  isValidated: boolean;
  hasWarnings: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

/**
 * SortableTableCard component for displaying and managing draggable table cards
 */
export function SortableTableCard({
  table,
  isSelected,
  isValidated,
  hasWarnings,
  onSelect,
  onDelete
}: SortableTableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: table.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="touch-manipulation">
      <Card 
        className={`card-enhanced cursor-pointer group ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
        } ${isValidated ? 'card-validated' : hasWarnings ? 'card-warning' : ''}`}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm truncate">
              <div className="flex items-center gap-1" {...listeners}>
                <div className="cursor-grab active:cursor-grabbing">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grip opacity-60 hover:opacity-100">
                    <circle cx="9" cy="6" r="2"/>
                    <circle cx="9" cy="18" r="2"/>
                    <circle cx="15" cy="6" r="2"/>
                    <circle cx="15" cy="18" r="2"/>
                    <circle cx="9" cy="12" r="2"/>
                    <circle cx="15" cy="12" r="2"/>
                  </svg>
                </div>
                <span onClick={onSelect}>{table.name}</span>
              </div>
            </h4>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover-icon" onClick={e => {
                e.stopPropagation();
                onDelete();
              }}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            {table.fields.slice(0, 3).map(field => 
              <div key={field.id} className="flex items-center justify-between" onClick={onSelect}>
                <div className="truncate flex-1">{field.name}</div>
                <DataTypePill type={field.type} size="sm" />
              </div>)}
            {table.fields.length > 3 && <div className="text-xs text-muted-foreground" onClick={onSelect}>
                +{table.fields.length - 3} more fields
              </div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
