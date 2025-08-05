import { Loader2, Save, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'saving' | 'saved' | 'unsaved' | 'error';

export interface SaveStatusProps {
  status: StatusType;
  message?: string;
  className?: string;
}

export function SaveStatus({
  status,
  message = '',
  className,
}: SaveStatusProps) {
  // Render the appropriate icon based on status
  const renderIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unsaved':
        return <Save className="h-4 w-4" />;
      case 'error':
        return <span className="h-4 w-4 rounded-full bg-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-2 text-sm',
      status === 'error' ? 'text-red-500' : 'text-muted-foreground',
      className
    )}>
      {renderIcon()}
      {message && <span>{message}</span>}
    </div>
  );
}

export default SaveStatus;
