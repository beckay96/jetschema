import React from 'react';
import { AlertCircle, AlertTriangle, Info, Check } from 'lucide-react';
import { 
  ValidationMessage, 
  ValidationSeverity,
  suggestFix
} from '@/utils/databaseValidation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ValidationFeedbackProps {
  messages: ValidationMessage[];
  showCount?: boolean;
  showDetails?: boolean;
  className?: string;
}

/**
 * Component to display database validation feedback messages
 * Can be used inline or as a detailed list
 */
export function ValidationFeedback({ 
  messages, 
  showCount = true, 
  showDetails = false,
  className 
}: ValidationFeedbackProps) {
  if (messages.length === 0) {
    return showCount ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 gap-1">
        <Check className="h-3 w-3" />
        Valid
      </Badge>
    ) : null;
  }

  const errorCount = messages.filter(m => m.severity === ValidationSeverity.ERROR).length;
  const warningCount = messages.filter(m => m.severity === ValidationSeverity.WARNING).length;
  const infoCount = messages.filter(m => m.severity === ValidationSeverity.INFO).length;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {showCount && (
        <div className="flex gap-2">
          {errorCount > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 gap-1">
              <AlertCircle className="h-3 w-3" />
              {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
            </Badge>
          )}
          {infoCount > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 gap-1">
              <Info className="h-3 w-3" />
              {infoCount} {infoCount === 1 ? 'Suggestion' : 'Suggestions'}
            </Badge>
          )}
        </div>
      )}

      {showDetails && messages.length > 0 && (
        <div className="space-y-2 text-sm">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={cn(
                "p-2 rounded-md flex items-start gap-2",
                message.severity === ValidationSeverity.ERROR && "bg-red-50 dark:bg-red-900/20",
                message.severity === ValidationSeverity.WARNING && "bg-amber-50 dark:bg-amber-900/20",
                message.severity === ValidationSeverity.INFO && "bg-blue-50 dark:bg-blue-900/20"
              )}
            >
              {message.severity === ValidationSeverity.ERROR && (
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              )}
              {message.severity === ValidationSeverity.WARNING && (
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              )}
              {message.severity === ValidationSeverity.INFO && (
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={cn(
                  message.severity === ValidationSeverity.ERROR && "text-red-700 dark:text-red-400",
                  message.severity === ValidationSeverity.WARNING && "text-amber-700 dark:text-amber-400",
                  message.severity === ValidationSeverity.INFO && "text-blue-700 dark:text-blue-400"
                )}>
                  {message.message}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {suggestFix(message)}
                </p>
                {message.field && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Field: <code className="bg-muted px-1 py-0.5 rounded">{message.field}</code>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!showDetails && messages.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help flex">
                {errorCount > 0 && (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                {errorCount === 0 && warningCount > 0 && (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                )}
                {errorCount === 0 && warningCount === 0 && (
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <div className="space-y-2 p-1">
                {messages.slice(0, 5).map((message, index) => (
                  <p 
                    key={index} 
                    className={cn(
                      "text-xs",
                      message.severity === ValidationSeverity.ERROR && "text-red-600 dark:text-red-400",
                      message.severity === ValidationSeverity.WARNING && "text-amber-600 dark:text-amber-400",
                      message.severity === ValidationSeverity.INFO && "text-blue-600 dark:text-blue-400"
                    )}
                  >
                    {message.message}
                  </p>
                ))}
                {messages.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    And {messages.length - 5} more issues...
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Inline validation indicator component
 * Shows a small icon with tooltip for validation issues
 */
export function InlineValidationIndicator({ messages }: { messages: ValidationMessage[] }) {
  if (messages.length === 0) return null;

  const errorCount = messages.filter(m => m.severity === ValidationSeverity.ERROR).length;
  const warningCount = messages.filter(m => m.severity === ValidationSeverity.WARNING).length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            {errorCount > 0 && (
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            {errorCount === 0 && warningCount > 0 && (
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
            {errorCount === 0 && warningCount === 0 && (
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 p-1">
            {messages.slice(0, 3).map((message, index) => (
              <p 
                key={index} 
                className={cn(
                  "text-xs",
                  message.severity === ValidationSeverity.ERROR && "text-red-600 dark:text-red-400",
                  message.severity === ValidationSeverity.WARNING && "text-amber-600 dark:text-amber-400",
                  message.severity === ValidationSeverity.INFO && "text-blue-600 dark:text-blue-400"
                )}
              >
                {message.message}
              </p>
            ))}
            {messages.length > 3 && (
              <p className="text-xs text-muted-foreground">
                And {messages.length - 3} more issues...
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
