import React, { useState } from 'react';
import type { TargetElement } from './UnifiedCommentsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedCommentsPanel } from './UnifiedCommentsPanel';

interface EnhancedCommentPopoverProps {
  // For field-specific comments
  fieldId?: string;
  fieldName?: string;
  tableName?: string;
  
  // For table-specific comments
  tableId?: string;
  
  // General props
  projectId: string;
  comments?: any[]; // Legacy support
  compact?: boolean;
  onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string, commentText: string, isTask: boolean) => void;
  onViewComments?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
}

export function EnhancedCommentPopover({
  fieldId,
  fieldName,
  tableName,
  tableId,
  projectId,
  comments = [],
  compact = false,
  onAddComment,
  onViewComments
}: EnhancedCommentPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasComments = comments && comments.length > 0;

  const handleNavigateToObject = (objectType: string, objectId: string, parentObjectId?: string) => {
    // This function can be used to navigate to specific objects in the database
    // For now, we'll just log the navigation request
    console.log('Navigate to object:', { objectType, objectId, parentObjectId });
  };

  const getTargetInfo = (): TargetElement | null => {
    if (fieldId) {
      return {
        type: 'field',
        id: fieldId,
        name: fieldName || '',
        parentId: tableId,
        parentName: tableName
      };
    } else if (tableId) {
      return {
        type: 'table',
        id: tableId,
        name: tableName || '',
        parentId: undefined,
        parentName: undefined
      };
    }
    return null;
  };

  const targetInfo = getTargetInfo();

  if (!targetInfo) {
    return null; // Don't render if we don't have proper target info
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          className={cn(
            "relative",
            compact ? "h-6 w-6 p-0" : "h-8 w-8 p-0"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (onViewComments) {
              // Type assertion is safe here because we know targetInfo.type is either 'table' or 'field'
              const elementType = targetInfo.type as 'table' | 'field';
              onViewComments(elementType, targetInfo.id, targetInfo.name);
            }
          }}
        >
          <MessageSquare className={compact ? "h-3 w-3" : "h-4 w-4"} />
          {hasComments && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
            >
              {comments.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 h-[500px] p-0" 
        side="right" 
        align="start"
        sideOffset={8}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">Comments & Tasks</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {targetInfo.type === 'field' && targetInfo.parentName 
                ? `${targetInfo.parentName}.${targetInfo.name}`
                : targetInfo.name}
            </p>
          </div>
          
          {/* Comments Panel */}
          <div className="flex-1 overflow-hidden">
            <UnifiedCommentsPanel
              projectId={projectId}
              onNavigateToObject={handleNavigateToObject}
              isOpen={isOpen}
              targetElement={{
                type: targetInfo.type,
                id: targetInfo.id,
                name: targetInfo.name,
                parentId: tableName && fieldId ? tableId : undefined,
                parentName: tableName && fieldId ? tableName : undefined
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
