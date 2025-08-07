import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { UnifiedCommentsPanel } from './UnifiedCommentsPanel';

// Legacy types for backward compatibility
export interface SchemaComment {
  id: string;
  elementType: 'table' | 'field';
  elementId: string;
  elementName: string;
  content: string;
  author?: string;
  createdAt: Date | string;
  read?: boolean;
  mentions?: string[];
  hashtags?: string[];
  parentId?: string;
  isReply?: boolean;
  convertedToTaskId?: string;
  context?: {
    parentTable?: string;
    schema?: string;
    database?: string;
  };
}

export interface SchemaTask {
  id: string;
  elementType: 'table' | 'field';
  elementId: string;
  elementName: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  author?: string;
  createdAt: Date;
  completed?: boolean;
  completedAt?: Date;
  context?: {
    parentTable?: string;
    schema?: string;
    database?: string;
    commentId?: string;
  };
}

interface CommentTaskDrawerProps {
  projectId: string;
  comments?: SchemaComment[]; // Legacy support
  tasks?: SchemaTask[]; // Legacy support
  onMarkCommentRead?: (id: string) => void;
  onMarkTaskComplete?: (id: string) => void;
  onNavigateToElement?: (elementType: string, elementId: string) => void;
  onConvertCommentToTask?: (commentId: string) => void;
  onReplyToComment?: (parentId: string) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onEditTask?: (taskId: string, newDescription: string, newPriority: 'low' | 'medium' | 'high') => void;
  onDeleteTask?: (taskId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}



export function CommentTaskDrawer({
  projectId,
  comments = [],
  tasks = [],
  onMarkCommentRead,
  onMarkTaskComplete,
  onNavigateToElement,
  onConvertCommentToTask,
  onReplyToComment,
  onEditComment,
  onDeleteComment,
  onEditTask,
  onDeleteTask,
  open,
  onOpenChange
}: CommentTaskDrawerProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  const [commentCount, setCommentCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleNavigateToObject = (objectType: string, objectId: string, parentObjectId?: string) => {
    onNavigateToElement?.(objectType, objectId);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="relative"
          aria-label="Open comments and tasks"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Comments & Tasks
          {(commentCount + taskCount) > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {(commentCount + taskCount) > 99 ? '99+' : (commentCount + taskCount)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[450px] sm:max-w-lg p-0 flex flex-col h-full">
        <SheetHeader className="p-4 pb-0 border-b">
          <SheetTitle>Comments & Tasks</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <UnifiedCommentsPanel
            projectId={projectId}
            onNavigateToObject={handleNavigateToObject}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
