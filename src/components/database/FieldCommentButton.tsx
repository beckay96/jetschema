import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { MessageCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
  onViewComments?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
  compact?: boolean;
}

export function FieldCommentButton({ 
  fieldId,
  fieldName, 
  tableName,
  comments = [], 
  onAddComment,
  onViewComments,
  compact = false 
}: FieldCommentButtonProps) {
  const [showComments, setShowComments] = useState(false);
  const hasComments = comments.length > 0;

  const handleAddComment = () => {
    onAddComment?.('field', fieldId, fieldName);
  };

  const handleViewComments = () => {
    onViewComments?.('field', fieldId, fieldName);
    setShowComments(true);
  };

  if (hasComments) {
    return (
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "relative text-blue-600 hover:text-blue-700 hover:bg-blue-50",
              compact ? "h-5 w-5 p-0" : "h-6 w-6 p-0"
            )}
            onClick={handleViewComments}
          >
            <MessageCircle className={compact ? "h-3 w-3" : "h-4 w-4"} />
            {comments.length > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-blue-500 text-white rounded-full flex items-center justify-center"
              >
                {comments.length > 9 ? '9+' : comments.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments for {tableName ? `${tableName}.${fieldName}` : fieldName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{comment.comment_text}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{comment.author_display_name || 'Unknown User'}</span>
                  <span>•</span>
                  <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-3 border-t">
            <Button onClick={handleAddComment} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity",
            compact ? "h-5 w-5 p-0" : "h-6 w-6 p-0"
          )}
        >
          <MessageCircle className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="right">
        <div className="space-y-2">
          <p className="text-sm font-medium">Add Comment</p>
          <p className="text-xs text-muted-foreground">
            Click to add a comment and tag this field in chat
          </p>
          <Button 
            onClick={handleAddComment} 
            size="sm" 
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-2" />
            Add Comment
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}