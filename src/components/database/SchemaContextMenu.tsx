import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { MessageCircle, CheckCircle, PencilLine, ExternalLink, AlertCircle, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SchemaElementType = 'table' | 'field';

interface SchemaContextMenuProps {
  children: React.ReactNode;
  elementType: SchemaElementType;
  elementName: string;
  elementId: string;
  onAddComment?: (elementType: SchemaElementType, elementId: string, elementName: string) => void;
  onMarkAsTask?: (elementType: SchemaElementType, elementId: string, elementName: string, priority: 'low' | 'medium' | 'high') => void;
  onCopyName?: (elementName: string) => void;
  onJumpToElement?: (elementType: SchemaElementType, elementId: string) => void;
  onValidate?: (elementType: SchemaElementType, elementId: string) => void;
  className?: string;
}

export function SchemaContextMenu({
  children,
  elementType,
  elementName,
  elementId,
  onAddComment,
  onMarkAsTask,
  onCopyName,
  onJumpToElement,
  onValidate,
  className
}: SchemaContextMenuProps) {
  const handleCopyName = () => {
    navigator.clipboard.writeText(elementName);
    onCopyName?.(elementName);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className={cn("context-menu-trigger", className)}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
          {elementType === 'table' ? 'Table:' : 'Field:'} {elementName}
        </div>
        
        <ContextMenuSeparator />
        
        {onAddComment && (
          <ContextMenuItem onClick={() => onAddComment(elementType, elementId, elementName)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>Add comment</span>
          </ContextMenuItem>
        )}
        
        {onMarkAsTask && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Mark as task</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onClick={() => onMarkAsTask(elementType, elementId, elementName, 'low')}>
                <div className="h-3 w-3 rounded-full bg-blue-400 mr-2" />
                <span>Low priority</span>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onMarkAsTask(elementType, elementId, elementName, 'medium')}>
                <div className="h-3 w-3 rounded-full bg-yellow-400 mr-2" />
                <span>Medium priority</span>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onMarkAsTask(elementType, elementId, elementName, 'high')}>
                <div className="h-3 w-3 rounded-full bg-red-400 mr-2" />
                <span>High priority</span>
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        
        <ContextMenuSeparator />
        
        {onCopyName && (
          <ContextMenuItem onClick={handleCopyName}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy name</span>
          </ContextMenuItem>
        )}
        
        {onJumpToElement && (
          <ContextMenuItem onClick={() => onJumpToElement(elementType, elementId)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Jump to {elementType}</span>
          </ContextMenuItem>
        )}
        
        {onValidate && (
          <ContextMenuItem onClick={() => onValidate(elementType, elementId)}>
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>Validate {elementType}</span>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
