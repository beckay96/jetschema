import { Check, Circle, Loader2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

/**
 * Status types for the StatusPill component
 */
export type StatusType = 
  | 'idle'        // Default state, no action needed
  | 'success'     // Operation completed successfully
  | 'error'       // Operation failed
  | 'warning'     // Warning condition
  | 'info'        // Informational message
  | 'loading'     // Operation in progress
  | 'unsaved';    // Unsaved changes

type StatusPillProps = {
  status?: StatusType;
  message?: string;
  className?: string;
  autoResetDelay?: number; // Time in ms to auto-reset to idle
  // Legacy props for backward compatibility
  isSaving?: boolean;
  isSaved?: boolean;
};

/**
 * StatusPill component that displays the current status in a pill format
 * This is the central notification mechanism for the application
 */
export function SaveStatus({ 
  status, 
  message, 
  className, 
  autoResetDelay = 3000,
  isSaving, 
  isSaved 
}: StatusPillProps) {
  // For backward compatibility
  const [currentStatus, setCurrentStatus] = useState<StatusType>('idle');
  const [currentMessage, setCurrentMessage] = useState<string>('');
  
  // Handle auto-reset for success/error/info/warning states
  useEffect(() => {
    // Don't auto-reset for idle, loading, or unsaved states
    if (
      status && 
      ['success', 'error', 'info', 'warning'].includes(status) && 
      autoResetDelay > 0
    ) {
      const timer = setTimeout(() => {
        setCurrentStatus('idle');
      }, autoResetDelay);
      
      return () => clearTimeout(timer);
    }
  }, [status, autoResetDelay]);
  
  // Handle legacy props for backward compatibility
  useEffect(() => {
    if (isSaving !== undefined || isSaved !== undefined) {
      if (isSaving) {
        setCurrentStatus('loading');
        setCurrentMessage('Saving...');
      } else if (isSaved === false) {
        setCurrentStatus('unsaved');
        setCurrentMessage('Unsaved changes');
      } else if (isSaved === true) {
        setCurrentStatus('success');
        setCurrentMessage('Saved');
      }
    } else if (status) {
      setCurrentStatus(status);
      if (message) setCurrentMessage(message);
      else {
        // Default messages for each status
        switch (status) {
          case 'success': setCurrentMessage('Success'); break;
          case 'error': setCurrentMessage('Error'); break;
          case 'warning': setCurrentMessage('Warning'); break;
          case 'info': setCurrentMessage('Info'); break;
          case 'loading': setCurrentMessage('Loading...'); break;
          case 'unsaved': setCurrentMessage('Unsaved changes'); break;
          default: setCurrentMessage('');
        }
      }
    }
  }, [status, message, isSaving, isSaved]);
  
  // Get the appropriate icon and styles based on status
  const getStatusStyles = () => {
    switch (currentStatus) {
      case 'success':
        return {
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          textColor: 'text-emerald-800 dark:text-emerald-200',
          icon: <Check className="h-3 w-3" />
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/30',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          icon: <AlertCircle className="h-3 w-3" />
        };
      case 'warning':
        return {
          bgColor: 'bg-amber-50 dark:bg-amber-900/30',
          borderColor: 'border-amber-200 dark:border-amber-800',
          textColor: 'text-amber-800 dark:text-amber-200',
          icon: <AlertCircle className="h-3 w-3" />
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
          icon: <Info className="h-3 w-3" />
        };
      case 'loading':
        return {
          bgColor: 'bg-amber-50 dark:bg-amber-900/30',
          borderColor: 'border-amber-200 dark:border-amber-800',
          textColor: 'text-amber-800 dark:text-amber-200',
          icon: <Loader2 className="h-3 w-3 animate-spin" />
        };
      case 'unsaved':
        return {
          bgColor: 'bg-orange-50 dark:bg-orange-900/30',
          borderColor: 'border-orange-200 dark:border-orange-800',
          textColor: 'text-orange-800 dark:text-orange-200',
          icon: <Circle className="h-2 w-2 fill-current" />
        };
      case 'idle':
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-800/30',
          borderColor: 'border-gray-200 dark:border-gray-700',
          textColor: 'text-gray-600 dark:text-gray-300',
          icon: <Check className="h-3 w-3" />
        };
    }
  };
  
  const { bgColor, borderColor, textColor, icon } = getStatusStyles();
  
  // Don't render in idle state with no message
  if (currentStatus === 'idle' && !currentMessage) {
    return null;
  }
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 text-xs rounded-full border transition-colors',
        bgColor,
        borderColor,
        textColor,
        className
      )}
    >
      {icon}
      <span>{currentMessage}</span>
    </div>
  );
}
