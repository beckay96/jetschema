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

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), isTask);
      setContent('');
      setIsTask(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
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
    <div className={cn("border rounded-lg p-3 bg-white", className)}>
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
            className="min-h-[80px] resize-none"
            autoFocus={autoFocus}
          />
        </div>

        {/* Preview */}
        {hasContent && (
          <div className="p-2 bg-gray-50 rounded border text-sm">
            <div className="text-xs text-gray-500 mb-1">Preview:</div>
            <div className="flex items-center space-x-2">
              {isTask && (
                <div className="flex items-center space-x-1">
                  <CheckSquare className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-600">Task</span>
                </div>
              )}
              <div>{renderPreview(content)}</div>
            </div>
          </div>
        )}

        {/* Tools and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Emoji Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Smile className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">Quick Emojis</div>
                  <div className="grid grid-cols-10 gap-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Tag Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Hash className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-700 px-2 py-1">Quick Tags</div>
                  {QUICK_TAGS.map((tag) => (
                    <Button
                      key={tag}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-7 text-xs"
                      onClick={() => insertTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="h-7"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!hasContent || isSubmitting}
              className="h-7"
            >
              <Send className="h-3 w-3 mr-1" />
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
