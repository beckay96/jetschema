import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bug, MessageCircle, Lightbulb } from 'lucide-react';
import { StreamlinedBugReportModal } from './StreamlinedBugReportModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FloatingFeedbackButtonProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function FloatingFeedbackButton({ 
  className,
  position = 'bottom-right' 
}: FloatingFeedbackButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const handleQuickReport = (type: 'bug' | 'feature' | 'question') => {
    setIsModalOpen(true);
    setIsExpanded(false);
  };

  return (
    <>
      <div className={cn(
        "fixed z-50 flex flex-col items-end space-y-2",
        positionClasses[position],
        className
      )}>
        {/* Expanded Options */}
        {isExpanded && (
          <div className="flex flex-col space-y-2 animate-in slide-in-from-bottom-2 duration-200">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQuickReport('bug')}
                    className="shadow-lg hover:shadow-xl transition-shadow bg-red-50 hover:bg-red-100 border-red-200"
                  >
                    <Bug className="h-4 w-4 text-red-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Report a Bug</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQuickReport('feature')}
                    className="shadow-lg hover:shadow-xl transition-shadow bg-blue-50 hover:bg-blue-100 border-blue-200"
                  >
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Request a Feature</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQuickReport('question')}
                    className="shadow-lg hover:shadow-xl transition-shadow bg-green-50 hover:bg-green-100 border-green-200"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Ask a Question</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Main Feedback Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  "shadow-lg hover:shadow-xl transition-all duration-200 rounded-full h-12 w-12 p-0",
                  isExpanded ? "bg-gray-600 hover:bg-gray-700" : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                <MessageCircle className={cn(
                  "h-5 w-5 text-white transition-transform duration-200",
                  isExpanded && "rotate-45"
                )} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isExpanded ? 'Close' : 'Send Feedback'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <StreamlinedBugReportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
