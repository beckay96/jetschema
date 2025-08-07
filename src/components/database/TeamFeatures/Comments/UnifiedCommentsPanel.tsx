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
  is_read?: boolean;
  read_at?: string;
}

interface UnifiedCommentsPanelProps {
  projectId: string;
  onNavigateToObject: (objectType: string, objectId: string, parentObjectId?: string) => void;
  // Target element for automatic tagging
  targetElement?: {
    type: 'table' | 'field' | 'function' | 'trigger' | 'policy' | 'mockup';
    id: string;
    name: string;
    parentId?: string; // For fields, this would be the table ID
    parentName?: string; // For fields, this would be the table name
  };
}

export function UnifiedCommentsPanel({ projectId, onNavigateToObject, targetElement }: UnifiedCommentsPanelProps) {
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
      // First try unified comments - fetch comments and profiles separately to avoid FK issues
      console.log('Querying unified_comments table...');
      const { data: unifiedData, error: unifiedError } = await supabase
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
        .order('created_at', { ascending: false });

      if (unifiedError) {
        console.error('Error fetching unified comments:', unifiedError);
        throw unifiedError;
      }

      console.log('Unified comments fetched:', unifiedData?.length || 0);

      // Fetch author profiles separately
      let authorProfiles: { [key: string]: any } = {};
      if (unifiedData && unifiedData.length > 0) {
        const authorIds = [...new Set(unifiedData.map(comment => comment.author_id).filter(Boolean))];
        console.log('Fetching profiles for author IDs:', authorIds);
        
        if (authorIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url')
            .in('id', authorIds);

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
          } else if (profilesData) {
            console.log('Profiles fetched successfully:', profilesData.length);
            authorProfiles = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {} as { [key: string]: any });
          }
        }
      }

      // Convert unified comments to the expected format
      const unifiedComments: UnifiedComment[] = (unifiedData || []).map(comment => ({
        ...comment,
        author: authorProfiles[comment.author_id] || {
          id: comment.author_id,
          email: 'Unknown User',
          display_name: 'Unknown User'
        },
        is_read: false, // We'll handle read status separately if needed
        read_at: undefined
      }));

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
        .order('created_at', { ascending: false });

      if (legacyError) throw legacyError;

      // Fetch author profiles for legacy comments if needed
      if (legacyData && legacyData.length > 0) {
        const legacyAuthorIds = [...new Set(legacyData.map(comment => comment.author_id))];
        const newAuthorIds = legacyAuthorIds.filter(id => !authorProfiles[id]);
        
        if (newAuthorIds.length > 0) {
          const { data: additionalProfilesData, error: additionalProfilesError } = await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url')
            .in('id', newAuthorIds);

          if (!additionalProfilesError && additionalProfilesData) {
            additionalProfilesData.forEach(profile => {
              authorProfiles[profile.id] = profile;
            });
          }
        }
      }

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
        author: authorProfiles[item.author_id] || {
          id: item.author_id,
          email: 'Unknown User',
          display_name: 'Unknown User'
        },
        is_read: false,
        read_at: undefined,
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
    
    try {
      // Insert the new comment into the database
      const { data, error: insertError } = await supabase
        .from('unified_comments')
        .insert({
          project_id: projectId,
          author_id: user.id,
          content: finalContent,
          is_task: isTask,
          object_type: targetElement?.type || 'project',
          object_id: targetElement?.id || projectId,
          parent_object_id: targetElement?.parentId || null,
          completed: false,
          assigned_to: null
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Supabase error creating comment:', insertError);
        throw new Error(`Failed to create comment: ${insertError.message}`);
      }

      console.log('Comment created successfully:', data);

      // Fetch the author profile for the new comment
      const { data: authorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Could not fetch author profile:', profileError);
        // Continue with a fallback profile
      }

      // Create the comment object with author info
      const commentWithAuthor: UnifiedComment = {
        ...data,
        author: authorProfile || {
          id: user.id,
          email: user.email || 'user@example.com',
          display_name: user.user_metadata?.display_name || user.email || 'User',
          avatar_url: user.user_metadata?.avatar_url || ''
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
          updated_at: new Date().toISOString(),
          ...(completed && { completed_at: new Date().toISOString() }) // Track when task was completed
        })
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              completed, 
              updated_at: new Date().toISOString(),
              ...(completed && { completed_at: new Date().toISOString() })
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
   * Deletes a comment from the database and updates the UI
   * @param {string} commentId - The ID of the comment to delete
   * @throws {Error} If there's an error deleting the comment
   */
  const handleDeleteComment = async (commentId: string) => {
    // Store the comment being deleted for potential undo
    const commentToDelete = comments.find(c => c.id === commentId);
    
    // Optimistically remove from UI
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    
    try {
      const { error } = await supabase
        .from('unified_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Show success toast with undo option
      toast({
        title: 'Comment Deleted',
        description: 'The comment has been deleted.',
        action: commentToDelete ? (
          <Button 
            variant="outline" 
            size="sm"
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
                  description: 'Failed to restore comment',
                  variant: 'destructive',
                });
              }
            }}
          >
            Undo
          </Button>
        ) : undefined,
        variant: 'default',
        duration: 10000, // Give user more time to undo
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      
      // Revert UI on error
      if (commentToDelete) {
        setComments(prev => [commentToDelete, ...prev]);
      }
      
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
          <div className="flex-1 space-y-2 bg-background dark:text-white text-black">
            <Skeleton className="h-4 w-1/4 bg-background dark:text-white text-black" />
            <Skeleton className="h-4 w-3/4 bg-background dark:text-white text-black" />
            <Skeleton className="h-4 w-1/2 bg-background dark:text-white text-black" />
          </div>
        </div>
      ));
    }

    if (comments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-background dark:text-white text-black">
          <MessageSquare className="h-12 w-12 mb-2 opacity-20 bg-background dark:text-white text-black" />
          <p>No {activeTab === 'all' ? 'comments or tasks' : activeTab} found</p>
          <p className="text-sm mt-1 bg-background dark:text-white text-black">
            {activeTab === 'tasks' 
              ? 'Create tasks to track work items' 
              : 'Add comments to collaborate with your team'}
          </p>
        </div>
      );
    }

    return comments.map(comment => (
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
    <div className="h-full flex flex-col overflow-y-auto mx-2 bg-background dark:text-white text-black">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg">Comments & Tasks</h3>
          <p className="text-sm bg-background dark:text-white text-black">
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
            <TabsContent value="all" className="m-0 bg-background dark:text-white text-black">
              {renderCommentList()}
            </TabsContent>
            <TabsContent value="comments" className="m-0 bg-background dark:text-white text-black">
              {renderCommentList()}
            </TabsContent>
            <TabsContent value="tasks" className="m-0 bg-background dark:text-white text-black">
              {renderCommentList()}
            </TabsContent>
          </ScrollArea>
        </div>
        
        {/* Comment Input at the bottom */}
        <div className="border-t mt-auto pt-4">
          <CommentComposer
            onSubmit={handleCreateComment}
            placeholder="Share your thoughts or create a task..."
            className="border-0 shadow-none bg-background dark:text-white text-black"
          />
        </div>
      </Tabs>
    </div>
  );
}
