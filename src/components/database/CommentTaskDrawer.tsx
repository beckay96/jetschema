import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, CheckCircle, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from '@/lib/utils';

// Define types for comments and tasks
export interface SchemaComment {
  id: string;
  elementType: 'table' | 'field';
  elementId: string;
  elementName: string;
  content: string;
  author?: string;
  createdAt: Date;
  read?: boolean;
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
}

interface CommentTaskDrawerProps {
  comments: SchemaComment[];
  tasks: SchemaTask[];
  onMarkCommentRead: (id: string) => void;
  onMarkTaskComplete: (id: string) => void;
  onNavigateToElement: (elementType: string, elementId: string) => void;
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
  open,
  onOpenChange
}: CommentTaskDrawerProps) {
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
      // Apply filters to comments
      setFilteredComments(
        commentFilter === 'unread' 
          ? safeComments.filter(c => !c.read)
          : safeComments
      );

      // Ensure tasks is an array before filtering
      const safeTasks = Array.isArray(tasks) ? tasks : [];
      // Apply filters to tasks
      setFilteredTasks(
        taskFilter === 'active' 
          ? safeTasks.filter(t => !t.completed)
          : taskFilter === 'completed'
            ? safeTasks.filter(t => t.completed)
            : safeTasks
      );
    } catch (error) {
      console.error('Error filtering comments/tasks:', error);
      // Reset to safe defaults on error
      setFilteredComments([]);
      setFilteredTasks([]);
    }
  }, [comments, tasks, commentFilter, taskFilter]);

  const unreadCommentCount = comments.filter(c => !c.read).length;
  const activeTaskCount = tasks.filter(t => !t.completed).length;
  
  function getPriorityColor(priority: 'low' | 'medium' | 'high') {
    switch (priority) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'medium': return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
      case 'low': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    }
  }

  function formatDate(date: Date) {
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
                          className="cursor-pointer text-sm font-medium hover:underline"
                          onClick={() => onNavigateToElement(comment.elementType, comment.elementId)}
                        >
                          {comment.elementName} 
                          <span className="text-xs text-muted-foreground ml-1">({comment.elementType})</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(comment.createdAt)}
                        </div>
                      </div>
                      <p className="text-sm mb-3">{comment.content}</p>
                      <div className="flex justify-between items-center">
                        {comment.author && (
                          <div className="text-xs text-muted-foreground">
                            by {comment.author}
                          </div>
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
                      </div>
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
                            className="cursor-pointer text-sm font-medium hover:underline"
                            onClick={() => onNavigateToElement(task.elementType, task.elementId)}
                          >
                            {task.elementName}
                            <span className="text-xs text-muted-foreground ml-1">({task.elementType})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(task.createdAt)}
                        </div>
                      </div>
                      <p className={cn(
                        "text-sm mb-3",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.description}
                      </p>
                      <div className="flex justify-between items-center">
                        {task.author && (
                          <div className="text-xs text-muted-foreground">
                            by {task.author}
                          </div>
                        )}
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
