import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, CheckSquare, Filter, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

// Legacy field comment type for proper typing
interface LegacyFieldComment {
  id: string;
  project_id: string;
  author_id: string;
  comment_text: string;
  field_name: string;
  table_name: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface UnifiedComment {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  object_type: string;
  object_id: string;
  parent_object_id: string | null;
  is_task: boolean;
  completed: boolean;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  assignee?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface UnifiedCommentsPanelProps {
  projectId: string;
  onNavigateToObject: (objectType: string, objectId: string, parentObjectId?: string) => void;
}

export function UnifiedCommentsPanel({ projectId, onNavigateToObject }: UnifiedCommentsPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'comments' | 'tasks'>('all');
  const [comments, setComments] = useState<UnifiedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'table' | 'field' | 'function' | 'trigger' | 'policy' | 'mockup'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) return;
    
    const fetchComments = async () => {
      setLoading(true);
      try {
        // Get comments from unified_comments table
        const { data: rawUnifiedData, error: unifiedError } = await supabase
          .from('unified_comments')
          .select(`
            id,
            project_id,
            author_id,
            content,
            object_type,
            object_id,
            parent_object_id,
            is_task,
            completed,
            assigned_to,
            created_at,
            updated_at
          `)
          .eq('project_id', projectId)
          .order('created_at', sortOrder === 'newest' ? { ascending: false } : { ascending: true });
          
        // Process the unified data to match our expected type structure
        const unifiedData = (rawUnifiedData || []).map(item => ({
          ...item,
          author: undefined, // We'll handle author display separately
          assignee: undefined
        }));

        if (unifiedError) throw unifiedError;

        // Get legacy comments from field_comments table
        const { data: legacyData, error: legacyError } = await supabase
          .from('field_comments')
          .select(`
            id,
            project_id,
            author_id,
            comment_text,
            field_name,
            table_name,
            is_completed,
            created_at,
            updated_at
          `)
          .eq('project_id', projectId)
          .order('created_at', sortOrder === 'newest' ? { ascending: false } : { ascending: true});

        if (legacyError) throw legacyError;

        // Transform legacy comments to match unified format
        const transformedLegacyData = (legacyData || []).map(item => ({
          id: item.id,
          project_id: item.project_id,
          author_id: item.author_id,
          content: item.comment_text,
          object_id: item.field_name,
          parent_object_id: item.table_name,
          completed: item.is_completed,
          created_at: item.created_at,
          updated_at: item.updated_at,
          author: undefined, // We don't have author data from the simplified query
          object_type: 'field' as const,
          is_task: false,
          assigned_to: null,
          assignee: null
        }));

        // Combine both data sources, ensuring proper typing
        const allComments: UnifiedComment[] = [
          ...unifiedData as unknown as UnifiedComment[],
          ...transformedLegacyData as unknown as UnifiedComment[]
        ];
        
        // Apply filters
        let filteredComments = allComments;
        
        if (activeTab === 'comments') {
          filteredComments = filteredComments.filter(comment => !comment.is_task);
        } else if (activeTab === 'tasks') {
          filteredComments = filteredComments.filter(comment => comment.is_task);
        }
        
        if (filter !== 'all') {
          filteredComments = filteredComments.filter(comment => comment.object_type === filter);
        }
        
        // Sort by date
        filteredComments.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        
        setComments(filteredComments as UnifiedComment[]);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [projectId, activeTab, filter, sortOrder]);

  const handleToggleTask = async (commentId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('unified_comments')
        .update({ completed: !completed })
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, completed: !completed } 
            : comment
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getObjectTypeLabel = (objectType: string) => {
    switch (objectType) {
      case 'table': return 'Table';
      case 'field': return 'Field';
      case 'function': return 'Function';
      case 'trigger': return 'Trigger';
      case 'policy': return 'RLS Policy';
      case 'mockup': return 'Mockup';
      default: return objectType;
    }
  };

  const getObjectTypeColor = (objectType: string) => {
    switch (objectType) {
      case 'table': return 'bg-blue-500';
      case 'field': return 'bg-green-500';
      case 'function': return 'bg-purple-500';
      case 'trigger': return 'bg-orange-500';
      case 'policy': return 'bg-red-500';
      case 'mockup': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const renderCommentList = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ));
    }

    if (comments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
          <p>No {activeTab === 'all' ? 'comments or tasks' : activeTab} found</p>
          <p className="text-sm mt-1">
            {activeTab === 'tasks' 
              ? 'Create tasks to track work items' 
              : 'Add comments to collaborate with your team'}
          </p>
        </div>
      );
    }

    return comments.map(comment => (
      <div 
        key={comment.id} 
        className={cn(
          "p-4 border-b hover:bg-muted/30 transition-colors",
          comment.is_task && comment.completed && "bg-muted/20"
        )}
      >
        <div className="flex items-start gap-3">
          {comment.is_task && (
            <Checkbox 
              checked={comment.completed} 
              onCheckedChange={() => handleToggleTask(comment.id, comment.completed)}
              className="mt-1"
            />
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author?.avatar_url || ''} />
            <AvatarFallback>
              {comment.author?.full_name?.charAt(0) || comment.author?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {comment.author?.full_name || comment.author?.email || 'Unknown user'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.is_task && (
                <Badge variant="outline" className={cn("ml-auto", comment.completed && "line-through opacity-50")}>
                  Task
                </Badge>
              )}
            </div>
            <p className={cn("text-sm mb-2", comment.is_task && comment.completed && "line-through opacity-70")}>
              {comment.content}
            </p>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => onNavigateToObject(comment.object_type, comment.object_id, comment.parent_object_id || undefined)}
              >
                <span className={`w-2 h-2 rounded-full ${getObjectTypeColor(comment.object_type)} mr-1`}></span>
                {getObjectTypeLabel(comment.object_type)}: {comment.object_id}
                {comment.parent_object_id && ` (${comment.parent_object_id})`}
              </Badge>
              
              {comment.assigned_to && (
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-xs text-muted-foreground">Assigned to:</span>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={comment.assignee?.avatar_url || ''} />
                    <AvatarFallback className="text-[10px]">
                      {comment.assignee?.full_name?.charAt(0) || comment.assignee?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg">Comments & Tasks</h3>
          <p className="text-sm text-muted-foreground">
            Track discussions and work items across your project
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                {filter === 'all' ? 'All Types' : getObjectTypeLabel(filter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('table')}>
                Tables
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('field')}>
                Fields
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('function')}>
                Functions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('trigger')}>
                Triggers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('policy')}>
                RLS Policies
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('mockup')}>
                Mockups
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortOrder('newest')}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('oldest')}>
                Oldest First
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'comments' | 'tasks')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
        </TabsList>
        
        <div className="border rounded-md mt-4 overflow-hidden">
          <TabsContent value="all" className="m-0 max-h-[500px] overflow-y-auto">
            {renderCommentList()}
          </TabsContent>
          <TabsContent value="comments" className="m-0 max-h-[500px] overflow-y-auto">
            {renderCommentList()}
          </TabsContent>
          <TabsContent value="tasks" className="m-0 max-h-[500px] overflow-y-auto">
            {renderCommentList()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
