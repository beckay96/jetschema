import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Smile, Hash, Send, MessageSquare, CheckSquare, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface CommentComposerProps {
  onSubmit: (content: string, isTask: boolean) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

// Common emojis for quick selection
const QUICK_EMOJIS = [
  '👍', '👎', '❤️', '😊', '😢', '😮', '😡', '🎉', '🚀', '💡', 
  '⚠️', '✅', '❌', '🔥', '💯', '🤔', '😍', '🙌', '👏', '🎯'
];

// Common tags for categorization
const QUICK_TAGS = [
  '#bug', '#feature', '#question', '#urgent', '#review', '#todo', 
  '#done', '#blocked', '#enhancement', '#documentation', '#testing', '#design'
];

export function CommentComposer({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = false,
  className
}: CommentComposerProps) {
  const [content, setContent] = useState('');
  const [isTask, setIsTask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), isTask);
      setContent('');
      setIsTask(false);
      
      // Show success toast
      toast({
        title: 'Success',
        description: isTask ? 'Task created successfully!' : 'Comment posted successfully!',
        variant: 'default',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to submit comment:', error);
      
      // Show error toast
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post comment. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setIsTask(false);
    onCancel?.();
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      
      // Set cursor position after the emoji
      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        textarea.focus();
      }, 0);
    }
  };

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + tag + ' ' + content.slice(end);
      setContent(newContent);
      
      // Set cursor position after the tag
      setTimeout(() => {
        textarea.setSelectionRange(start + tag.length + 1, start + tag.length + 1);
        textarea.focus();
      }, 0);
    }
  };

  const renderPreview = (text: string) => {
    if (!text.trim()) return null;
    
    return text.split(/(\s+)/).map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <Badge key={index} variant="secondary" className="text-xs mx-1">
            {part}
          </Badge>
        );
      }
      if (part.startsWith('@')) {
        return (
          <Badge key={index} variant="outline" className="text-xs mx-1">
            {part}
          </Badge>
        );
      }
      return part;
    });
  };

  const hasContent = content.trim().length > 0;

  return (
    <div className={cn("border rounded-lg p-3 bg-background text-foreground", className)}>
      <div className="space-y-3">
        {/* Comment Type Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={!isTask ? "default" : "outline"}
            size="sm"
            onClick={() => setIsTask(false)}
            className="h-7"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Comment
          </Button>
          <Button
            variant={isTask ? "default" : "outline"}
            size="sm"
            onClick={() => setIsTask(true)}
            className="h-7"
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            Task
          </Button>
        </div>

        {/* Text Area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[80px] resize-none bg-background text-foreground border-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus={autoFocus}
          />
          
          {/* Emoji and Tag Buttons */}
          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Insert emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-2 bg-popover text-popover-foreground" align="end">
                <div className="grid grid-cols-8 gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-2xl p-1 hover:bg-accent rounded-md transition-colors"
                      onClick={() => insertEmoji(emoji)}
                      type="button"
                      aria-label={`Insert ${emoji} emoji`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Insert tag"
                >
                  <Hash className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2 bg-popover text-popover-foreground" align="end">
                <div className="grid grid-cols-2 gap-1">
                  {QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      className="text-xs p-1 hover:bg-accent rounded-md transition-colors text-left"
                      onClick={() => insertTag(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Preview */}
        {hasContent && (
          <div className="p-2 bg-muted/50 rounded border text-sm">
            <div className="text-xs text-muted-foreground mb-1">Preview:</div>
            <div className="flex flex-wrap items-center gap-2">
              {isTask && (
                <div className="flex items-center space-x-1">
                  <CheckSquare className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary">Task</span>
                </div>
              )}
              {renderPreview(content)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!hasContent || isSubmitting}
            className="h-8"
          >
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
