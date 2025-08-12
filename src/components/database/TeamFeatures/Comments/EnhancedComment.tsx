import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X, Smile, Hash, MessageSquare, CheckSquare, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EnhancedCommentProps {
  id: string;
  content: string;
  author: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
  is_task: boolean;
  completed: boolean;
  currentUserId: string;
  onUpdate: (id: string, content: string) => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onNavigateToElement?: (objectType: string, objectId: string, parentObjectId?: string) => void;
  onConvertToTask?: (commentId: string) => Promise<void>;
}

// Common emojis for quick selection
const QUICK_EMOJIS = ['👍', '👎', '❤️', '😊', '😢', '😮', '😡', '🎉', '🚀', '💡', '⚠️', '✅'];

// Common tags for categorization
const QUICK_TAGS = ['#bug', '#feature', '#question', '#urgent', '#review', '#todo', '#done', '#blocked'];

export function EnhancedComment({
  id,
  content,
  author,
  created_at,
  updated_at,
  is_task,
  completed,
  currentUserId,
  onUpdate,
  onToggleTask,
  onDelete,
  onNavigateToElement,
  onConvertToTask
}: EnhancedCommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isUpdating, setIsUpdating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isOwnComment = author?.id === currentUserId;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing, editContent.length]);

  const handleStartEdit = () => {
    if (isOwnComment) {
      setIsEditing(true);
      setEditContent(content);
    }
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() === content.trim()) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
  };

  const handleToggleTask = async () => {
    try {
      await onToggleTask(id, !completed);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = editContent.slice(0, start) + emoji + editContent.slice(end);
      setEditContent(newContent);

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
      const newContent = editContent.slice(0, start) + tag + ' ' + editContent.slice(end);
      setEditContent(newContent);

      // Set cursor position after the tag
      setTimeout(() => {
        textarea.setSelectionRange(start + tag.length + 1, start + tag.length + 1);
        textarea.focus();
      }, 0);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const handleTagClick = (tag: string) => {
    if (!onNavigateToElement) return;

    // Remove the # prefix
    const tagContent = tag.substring(1);

    // Check if it's a field tag (contains a dot)
    if (tagContent.includes('.')) {
      const [tableName, fieldName] = tagContent.split('.');
      onNavigateToElement('field', fieldName, tableName);
    } else {
      // It's a table tag
      onNavigateToElement('table', tagContent);
    }
  };

  const renderContent = (text: string) => {
    // Parse emojis, tags, and mentions for display
    return text.split(/(\s+)/).map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <Badge
            key={index}
            variant="secondary"
            className="text-xs mx-1 cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/90 transition-colors"
            onClick={() => handleTagClick(part)}
          >
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

  // Function to handle reply button click - opens comment field with author and entities tagged
  const handleReply = () => {
    console.log('Reply button clicked!');
    
    // Create a proper mention tag for the author
    const authorName = author?.display_name || author?.email?.split('@')[0] || 'user';
    const mention = `@${authorName} `;

    // Find all tagged entities in the comment (tables, fields, mockups)
    // This regex matches hashtags in the formats: #tableName or #tableName.fieldName
    const entityMatches = content.match(/#([\w-]+)(?:\.([\w-]+))?/g) || [];
    const uniqueEntities = [...new Set(entityMatches)];
    const relatedEntities = uniqueEntities.join(' ');

    // Set the reply content with the mention and any related entities
    const replyContent = `${mention}${relatedEntities ? ' ' + relatedEntities + ' ' : ''}`;
    console.log('Reply content prepared:', replyContent);

    // Try multiple possible textarea selectors
    const possiblePlaceholders = [
      'Write a comment...',
      'Share your thoughts or create a task...',
      'Add a comment...',
      'Reply...',
      ''
    ];

    // Find all textareas on the page
    let commentInput: HTMLTextAreaElement | null = null;
    
    // First try with placeholder selectors
    for (const placeholder of possiblePlaceholders) {
      const selector = placeholder ? `textarea[placeholder="${placeholder}"]` : 'textarea';
      console.log('Trying selector:', selector);
      
      const inputs = document.querySelectorAll(selector);
      console.log(`Found ${inputs.length} inputs with selector ${selector}`);
      
      const visibleInputs = Array.from(inputs).filter(input => {
        const rect = (input as HTMLElement).getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      
      if (visibleInputs.length > 0) {
        commentInput = visibleInputs[0] as HTMLTextAreaElement;
        console.log('Found visible input with placeholder:', placeholder);
        break;
      }
    }
    
    // If still not found, look for the comment composer by its common class names
    if (!commentInput) {
      console.log('Looking for comment composer by class...');
      const composerWrapper = document.querySelector('.comments-panel textarea, .comment-composer textarea');
      if (composerWrapper) {
        commentInput = composerWrapper as HTMLTextAreaElement;
        console.log('Found textarea by class selector');
      }
    }
    
    // Last resort - get the last textbox in the comments panel
    if (!commentInput) {
      console.log('Looking for any visible textarea in comments panel...');
      const allTextareas = document.querySelectorAll('textarea');
      const visibleTextareas = Array.from(allTextareas).filter(input => {
        const rect = (input as HTMLElement).getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      
      if (visibleTextareas.length > 0) {
        commentInput = visibleTextareas[visibleTextareas.length - 1] as HTMLTextAreaElement;
        console.log('Found visible textarea as last resort');
      }
    }
    
    // Attempt to locate the textarea by finding the parent comment panel
    if (!commentInput) {
      const commentPanel = document.querySelector('[aria-label="Comments & Tasks"]');
      if (commentPanel) {
        console.log('Found comments panel, searching for textarea within it');
        const textarea = commentPanel.querySelector('textarea');
        if (textarea) {
          commentInput = textarea as HTMLTextAreaElement;
          console.log('Found textarea within comments panel');
        }
      }
    }
    
    // If we found an input, set its value and focus it
    if (commentInput) {
      console.log('Setting value and focusing comment input');
      
      // Focus the textarea
      commentInput.focus();
      
      // Set the content using direct value assignment
      commentInput.value = replyContent;
      
      // Try multiple event types to ensure the React state updates
      try {
        const events = ['input', 'change', 'keydown', 'keyup'];
        events.forEach(eventType => {
          console.log(`Dispatching ${eventType} event`);
          const event = new Event(eventType, { bubbles: true });
          commentInput?.dispatchEvent(event);
        });
        
        // Position cursor at the end of the text
        setTimeout(() => {
          if (commentInput) {
            commentInput.selectionStart = commentInput.selectionEnd = replyContent.length;
          }
        }, 0);
      } catch (error) {
        console.error('Error dispatching events:', error);
      }
      
      console.log('Reply functionality complete');
    } else {
      console.error('No suitable textarea found for comment reply');
      alert('Could not find comment input field. Please click on the comment box and try manually typing your reply.');
    }
  };

  return (
    <div className="group flex-col space-y-3 p-3 border-b border-border hover:border-primary transition-colors">
      {/* Task indicator badge if this comment is a task */}
      {is_task && (
        <div className="flex items-center space-x-1">
          <CheckSquare className="h-3 w-3 text-primary" />
          <span className="text-xs text-foreground">
            Task
          </span>
        </div>
      )}

      <div className="flex flex-row space-x-3">
        {/* User avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={author?.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(author?.display_name, author?.email)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Comment content area */}
        <div className="flex-1 min-w-0">
          {/* Author and timestamp header */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium">
              {author?.display_name || author?.email || 'Unknown User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
            {updated_at !== created_at && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {/* COMMENT EDITING MODE */}
          {isEditing ? (
            <div className="space-y-2">
              {/* Textarea for editing */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] resize-none bg-background text-foreground dark:bg-gray-800 dark:text-white"
                  placeholder="Write your comment..."
                />

                {/* Emoji and Tag Picker */}
                <div className="flex items-center space-x-2 mt-2">
                  {/* Emoji picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Smile className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2">
                      <div className="grid grid-cols-6 gap-1 bg-background dark:text-white text-black">
                        {QUICK_EMOJIS.map((emoji) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => insertEmoji(emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Tag picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Hash className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2">
                      <div className="space-y-1 bg-background dark:text-white text-black">
                        {QUICK_TAGS.map((tag) => (
                          <Button
                            key={tag}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-6 text-xs"
                            onClick={() => insertTag(tag)}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Edit action buttons */}
              <div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isUpdating || !editContent.trim()}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // COMMENT VIEWING MODE
            <div className="space-y-2">
              {/* Task checkbox (if comment is a task) */}
              {is_task && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={handleToggleTask}
                    className="rounded border-primary"
                  />
                  <span className={cn(
                    "text-sm",
                    completed ? "line-through text-primary/60" : "text-primary"
                  )}>
                    Task
                  </span>
                </div>
              )}

              {/* Comment content area */}
              <div className="flex flex-col">
                <div
                  className={cn(
                    "text-sm text-gray-900 dark:text-white rounded p-1 -m-1 transition-colors",
                    isOwnComment && "cursor-pointer hover:bg-blue-50/30 dark:hover:bg-gray-800"
                  )}
                  onClick={isOwnComment ? handleStartEdit : undefined}
                  title={isOwnComment ? "Click to edit" : ""}
                >
                  {renderContent(content)}
                </div>
              </div>

              {/* Action buttons container */}
              <div className="flex flex-wrap gap-2 mt-1">
                {/* Edit/Delete buttons (only for own comments) */}
                {isOwnComment && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-secondary hover:text-primary/60 dark:text-white"
                      onClick={handleStartEdit}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
                
                {/* Reply button */}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleReply}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Reply
                  </button>
                </div>

                {/* Convert to Task button (if not already a task) */}
                {!is_task && onConvertToTask && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      onClick={() => onConvertToTask(id)}
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Convert to Task
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
