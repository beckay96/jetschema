import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageAnnotator, Annotation } from './ImageAnnotator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, CheckSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export interface MockupComment {
  id: string;
  mockup_id: string;
  user_id: string;
  content: string;
  annotations?: Annotation[];
  created_at: string;
  updated_at: string;
  is_task: boolean;
  completed?: boolean;
  assigned_to?: string;
}

interface MockupAnnotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mockupId: string;
  mockupUrl: string;
  projectId: string;
  onCommentAdded?: () => void;
}

export const MockupAnnotationModal: React.FC<MockupAnnotationModalProps> = ({
  open,
  onOpenChange,
  mockupId,
  mockupUrl,
  projectId,
  onCommentAdded
}) => {
  const [activeTab, setActiveTab] = useState<'comment' | 'task'>('comment');
  const [comment, setComment] = useState('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to add comments');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mockup_comments')
        .insert({
          mockup_id: mockupId,
          user_id: user.id,
          content: comment,
          annotations: annotations.length > 0 ? annotations : null,
          is_task: activeTab === 'task',
          completed: false,
          project_id: projectId
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success(activeTab === 'comment' ? 'Comment added successfully' : 'Task created successfully');
      setComment('');
      setAnnotations([]);
      onCommentAdded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving comment:', error);
      toast.error('Failed to save comment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnotationSave = (newAnnotations: Annotation[]) => {
    setAnnotations(newAnnotations);
    setIsAnnotating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isAnnotating ? 'Annotate Mockup' : 'Add Comment to Mockup'}
          </DialogTitle>
        </DialogHeader>
        
        {isAnnotating ? (
          <div className="flex-1 min-h-[500px]">
            <ImageAnnotator
              imageUrl={mockupUrl}
              initialAnnotations={annotations}
              onSave={handleAnnotationSave}
              onCancel={() => setIsAnnotating(false)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'comment' | 'task')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comment" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Comment
                </TabsTrigger>
                <TabsTrigger value="task" className="flex items-center">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Task
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="comment" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    placeholder="Add your comment here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="task" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="task">Task Description</Label>
                  <Textarea
                    id="task"
                    placeholder="Describe what needs to be done..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsAnnotating(true)}
              >
                Annotate Image
              </Button>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!comment.trim() || loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            
            {annotations.length > 0 && (
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} added
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAnnotating(true)}
                >
                  Edit Annotations
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
