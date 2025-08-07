import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X, Smile, Hash, MessageSquare, CheckSquare } from 'lucide-react';
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
    full_name?: string;
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
            className="text-xs mx-1 cursor-pointer hover:bg-primary/20 transition-colors"
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

  return (
    <div className="flex space-x-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <Avatar className="h-8 w-8">
        <AvatarImage src={author?.avatar_url} />
        <AvatarFallback className="text-xs">
          {getInitials(author?.full_name, author?.email)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {author?.full_name || author?.email || 'Unknown User'}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
          </span>
          {updated_at !== created_at && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
          {is_task && (
            <div className="flex items-center space-x-1">
              <CheckSquare className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-blue-600">Task</span>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none"
                placeholder="Write your comment..."
              />
              
              {/* Emoji and Tag Picker */}
              <div className="flex items-center space-x-2 mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Smile className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="grid grid-cols-6 gap-1">
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
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Hash className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <div className="space-y-1">
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
        ) : (
          <div className="space-y-2">
            {is_task && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={handleToggleTask}
                  className="rounded border-gray-300"
                />
                <span className={cn(
                  "text-sm",
                  completed ? "line-through text-gray-500" : "text-gray-900"
                )}>
                  Task
                </span>
              </div>
            )}
            
            <div
              className={cn(
                "text-sm text-gray-900 cursor-pointer hover:bg-gray-100 rounded p-1 -m-1 transition-colors",
                isOwnComment && "hover:bg-blue-50"
              )}
              onClick={handleStartEdit}
              title={isOwnComment ? "Click to edit" : ""}
            >
              {renderContent(content)}
            </div>
            
            <div className="flex items-center justify-between">
              {isOwnComment && (
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={handleStartEdit}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              )}
              
              {!is_task && onConvertToTask && (
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
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
  );
}
