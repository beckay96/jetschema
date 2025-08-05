import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    if (!user) {
      console.log('No user found, skipping project fetch');
      return;
    }
    
    console.log('Fetching projects for user:', user.id);
    setLoading(true);
    
    try {
      // First check if user is authenticated
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication failed');
      }
      
      if (!currentUser) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }
      
      console.log('Authenticated user confirmed:', currentUser.id);
      
      // Try to fetch projects with detailed error logging
      const { data, error } = await supabase
        .from('database_projects')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Database query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('Projects fetched successfully:', data?.length || 0, 'projects');
      setProjects(data || []);
      
    } catch (error: any) {
      console.error('Error fetching projects:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      
      // More specific error messages
      if (error.code === '42501') {
        toast.error('Permission denied. Please check your account access.');
      } else if (error.code === 'PGRST116') {
        toast.error('Database table not found. Please contact support.');
      } else if (error.message?.includes('JWT')) {
        toast.error('Session expired. Please sign in again.');
      } else {
        toast.error(`Failed to load projects: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async (name: string, description: string, projectData: any) => {
    if (!user) {
      toast.error('Please sign in to save projects');
      return null;
    }

    // Ensure name is properly structured and not empty
    const projectName = name ? name.trim() : 'New Project';
    console.log('Creating project with name:', projectName);

    try {
      // Create explicit payload to ensure all fields are set correctly
      const projectPayload = {
        user_id: user.id,
        name: projectName, // Explicitly set the name
        description: description || '',
        project_data: projectData || {}
      };
      
      console.log('Saving project with payload:', projectPayload);
      
      const { data, error } = await supabase
        .from('database_projects')
        .insert(projectPayload)
        .select()
        .single();

      if (error) {
        console.error('Database error details:', error);
        throw error;
      }
      
      console.log('Project saved successfully:', data);
      await fetchProjects(); // Refresh the list
      return data;
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(`Failed to save project: ${error.message || 'Unknown error'}`);
      return null;
    }
  };

  const updateProject = async (id: string, updates: any) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('database_projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      

      await fetchProjects();
      return data;
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return null;
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('database_projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Project deleted successfully!');
      await fetchProjects();
      return true;
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  return {
    projects,
    loading,
    saveProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  };
}