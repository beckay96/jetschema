import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, List, Edit, Trash2 } from 'lucide-react';
import { DatabaseEnumeration, EnumerationSidebarProps } from '@/types/enumerations';
import { cn } from '@/lib/utils';

export function EnumerationsSidebar({
  projectId,
  enumerations,
  onEnumerationSelect,
  onEnumerationCreate,
  onEnumerationEdit,
  onEnumerationDelete
}: EnumerationSidebarProps) {
  const [selectedEnumId, setSelectedEnumId] = useState<string | null>(null);

  const handleEnumerationClick = (enumeration: DatabaseEnumeration) => {
    setSelectedEnumId(enumeration.id);
    onEnumerationSelect(enumeration);
  };

  const handleEdit = (e: React.MouseEvent, enumeration: DatabaseEnumeration) => {
    e.stopPropagation();
    onEnumerationEdit(enumeration);
  };

  const handleDelete = (e: React.MouseEvent, enumeration: DatabaseEnumeration) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the enumeration "${enumeration.name}"?`)) {
      onEnumerationDelete(enumeration.id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5" />
          <h3 className="font-semibold">Enumerations</h3>
          <Badge variant="secondary" className="text-xs">
            {enumerations.length}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={onEnumerationCreate}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Enumerations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {enumerations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No enumerations yet</p>
              <p className="text-xs mt-1">
                Create your first enumeration to get started
              </p>
            </div>
          ) : (
            enumerations.map((enumeration) => (
              <div
                key={enumeration.id}
                className={cn(
                  "group relative p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                  selectedEnumId === enumeration.id && "bg-accent border-primary"
                )}
                onClick={() => handleEnumerationClick(enumeration)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {enumeration.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {enumeration.values.length} values
                      </Badge>
                    </div>
                    
                    {enumeration.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {enumeration.description}
                      </p>
                    )}

                    {/* Values Preview */}
                    <div className="flex flex-wrap gap-1">
                      {enumeration.values.slice(0, 3).map((value, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs px-1.5 py-0.5"
                        >
                          {value}
                        </Badge>
                      ))}
                      {enumeration.values.length > 3 && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0.5 opacity-60"
                        >
                          +{enumeration.values.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleEdit(e, enumeration)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDelete(e, enumeration)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Created info */}
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  Created {new Date(enumeration.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
