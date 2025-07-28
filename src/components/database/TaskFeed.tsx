import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Comment } from './TaskCommentSystem';

interface TaskFeedProps {
  comments: Comment[];
  onNavigateToTarget?: (targetType: string, targetId: string) => void;
  onUpdateComment?: (commentId: string, updates: Partial<Comment>) => void;
}

export function TaskFeed({ comments, onNavigateToTarget, onUpdateComment }: TaskFeedProps) {
  const tasks = comments.filter(c => c.type === 'task');
  const recentComments = comments.filter(c => c.type === 'comment').slice(0, 5);
  
  const openTasks = tasks.filter(t => t.status === 'open');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'done');

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-3 w-3 text-blue-500" />;
      case 'in-progress': return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'done': return <CheckCircle className="h-3 w-3 text-green-500" />;
      default: return <MessageSquare className="h-3 w-3 text-purple-500" />;
    }
  };

  const handleNavigate = (comment: Comment) => {
    if (onNavigateToTarget) {
      onNavigateToTarget(comment.targetType, comment.targetId);
    }
  };

  const TaskItem = ({ comment }: { comment: Comment }) => (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
      {getStatusIcon(comment.status)}
      <div className="flex-1 space-y-1">
        <p className="text-sm">{comment.text}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {comment.targetType}: {comment.targetName}
          </Badge>
          <span>{comment.author}</span>
          <span>•</span>
          <span>{comment.timestamp.toLocaleDateString()}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => handleNavigate(comment)}
      >
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Task Center
        </CardTitle>
        
        <div className="flex gap-2 text-sm">
          <Badge variant="outline" className="text-blue-500 border-blue-500/30">
            {openTasks.length} Open
          </Badge>
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
            {inProgressTasks.length} In Progress
          </Badge>
          <Badge variant="outline" className="text-green-500 border-green-500/30">
            {completedTasks.length} Complete
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {/* Open Tasks */}
        {openTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-500">Open Tasks</h4>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {openTasks.map(task => (
                  <TaskItem key={task.id} comment={task} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* In Progress Tasks */}
        {inProgressTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-yellow-500">In Progress</h4>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {inProgressTasks.map(task => (
                  <TaskItem key={task.id} comment={task} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Recent Comments */}
        {recentComments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-500">Recent Comments</h4>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {recentComments.map(comment => (
                  <TaskItem key={comment.id} comment={comment} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks or comments yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}