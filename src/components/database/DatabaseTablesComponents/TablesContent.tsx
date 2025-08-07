import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { DatabaseTable } from '@/types/database';
import { SortableTableCard } from '@/components/database/LeftSidebarFeatures/SortableTableCard';

interface TablesContentProps {
  tables: DatabaseTable[];
  selectedTable?: DatabaseTable | null;
  onAddTable?: () => void;
  onSelectTable?: (table: DatabaseTable) => void;
  onDeleteTable?: (tableId: string) => void;
  onReorderTables?: (reorderedTables: DatabaseTable[]) => void;
}

/**
 * TablesContent component for displaying and managing database tables
 */
export function TablesContent({
  tables,
  selectedTable,
  onAddTable,
  onSelectTable,
  onDeleteTable,
  onReorderTables
}: TablesContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Function to handle table reordering
  const handleTableReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = tables.findIndex(table => table.id === active.id);
      const newIndex = tables.findIndex(table => table.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Create a new array with the reordered tables
        const reorderedTables = [...tables];
        const [movedItem] = reorderedTables.splice(oldIndex, 1);
        reorderedTables.splice(newIndex, 0, movedItem);
        
        // Update the parent component with the new order
        console.log('Tables reordered:', reorderedTables);
        onReorderTables?.(reorderedTables);
      }
    }
  };
  
  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to start
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    table.fields.some(field => field.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full">
      <div className="flex-shrink-0 space-y-2 mb-4 pt-2 pl-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="p-2 h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search tables..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="h-8 pl-7 text-sm" 
            />
          </div>
          <Button size="sm" onClick={onAddTable} className="h-8">
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {tables.length} tables
          </Badge>
          <Badge variant="outline" className="text-xs">
            {tables.reduce((acc, table) => acc + table.fields.length, 0)} fields
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden h-full" type="always">
        <div className="space-y-2">
          {filteredTables.length > 0 ? (
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter}
              onDragEnd={handleTableReorder}
            >
              <SortableContext 
                items={filteredTables.map(table => table.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 pt-1 w-full">
                  {filteredTables.map(table => {
                    const hasWarnings = table.fields.length < 2 || !table.fields.some(f => f.primaryKey);
                    const isValidated = table.fields.length >= 2 && 
                                    table.fields.some(f => f.primaryKey) && 
                                    table.fields.every(f => f.name && f.type);
                    
                    return (
                      <SortableTableCard 
                        key={table.id}
                        table={table}
                        isSelected={selectedTable?.id === table.id}
                        isValidated={isValidated}
                        hasWarnings={hasWarnings}
                        onSelect={() => onSelectTable?.(table)}
                        onDelete={() => onDeleteTable?.(table.id)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No tables found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={onAddTable}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Table
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
