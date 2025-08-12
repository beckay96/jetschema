import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  MoreHorizontal,
  Send
} from 'lucide-react';

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  type: 'comment' | 'task';
  status?: 'open' | 'in-progress' | 'done';
  targetType: 'table' | 'field';
  targetId: string;
  targetName: string;
}

interface TaskCommentSystemProps {
  targetType: 'table' | 'field';
  targetId: string;
  targetName: string;
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  onUpdateComment: (commentId: string, updates: Partial<Comment>) => void;
}

export function TaskCommentSystem({ 
  targetType, 
  targetId, 
  targetName, 
  comments, 
  onAddComment, 
  onUpdateComment 
}: TaskCommentSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'comment' | 'task'>('comment');
  const { user } = useAuth();

  const targetComments = comments.filter(c => c.targetId === targetId);
  const hasComments = targetComments.length > 0;
  const hasOpenTasks = targetComments.some(c => c.type === 'task' && c.status !== 'done');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    
    onAddComment({
      text: newComment,
      author: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User',
      type: commentType,
      status: commentType === 'task' ? 'open' : undefined,
      targetType,
      targetId,
      targetName,
    });
    
    setNewComment('');
    setIsOpen(false);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-3 w-3 text-blue-500" />;
      case 'in-progress': return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'done': return <CheckCircle className="h-3 w-3 text-green-500" />;
      default: return <MessageSquare className="h-3 w-3 text-purple-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'open': return 'task-open';
      case 'in-progress': return 'task-in-progress';
      case 'done': return 'task-complete';
      default: return 'comment-indicator';
    }
  };

  return (
    <>
      {/* Indicator */}
      {hasComments && (
        <div className={`task-indicator ${hasOpenTasks ? 'task-open' : 'task-complete'} animate-bounce-gentle`} />
      )}

      {/* Trigger Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover-icon opacity-60 hover:opacity-100"
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments & Tasks
              <Badge variant="outline" className="text-xs">
                {targetType}: {targetName}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto bg-background dark:text-white text-black">
            {/* Existing Comments/Tasks */}
            {targetComments.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto bg-background dark:text-white text-black">
                {targetComments.map((comment) => (
                  <Card key={comment.id} className="p-3">
                    <div className="flex items-start justify-between bg-background dark:text-white text-black">
                      <div className="flex items-start gap-2 flex-1 bg-background dark:text-white text-black">
                        {getStatusIcon(comment.status)}
                        <div className="flex-1 space-y-1 bg-background dark:text-white text-black">
                          <p className="text-sm">{comment.text}</p>
                          <div className="text-xs text-muted-foreground">
                            {comment.author} • {comment.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      {comment.type === 'task' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onClick={() => onUpdateComment(comment.id, { status: 'open' })}
                            >
                              <AlertCircle className="h-3 w-3 mr-2" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onUpdateComment(comment.id, { status: 'in-progress' })}
                            >
                              <Clock className="h-3 w-3 mr-2" />
                              In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onUpdateComment(comment.id, { status: 'done' })}
                            >
                              <CheckCircle className="h-3 w-3 mr-2" />
                              Done
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Add New Comment/Task */}
            <div className="space-y-3 bg-background dark:text-white text-black">
              <div className="flex gap-2">
                <Button
                  variant={commentType === 'comment' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCommentType('comment')}
                  className="flex-1"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Comment
                </Button>
                <Button
                  variant={commentType === 'task' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCommentType('task')}
                  className="flex-1"
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Task
                </Button>
              </div>
              
              <Textarea
                placeholder={`Add a ${commentType}...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-20"
              />
              
              <Button onClick={handleSubmit} className="w-full" disabled={!newComment.trim()}>
                <Send className="h-3 w-3 mr-2" />
                Add {commentType === 'comment' ? 'Comment' : 'Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
