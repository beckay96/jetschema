import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageCircle, Send, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  fieldName: string;
  onSubmit: (comment: string, tagInChat: boolean) => void;
}

export function CommentModal({ 
  open, 
  onOpenChange, 
  tableName, 
  fieldName, 
  onSubmit 
}: CommentModalProps) {
  const [comment, setComment] = useState('');
  const [tagInChat, setTagInChat] = useState(true);

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment.trim(), tagInChat);
      setComment('');
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Add Comment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Hash className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">{tableName}</span>
            <span className="text-gray-400">.</span>
            <span className="text-sm font-medium text-blue-600">{fieldName}</span>
            <Badge variant="outline" className="ml-auto text-xs">
              Field
            </Badge>
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comment
            </label>
            <Textarea
              id="comment"
              placeholder="Add your comment about this field..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] resize-none"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Tip: Use Ctrl+Enter to submit quickly
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="tagInChat"
              checked={tagInChat}
              onChange={(e) => setTagInChat(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="tagInChat" className="text-sm text-blue-700 flex-1">
              <span className="font-medium">Tag this field in team chat</span>
              <div className="text-xs text-blue-600 mt-1">
                This will create a chat message with this field tagged so your team can discuss it
              </div>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!comment.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}