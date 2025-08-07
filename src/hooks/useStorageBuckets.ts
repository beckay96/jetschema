import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StorageBucket, CreateStorageBucketRequest, UpdateStorageBucketRequest } from '@/types/storageBuckets';
import { toast } from 'sonner';

export function useStorageBuckets(projectId: string) {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch storage buckets
  const fetchStorageBuckets = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('storage_buckets_plan')
        .select(`
          id,
          project_id,
          name,
          description,
          public,
          file_size_limit,
          allowed_mime_types,
          linked_tables,
          created_at,
          updated_at,
          created_by
        `)
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setBuckets(data || []);
    } catch (err) {
      console.error('Error fetching storage buckets:', err);
      setError('Failed to load storage buckets');
      toast.error('Failed to load storage buckets');
    } finally {
      setLoading(false);
    }
  };

  // Create storage bucket
  const createStorageBucket = async (bucketData: CreateStorageBucketRequest): Promise<StorageBucket> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('storage_buckets_plan')
      .insert({
        project_id: projectId,
        name: bucketData.name,
        description: bucketData.description,
        public: bucketData.public,
        file_size_limit: bucketData.file_size_limit,
        allowed_mime_types: bucketData.allowed_mime_types,
        linked_tables: bucketData.linked_tables,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    const newBucket = data as StorageBucket;
    setBuckets(prev => [...prev, newBucket].sort((a, b) => a.name.localeCompare(b.name)));
    
    return newBucket;
  };

  // Update storage bucket
  const updateStorageBucket = async (bucketData: UpdateStorageBucketRequest): Promise<StorageBucket> => {
    const { data, error } = await supabase
      .from('storage_buckets_plan')
      .update({
        name: bucketData.name,
        description: bucketData.description,
        public: bucketData.public,
        file_size_limit: bucketData.file_size_limit,
        allowed_mime_types: bucketData.allowed_mime_types,
        linked_tables: bucketData.linked_tables,
        updated_at: new Date().toISOString()
      })
      .eq('id', bucketData.id)
      .select()
      .single();

    if (error) throw error;

    const updatedBucket = data as StorageBucket;
    setBuckets(prev => 
      prev.map(b => b.id === bucketData.id ? updatedBucket : b)
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    return updatedBucket;
  };

  // Delete storage bucket
  const deleteStorageBucket = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('storage_buckets_plan')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setBuckets(prev => prev.filter(b => b.id !== id));
  };

  // Get bucket by name
  const getBucketByName = (name: string): StorageBucket | undefined => {
    return buckets.find(b => b.name === name);
  };

  // Check if bucket name exists
  const bucketNameExists = (name: string, excludeId?: string): boolean => {
    return buckets.some(b => b.name === name && b.id !== excludeId);
  };

  // Get buckets linked to a specific table
  const getBucketsLinkedToTable = (tableName: string): StorageBucket[] => {
    return buckets.filter(b => b.linked_tables?.includes(tableName));
  };

  useEffect(() => {
    fetchStorageBuckets();
  }, [projectId]);

  return {
    buckets,
    loading,
    error,
    createStorageBucket,
    updateStorageBucket,
    deleteStorageBucket,
    getBucketByName,
    bucketNameExists,
    getBucketsLinkedToTable,
    refetch: fetchStorageBuckets
  };
}
