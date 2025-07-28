import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DatabaseIndex {
  id: string;
  name: string;
  table_name: string;
  columns: string[];
  index_type: 'BTREE' | 'HASH' | 'GIN' | 'GIST' | 'SPGIST' | 'BRIN';
  is_unique: boolean;
  is_partial: boolean;
  where_clause?: string;
  description?: string;
  project_id: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export function useIndexes(projectId?: string) {
  const [indexes, setIndexes] = useState<DatabaseIndex[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchIndexes = async () => {
    if (!projectId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('database_indexes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIndexes((data || []) as DatabaseIndex[]);
    } catch (error) {
      console.error('Error fetching indexes:', error);
      toast.error('Failed to load indexes');
    } finally {
      setLoading(false);
    }
  };

  const saveIndex = async (index: Omit<DatabaseIndex, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('database_indexes')
        .insert({
          ...index,
          author_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setIndexes(prev => [data as DatabaseIndex, ...prev]);
      toast.success('Index created successfully');
      return data;
    } catch (error) {
      console.error('Error saving index:', error);
      toast.error('Failed to create index');
      throw error;
    }
  };

  const updateIndex = async (id: string, updates: Partial<DatabaseIndex>) => {
    try {
      const { data, error } = await supabase
        .from('database_indexes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setIndexes(prev => prev.map(i => i.id === id ? data as DatabaseIndex : i));
      toast.success('Index updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating index:', error);
      toast.error('Failed to update index');
      throw error;
    }
  };

  const deleteIndex = async (id: string) => {
    try {
      const { error } = await supabase
        .from('database_indexes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setIndexes(prev => prev.filter(i => i.id !== id));
      toast.success('Index deleted successfully');
    } catch (error) {
      console.error('Error deleting index:', error);
      toast.error('Failed to delete index');
      throw error;
    }
  };

  useEffect(() => {
    fetchIndexes();
  }, [projectId, user]);

  return {
    indexes,
    loading,
    saveIndex,
    updateIndex,
    deleteIndex,
    refetch: fetchIndexes
  };
}