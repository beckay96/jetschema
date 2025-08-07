import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedCommentPopover } from '../../TeamFeatures/Comments/EnhancedCommentPopover';
import { useAuth } from '@/hooks/useAuth';

interface FieldComment {
  id: string;
  comment_text: string;
  author_id: string;
  created_at: string;
  author_display_name?: string;
}

interface FieldCommentButtonProps {
  fieldId: string;
  fieldName: string;
  tableName?: string;
  comments?: FieldComment[];
  onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string, commentText: string, isTask: boolean) => void;
  onViewComments?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
  compact?: boolean;
  projectId?: string;
}

export function FieldCommentButton({ 
  fieldId, 
  fieldName, 
  tableName, 
  comments = [], 
  onAddComment, 
  onViewComments, 
  compact = false,
  projectId 
}: FieldCommentButtonProps) {
  // Get project ID from URL or context if not provided
  const currentProjectId = projectId || window.location.pathname.split('/').pop() || '';

  return (
    <EnhancedCommentPopover
      fieldId={fieldId}
      fieldName={fieldName}
      tableName={tableName}
      projectId={currentProjectId}
      comments={comments}
      compact={compact}
      onAddComment={onAddComment}
      onViewComments={onViewComments}
    />
  );
}