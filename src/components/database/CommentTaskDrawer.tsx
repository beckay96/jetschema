import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, CheckCircle, Clock, AlertTriangle, AlertCircle, Edit, Trash } from "lucide-react";
import { cn } from '@/lib/utils';

// Import comment parser
import { parseComment, extractMentions, extractHashtags } from '@/lib/commentParser';

// Define types for comments and tasks
export interface SchemaComment {
  id: string;
  elementType: 'table' | 'field';
  elementId: string;
  elementName: string;
  content: string;
  author?: string;
  createdAt: Date | string; // Allow both Date objects and ISO strings
  read?: boolean;
  mentions?: string[]; // Users mentioned in the comment with @
  hashtags?: string[]; // Topics tagged in the comment with #
  parentId?: string; // For threaded comments/replies
  isReply?: boolean;
  convertedToTaskId?: string; // If this comment was converted to a task
  context?: { // Additional context about the element
    parentTable?: string; // If this is a field, store its parent table name
    schema?: string; // The schema this element belongs to
    database?: string; // The database this element belongs to
  };
}

export interface SchemaTask {
  id: string;
  elementType: 'table' | 'field';
  elementId: string;
  elementName: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  author?: string;
  createdAt: Date;
  completed?: boolean;
  completedAt?: Date;
  context?: { // Additional context about the element
    parentTable?: string; // If this is a field, store its parent table name
    schema?: string; // The schema this element belongs to
    database?: string; // The database this element belongs to
    commentId?: string; // Original comment ID if converted from a comment
  };
}

interface CommentTaskDrawerProps {
  comments: SchemaComment[];
  tasks: SchemaTask[];
  onMarkCommentRead: (id: string) => void;
  onMarkTaskComplete: (id: string) => void;
  onNavigateToElement: (elementType: string, elementId: string) => void;
  onConvertCommentToTask?: (commentId: string) => void;
  onReplyToComment?: (parentId: string) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onEditTask?: (taskId: string, newDescription: string, newPriority: 'low' | 'medium' | 'high') => void;
  onDeleteTask?: (taskId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Error Boundary component to catch render errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log error to console
    console.error('CommentTaskDrawer error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return <div className="p-4 text-sm text-red-500">
        Something went wrong loading comments and tasks.
        <button 
          className="block mt-2 px-2 py-1 bg-muted rounded-md hover:bg-muted/80"
          onClick={() => this.setState({ hasError: false })}
        >
          Try again
        </button>
      </div>;
    }

    return this.props.children;
  }
}

