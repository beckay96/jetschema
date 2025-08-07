import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DatabaseEnumeration, CreateEnumerationRequest, UpdateEnumerationRequest } from '@/types/enumerations';
import { toast } from 'sonner';

export function useEnumerations(projectId: string) {
  const [enumerations, setEnumerations] = useState<DatabaseEnumeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch enumerations
  const fetchEnumerations = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('database_enumerations')
        .select(`
          id,
          project_id,
          name,
          values,
          description,
          created_at,
          updated_at,
          created_by
        `)
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setEnumerations(data || []);
    } catch (err) {
      console.error('Error fetching enumerations:', err);
      setError('Failed to load enumerations');
      toast.error('Failed to load enumerations');
    } finally {
      setLoading(false);
    }
  };

  // Create enumeration
  const createEnumeration = async (enumData: CreateEnumerationRequest): Promise<DatabaseEnumeration> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('database_enumerations')
      .insert({
        project_id: projectId,
        name: enumData.name,
        values: enumData.values,
        description: enumData.description,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    const newEnumeration = data as DatabaseEnumeration;
    setEnumerations(prev => [...prev, newEnumeration].sort((a, b) => a.name.localeCompare(b.name)));
    
    return newEnumeration;
  };

  // Update enumeration
  const updateEnumeration = async (enumData: UpdateEnumerationRequest): Promise<DatabaseEnumeration> => {
    const { data, error } = await supabase
      .from('database_enumerations')
      .update({
        name: enumData.name,
        values: enumData.values,
        description: enumData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', enumData.id)
      .select()
      .single();

    if (error) throw error;

    const updatedEnumeration = data as DatabaseEnumeration;
    setEnumerations(prev => 
      prev.map(e => e.id === enumData.id ? updatedEnumeration : e)
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    return updatedEnumeration;
  };

  // Delete enumeration
  const deleteEnumeration = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('database_enumerations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setEnumerations(prev => prev.filter(e => e.id !== id));
  };

  // Get enumeration by name
  const getEnumerationByName = (name: string): DatabaseEnumeration | undefined => {
    return enumerations.find(e => e.name === name);
  };

  // Check if enumeration name exists
  const enumerationNameExists = (name: string, excludeId?: string): boolean => {
    return enumerations.some(e => e.name === name && e.id !== excludeId);
  };

  useEffect(() => {
    fetchEnumerations();
  }, [projectId]);

  return {
    enumerations,
    loading,
    error,
    createEnumeration,
    updateEnumeration,
    deleteEnumeration,
    getEnumerationByName,
    enumerationNameExists,
    refetch: fetchEnumerations
  };
}
