import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, CheckSquare, Filter, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedComment } from './EnhancedComment';
import { CommentComposer } from './CommentComposer';

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
    display_name?: string;
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
    display_name?: string;
    avatar_url?: string;
  };
  assignee?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
  is_read?: boolean;
  read_at?: string;
}

export interface TargetElement {
  type: 'table' | 'field' | 'function' | 'trigger' | 'policy' | 'mockup' | string;
  id: string;
  name: string;
  parentId?: string;
  parentName?: string;
}

interface UnifiedCommentsPanelProps {
  projectId: string;
  onNavigateToObject?: (objectType: string, objectId: string, parentObjectId?: string) => void;
  targetElement?: TargetElement;
  isOpen?: boolean; // Add this prop to detect when the panel is opened
}

export function UnifiedCommentsPanel({ projectId, onNavigateToObject, targetElement, isOpen = true }: UnifiedCommentsPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'comments' | 'tasks'>('all');
  const [filter, setFilter] = useState<string>('all');
  const [comments, setComments] = useState<UnifiedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { user } = useAuth();
  const { toast } = useToast();

  // Debug logging
  console.log('UnifiedCommentsPanel rendered with:', { projectId, targetElement });

  // Define fetchComments outside useEffect so it can be called from other functions
  const fetchComments = async () => {
    if (!projectId) {
      console.error('Cannot fetch comments: missing projectId');
      return;
    }

    console.log('Fetching comments for project:', projectId);
    setLoading(true);

    try {
      // Fetch unified comments with author_name stored directly in the table
      console.log('Querying unified_comments table...');
      const { data: comments, error } = await supabase
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
          updated_at,
          author_name
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      console.log('Comments fetched:', comments?.length || 0);

      // Transform comments to the expected format using stored author_name
      const formattedComments: UnifiedComment[] = (comments || []).map(comment => ({
        ...comment,
        author: {
          id: comment.author_id,
          email: comment.author_name, // Use author_name as fallback for email display
          display_name: comment.author_name || 'Team Member'
        },
        is_read: false, // We'll handle read status separately if needed
        read_at: undefined
      }));

      // Apply filters
      let filteredComments = formattedComments;

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

      console.log('Final filtered comments:', filteredComments.length);
      setComments(filteredComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Call fetchComments when dependencies change
  useEffect(() => {
    fetchComments();
  }, [projectId, activeTab, filter, sortOrder]);
  
  // Reload comments when the panel is opened
  useEffect(() => {
    if (isOpen && projectId) {
      console.log('Comments panel opened, reloading comments for project:', projectId);
      fetchComments();
    }
  }, [isOpen, projectId]);

  /**
   * Creates a new comment or task in the database and updates the UI
   * @param {string} content - The comment content
   * @param {boolean} [isTask=false] - Whether this is a task (todo) item
   * @returns {Promise<void>} Resolves when the comment is created and UI is updated
   * @throws {Error} If there's an error creating the comment
   */
  const handleCreateComment = async (content: string, isTask: boolean = false): Promise<void> => {
    // Input validation
    if (!user) {
      const errorMsg = 'You must be logged in to create comments';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!content?.trim()) {
      const errorMsg = 'Comment content cannot be empty';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('Creating comment with author_id:', user.id, '(matches auth.users.id)');

    // If we have a target element, auto-tag it in the content
    let finalContent = content;
    if (targetElement) {
      const tag = targetElement.type === 'field' && targetElement.parentName
        ? `#${targetElement.parentName}.${targetElement.name}`
        : `#${targetElement?.name}`;
      
      if (!content.includes(tag)) {
        finalContent = `${content}\n\n${tag}`;
      }
    }

    console.log('Creating comment with content:', finalContent);
    
    // Get user's display name from profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', user.id)
      .single();

    const authorName = userProfile?.display_name || userProfile?.email || user.email || 'Team Member';
    
    try {
      // Insert the new comment into the database with author_name
      const { data, error: insertError } = await supabase
        .from('unified_comments')
        .insert({
          project_id: projectId,
          author_id: user.id, // This is auth.users.id which has FK relationship
          content: finalContent,
          object_type: targetElement?.type || 'general',
          object_id: targetElement?.name || '',
          parent_object_id: targetElement?.parentName || null,
          is_task: isTask,
          completed: false,
          assigned_to: null,
          author_name: authorName // Store the display name directly in the comment
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Supabase error creating comment:', insertError);
        throw new Error(`Failed to create comment: ${insertError.message}`);
      }

      console.log('Comment created successfully:', data);

      // Create the comment object with author info for immediate UI update (using stored author_name)
      const commentWithAuthor = {
        ...data,
        author: {
          id: user.id,
          email: authorName,
          display_name: authorName
        }
      };
      
      // Update local state optimistically
      setComments(prev => [commentWithAuthor, ...prev]);

      // Refresh comments after a short delay to ensure consistency
      setTimeout(() => {
        console.log('Refreshing comments...');
        fetchComments().catch(err => 
          console.error('Error refreshing comments:', err)
        );
      }, 1000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in handleCreateComment:', error);
      
      // Re-throw with a user-friendly message
      throw new Error(`Failed to create comment: ${errorMsg}`);
    }
  };

  /**
   * Updates an existing comment's content
   * @param {string} commentId - The ID of the comment to update
   * @param {string} newContent - The new content for the comment
   * @throws {Error} If there's an error updating the comment
   */
  const handleUpdateComment = async (commentId: string, newContent: string) => {
    if (!newContent?.trim()) {
      const errorMsg = 'Comment content cannot be empty';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      throw new Error(errorMsg);
    }

    try {
      const { error } = await supabase
        .from('unified_comments')
        .update({ 
          content: newContent, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: newContent, updated_at: new Date().toISOString() }
          : comment
      ));

      // Show success toast
      toast({
        title: 'Success',
        description: 'Comment updated successfully!',
        variant: 'default',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update comment';
      
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
        duration: 5000,
      });
      
      throw error;
    }
  };

  /**
   * Toggles the completion status of a task comment
   * @param {string} commentId - The ID of the comment/task to toggle
   * @param {boolean} completed - The new completion status
   * @throws {Error} If there's an error updating the task status
   */
  const handleToggleTask = async (commentId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('unified_comments')
        .update({ 
          completed, 
          updated_at: new Date().toISOString()
          // Note: completed_at column will be added in a future migration
        })
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              completed, 
              updated_at: new Date().toISOString()
              // Note: completed_at field will be added in a future migration
            }
          : comment
      ));

      // Show success toast
      toast({
        title: 'Task Updated',
        description: completed ? 'Task marked as complete!' : 'Task marked as incomplete',
        variant: 'default',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error toggling task status:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update task status';
      
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
        duration: 5000,
      });
      throw error;
    }
  };

  /**
   * Handles deleting a comment or task
   * @param {string} commentId - The ID of the comment to delete
   * @throws {Error} If there's an error deleting the comment
   */
  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete comments.',
        variant: 'destructive',
      });
      return;
    }

    // Store the comment being deleted for potential undo
    const commentToDelete = comments.find(c => c.id === commentId);
    if (!commentToDelete) return;

    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('unified_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Update local state by removing the deleted comment
      setComments(prev => prev.filter(comment => comment.id !== commentId));

      // Show success toast with undo option
      toast({
        title: 'Comment Deleted',
        description: 'The comment has been deleted.',
        action: (
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            onClick={async () => {
              try {
                // Try to restore the comment
                const { data: restoredComment, error: restoreError } = await supabase
                  .from('unified_comments')
                  .insert(commentToDelete)
                  .select('*')
                  .single();
                
                if (restoreError) throw restoreError;
                
                // Add back to UI
                setComments(prev => [restoredComment, ...prev]);
                
                toast({
                  title: 'Comment Restored',
                  description: 'The comment has been restored.',
                  variant: 'default',
                });
              } catch (restoreError) {
                console.error('Error restoring comment:', restoreError);
                toast({
                  title: 'Error',
                  description: 'Failed to restore comment.',
                  variant: 'destructive',
                });
              }
            }}
          >
            <span className="mr-1">↩️</span>
            Undo
          </button>
        ),
        variant: 'default',
        duration: 10000, // 10 seconds to undo
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete comment';
      
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
        duration: 5000,
      });
      
      throw error;
    }
  };

  const handleConvertToTask = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('unified_comments')
        .update({ 
          is_task: true, 
          completed: false,
          updated_at: new Date().toISOString() 
        })
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, is_task: true, completed: false, updated_at: new Date().toISOString() }
          : comment
      ));
    } catch (error) {
      console.error('Error converting comment to task:', error);
      throw error;
    }
  };

  const handleMarkAsRead = async (commentId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('comment_read_status')
        .upsert({
          comment_id: commentId,
          user_id: user.id,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'comment_id,user_id'
        });

      if (error) throw error;

      // Update local state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, is_read: true, read_at: new Date().toISOString() }
          : comment
      ));
    } catch (error) {
      console.error('Error marking comment as read:', error);
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

  const renderCommentList = () => {
  if (loading) {
    const skeletons = Array.from({ length: 5 });
    return skeletons.map((_, index) => (
      <div key={`skeleton-${index}`} className="flex gap-4 p-4 border-b">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ));
  }

  // Filter comments based on active tab
  const filteredComments = comments.filter(comment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'comments') return !comment.is_task;
    if (activeTab === 'tasks') return comment.is_task;
    return true;
  });

  if (filteredComments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 mb-2 opacity-20 text-muted-foreground" />
        <p className="text-foreground">No {activeTab === 'all' ? 'comments or tasks' : activeTab} found</p>
        <p className="text-sm mt-1 text-muted-foreground">
          {activeTab === 'tasks' 
            ? 'Create tasks to track work items' 
            : 'Add comments to collaborate with your team'}
        </p>
      </div>
    );
  }

  return filteredComments.map(comment => (
    <EnhancedComment
      key={comment.id}
      id={comment.id}
      content={comment.content}
      author={comment.author!}
      created_at={comment.created_at}
      updated_at={comment.updated_at}
      is_task={comment.is_task}
      completed={comment.completed}
      currentUserId={user?.id || ''}
      onUpdate={handleUpdateComment}
      onToggleTask={handleToggleTask}
      onNavigateToElement={onNavigateToObject}
      onConvertToTask={handleConvertToTask}
    />
  ));
};  

  return (
    <div className="h-full flex flex-col overflow-y-auto mx-2">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Comments & Tasks</h3>
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
        
        <div className="border rounded-md mt-4 overflow-hidden flex-grow">
          <ScrollArea className="h-[calc(100vh-300px)]" type="always">
            <TabsContent value="all" className="m-0">
              {renderCommentList()}
            </TabsContent>
            <TabsContent value="comments" className="m-0">
              {renderCommentList()}
            </TabsContent>
            <TabsContent value="tasks" className="m-0">
              {renderCommentList()}
            </TabsContent>
          </ScrollArea>
        </div>
        
        {/* Comment Input at the bottom */}
        <div className="border-t mt-auto pt-4">
          <CommentComposer
            onSubmit={handleCreateComment}
            placeholder="Share your thoughts or create a task..."
            className="border-0 shadow-none"
          />
        </div>
      </Tabs>
    </div>
  );
}