export function CommentTaskDrawer({
  comments = [], // Add default empty arrays to prevent null/undefined errors
  tasks = [],
  onMarkCommentRead,
  onMarkTaskComplete,
  onNavigateToElement,
  onConvertCommentToTask,
  onReplyToComment,
  onEditComment,
  onDeleteComment,
  onEditTask,
  onDeleteTask,
  open,
  onOpenChange
}: CommentTaskDrawerProps) {
  // State for editing comments and tasks
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskDescription, setEditingTaskDescription] = useState('');
  const [editingTaskPriority, setEditingTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [activeTab, setActiveTab] = useState('comments');
  const [filteredComments, setFilteredComments] = useState<SchemaComment[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<SchemaTask[]>([]);
  const [commentFilter, setCommentFilter] = useState<'all' | 'unread'>('all');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Safely process comments and tasks with error checking
  useEffect(() => {
    try {
      // Ensure comments is an array before filtering
      const safeComments = Array.isArray(comments) ? comments : [];
      
      // Validate each comment object before filtering
      const validatedComments = safeComments.filter(comment => {
        if (!comment || typeof comment !== 'object') return false;
        if (!comment.id || !comment.elementId || !comment.elementType) return false;
        return true;
      });
      
      // Apply filters to comments
      setFilteredComments(
        commentFilter === 'unread' 
          ? validatedComments.filter(c => !c.read)
          : validatedComments
      );

      // Ensure tasks is an array before filtering
      const safeTasks = Array.isArray(tasks) ? tasks : [];
      
      // Validate each task object before filtering
      const validatedTasks = safeTasks.filter(task => {
        if (!task || typeof task !== 'object') return false;
        if (!task.id || !task.elementId || !task.elementType) return false;
        return true;
      });
      
      // Apply filters to tasks
      setFilteredTasks(
        taskFilter === 'active' 
          ? validatedTasks.filter(t => !t.completed)
          : taskFilter === 'completed'
            ? validatedTasks.filter(t => t.completed)
            : validatedTasks
      );
    } catch (error) {
      console.error('Error filtering comments/tasks:', error);
      // Reset to safe defaults on error
      setFilteredComments([]);
      setFilteredTasks([]);
    }
  }, [comments, tasks, commentFilter, taskFilter]);

  const unreadCommentCount = Array.isArray(comments) ? comments.filter(c => c && !c.read).length : 0;
  const activeTaskCount = Array.isArray(tasks) ? tasks.filter(t => t && !t.completed).length : 0;
  
  function getPriorityColor(priority: 'low' | 'medium' | 'high') {
    switch (priority) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'medium': return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
      case 'low': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    }
  }

  function formatDate(dateInput: Date | string | undefined) {
    if (!dateInput) return 'Unknown date';
    
    try {
      // Convert string to date if needed
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // If today, just show time
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      // If this year, show month and day
      if (date.getFullYear() === today.getFullYear()) {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      // Otherwise show full date
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
          aria-label="Open comments and tasks"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          <span>Comments & Tasks</span>
          {(unreadCommentCount > 0 || activeTaskCount > 0) && (
            <Badge 
              className={cn(
                "absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-semibold",
                "bg-primary text-white border border-background"
              )}
            >
              {unreadCommentCount + activeTaskCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[450px] sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle>Comments & Tasks</SheetTitle>
        </SheetHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="px-4 border-b">
            <TabsList className="grid w-full grid-cols-2 h-14">
              <TabsTrigger value="comments" className="relative">
                Comments
                {unreadCommentCount > 0 && (
                  <Badge 
                    className={cn(
                      "absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold",
                      "bg-primary text-white border border-background"
                    )}
                  >
                    {unreadCommentCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="relative">
                Tasks
                {activeTaskCount > 0 && (
                  <Badge 
                    className={cn(
                      "absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold",
                      "bg-primary text-white border border-background"
                    )}
                  >
                    {activeTaskCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Comments Tab Content */}
          <TabsContent value="comments" className="flex-1 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden mt-0">
            <div className="p-2 border-b flex gap-1 justify-end">
              <Button 
                variant={commentFilter === 'all' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setCommentFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={commentFilter === 'unread' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setCommentFilter('unread')}
              >
                Unread {unreadCommentCount > 0 && `(${unreadCommentCount})`}
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              {filteredComments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No comments found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComments.map(comment => (
                    <div 
                      key={comment.id}
                      className={cn(
                        "p-3 rounded-md border transition-colors",
                        comment.read 
                          ? "bg-muted/30 border-border" 
                          : "bg-primary/5 border-primary/20"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div 
                          className="cursor-pointer text-sm font-medium hover:underline flex items-center"
                          onClick={() => onNavigateToElement(comment.elementType, comment.elementId)}
                        >
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "mr-2 py-0 h-5",
                              comment.elementType === 'table' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                            )}
                          >
                            {comment.elementType === 'table' ? 'Table' : 'Field'}
                          </Badge>
                          {comment.elementName}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(comment.createdAt)}
                        </div>
                      </div>
                      {/* Comment content with parsed @mentions and #hashtags */}
                      {editingCommentId === comment.id ? (
                        <div className="mb-3">
                          <textarea
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            className="w-full p-2 text-sm border rounded"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (onEditComment) {
                                  onEditComment(comment.id, editingCommentContent);
                                }
                                setEditingCommentId(null);
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCommentId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm mb-3">
                          {parseComment(comment.content).map((part, index) => {
                            switch(part.type) {
                              case 'mention':
                                return (
                                  <span key={index} className="text-primary font-medium">@{part.content}</span>
                                );
                              case 'hashtag':
                                return (
                                  <span key={index} className="text-blue-500 font-medium">#{part.content}</span>
                                );
                              default:
                                return <span key={index}>{part.content}</span>;
                            }
                          })}
                        </div>
                      )}
                       
                      {/* Additional context display if available */}
                      {comment.context && (
                        <div className="text-xs text-muted-foreground mb-3">
                          {comment.context.parentTable && (
                            <div className="inline-flex items-center">
                              <span className="mr-1">Parent table:</span>
                              <Badge variant="outline" className="py-0 h-5">
                                {comment.context.parentTable}
                              </Badge>
                            </div>
                          )}
                          {(comment.context.schema || comment.context.database) && (
                            <div className="inline-flex items-center ml-2">
                              <span className="mr-1">In:</span>
                              {comment.context.database && (
                                <span className="mr-1">{comment.context.database}</span>
                              )}
                              {comment.context.schema && (
                                <Badge variant="outline" className="py-0 h-5">
                                  {comment.context.schema}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          {comment.author && (
                            <div className="text-xs text-muted-foreground">
                              by {comment.author}
                            </div>
                          )}
                          
                          {comment.hashtags && comment.hashtags.length > 0 && (
                            <div className="flex gap-1">
                              {comment.hashtags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs py-0 h-5">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          {onReplyToComment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onReplyToComment(comment.id)}
                              className="h-7 text-xs"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          )}
                          
                          {onConvertCommentToTask && !comment.convertedToTaskId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onConvertCommentToTask(comment.id)}
                              className="h-7 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Convert to Task
                            </Button>
                          )}
                          
                          {!comment.read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onMarkCommentRead(comment.id)}
                              className="h-7 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark as Read
                            </Button>
                          )}
                          
                          {onEditComment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentContent(comment.content);
                              }}
                              className="h-7 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                          
                          {onDeleteComment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteComment(comment.id)}
                              className="h-7 text-xs text-red-500 hover:text-red-700"
                            >
                              <Trash className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          )}
                          
                          {comment.convertedToTaskId && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                              Converted to Task
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Show reply indication if this is a reply */}
                      {comment.isReply && comment.parentId && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Reply to another comment
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tasks Tab Content */}
          <TabsContent value="tasks" className="flex-1 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden mt-0">
            <div className="p-2 border-b flex gap-1 justify-end">
              <Button 
                variant={taskFilter === 'all' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setTaskFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={taskFilter === 'active' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setTaskFilter('active')}
              >
                Active {activeTaskCount > 0 && `(${activeTaskCount})`}
              </Button>
              <Button 
                variant={taskFilter === 'completed' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setTaskFilter('completed')}
              >
                Completed
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No tasks found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map(task => (
                    <div 
                      key={task.id}
                      className={cn(
                        "p-3 rounded-md border transition-colors",
                        task.completed 
                          ? "bg-muted/30 border-border" 
                          : "bg-primary/5 border-primary/20"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={cn("text-xs", getPriorityColor(task.priority))}
                          >
                            {task.priority}
                          </Badge>
                          <div 
                            className="cursor-pointer text-sm font-medium hover:underline flex items-center"
                            onClick={() => onNavigateToElement(task.elementType, task.elementId)}
                          >
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "mr-2 py-0 h-5",
                                task.elementType === 'table' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                              )}
                            >
                              {task.elementType === 'table' ? 'Table' : 'Field'}
                            </Badge>
                            {task.elementName}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(task.createdAt)}
                        </div>
                      </div>
                      {editingTaskId === task.id ? (
                        <div className="mb-3">
                          <textarea
                            value={editingTaskDescription}
                            onChange={(e) => setEditingTaskDescription(e.target.value)}
                            className="w-full p-2 text-sm border rounded"
                            rows={3}
                          />
                          <div className="mt-2">
                            <label className="text-xs text-muted-foreground mr-2">Priority:</label>
                            <select
                              value={editingTaskPriority}
                              onChange={(e) => setEditingTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                              className="text-sm border rounded p-1"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (onEditTask) {
                                  onEditTask(task.id, editingTaskDescription, editingTaskPriority);
                                }
                                setEditingTaskId(null);
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingTaskId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm mb-3 whitespace-pre-line">
                          {task.description}
                        </div>
                      )}
                       
                      {/* Additional context display if available */}
                      {task.context && (
                        <div className="text-xs text-muted-foreground mb-3">
                          {task.context.parentTable && (
                            <div className="inline-flex items-center">
                              <span className="mr-1">Parent table:</span>
                              <Badge variant="outline" className="py-0 h-5">
                                {task.context.parentTable}
                              </Badge>
                            </div>
                          )}
                          {(task.context.schema || task.context.database) && (
                            <div className="inline-flex items-center ml-2">
                              <span className="mr-1">In:</span>
                              {task.context.database && (
                                <span className="mr-1">{task.context.database}</span>
                              )}
                              {task.context.schema && (
                                <Badge variant="outline" className="py-0 h-5">
                                  {task.context.schema}
                                </Badge>
                              )}
                            </div>
                          )}
                          {task.context.commentId && (
                            <div className="inline-flex items-center ml-2">
                              <Badge variant="outline" className="py-0 h-5 bg-green-500/10 text-green-500 border-green-500/30">
                                From Comment
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        {task.author && (
                          <div className="text-xs text-muted-foreground">
                            by {task.author}
                          </div>
                        )}
                        <div className="flex gap-1">
                          {!task.completed && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onMarkTaskComplete(task.id)}
                              className="h-7 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Complete
                            </Button>
                          )}
                          
                          {onEditTask && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setEditingTaskDescription(task.description);
                                setEditingTaskPriority(task.priority);
                              }}
                              className="h-7 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                          
                          {onDeleteTask && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteTask(task.id)}
                              className="h-7 text-xs text-red-500 hover:text-red-700"
                            >
                              <Trash className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
