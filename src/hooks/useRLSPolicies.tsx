import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface RLSPolicy {
  id: string;
  name: string;
  table_name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  role?: string;
  using_expression?: string;
  with_check_expression?: string;
  is_permissive: boolean;
  description?: string;
  project_id: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export function useRLSPolicies(projectId?: string) {
  const [policies, setPolicies] = useState<RLSPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPolicies = async () => {
    if (!projectId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('database_policies')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicies((data || []) as RLSPolicy[]);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load RLS policies');
    } finally {
      setLoading(false);
    }
  };

  const savePolicy = async (policy: Omit<RLSPolicy, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('database_policies')
        .insert({
          ...policy,
          author_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setPolicies(prev => [data as RLSPolicy, ...prev]);
      toast.success('RLS policy created successfully');
      return data;
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error('Failed to create RLS policy');
      throw error;
    }
  };

  const updatePolicy = async (id: string, updates: Partial<RLSPolicy>) => {
    try {
      const { data, error } = await supabase
        .from('database_policies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPolicies(prev => prev.map(p => p.id === id ? data as RLSPolicy : p));
      toast.success('RLS policy updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating policy:', error);
      toast.error('Failed to update RLS policy');
      throw error;
    }
  };

  const deletePolicy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('database_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPolicies(prev => prev.filter(p => p.id !== id));
      toast.success('RLS policy deleted successfully');
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.error('Failed to delete RLS policy');
      throw error;
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [projectId, user]);

  return {
    policies,
    loading,
    savePolicy,
    updatePolicy,
    deletePolicy,
    refetch: fetchPolicies
  };
}