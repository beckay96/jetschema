import { Button } from '@/components/ui/button';
import { 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Sparkles,
  Brain,
  Zap
} from 'lucide-react';
import { TaskCommentSystem, Comment } from './TaskCommentSystem';

interface MicrointeractionIconsProps {
  targetType: 'table' | 'field';
  targetId: string;
  targetName: string;
  hasWarning?: boolean;
  isValidated?: boolean;
  onSettings?: () => void;
  onMarkReviewed?: () => void;
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  onUpdateComment: (commentId: string, updates: Partial<Comment>) => void;
}

export function MicrointeractionIcons({
  targetType,
  targetId,
  targetName,
  hasWarning,
  isValidated,
  onSettings,
  onMarkReviewed,
  comments,
  onAddComment,
  onUpdateComment
}: MicrointeractionIconsProps) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
      {/* Settings Icon */}
      {onSettings && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 hover-icon"
          onClick={(e) => {
            e.stopPropagation();
            onSettings();
          }}
        >
          <Settings className="h-3 w-3" />
        </Button>
      )}
      
      {/* Warning Icon */}
      {hasWarning && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 text-yellow-500 animate-pulse-subtle"
        >
          <AlertTriangle className="h-3 w-3" />
        </Button>
      )}
      
      {/* Validated Icon */}
      {isValidated && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 text-green-500"
          onClick={(e) => {
            e.stopPropagation();
            onMarkReviewed?.();
          }}
        >
          <CheckCircle className="h-3 w-3" />
        </Button>
      )}
      
      {/* Comment System */}
      <TaskCommentSystem
        targetType={targetType}
        targetId={targetId}
        targetName={targetName}
        comments={comments}
        onAddComment={onAddComment}
        onUpdateComment={onUpdateComment}
      />
      
      {/* AI Tip Placeholder */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 w-6 p-0 hover-icon text-blue-500"
        onClick={(e) => {
          e.stopPropagation();
          // TODO: Implement AI suggestions
        }}
        title="AI tip coming soon – suggest best practices here"
      >
        <Brain className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface ProjectTitleIconsProps {
  onOpenSettings: () => void;
}

export function ProjectTitleIcons({ onOpenSettings }: ProjectTitleIconsProps) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-5 w-5 p-0 ml-2 opacity-60 hover:opacity-100 transition-opacity"
      onClick={onOpenSettings}
      title="Project Settings"
    >
      <Sparkles className="h-3 w-3" />
    </Button>
  );
}