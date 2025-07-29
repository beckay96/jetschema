import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { DatabaseProject } from '@/types/database';
import { toast } from 'sonner';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('database_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async (name: string, description: string, projectData: any) => {
    if (!user) {
      toast.error('Please sign in to save projects');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('database_projects')
        .insert({
          user_id: user.id,
          name,
          description,
          project_data: projectData
        })
        .select()
        .single();

      if (error) throw error;
      

      await fetchProjects(); // Refresh the list
      return data;
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
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