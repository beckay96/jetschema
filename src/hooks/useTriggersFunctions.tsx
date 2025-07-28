import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DatabaseFunction {
  id?: string;
  project_id: string;
  name: string;
  description?: string;
  function_type: 'plpgsql' | 'edge' | 'cron';
  parameters: Array<{ name: string; type: string; default?: string }>;
  return_type?: string;
  function_body: string;
  is_edge_function: boolean;
  edge_function_name?: string;
  cron_schedule?: string;
  is_cron_enabled: boolean;
  author_id: string;
}

interface DatabaseTrigger {
  id?: string;
  project_id: string;
  name: string;
  table_name: string;
  trigger_event: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';
  trigger_timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  function_id?: string;
  is_active: boolean;
  conditions?: string;
  author_id: string;
}

export function useTriggersFunctions(projectId?: string) {
  const [functions, setFunctions] = useState<DatabaseFunction[]>([]);
  const [triggers, setTriggers] = useState<DatabaseTrigger[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFunctions = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('database_functions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFunctions((data || []) as unknown as DatabaseFunction[]);
    } catch (error) {
      console.error('Error fetching functions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch functions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTriggers = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('database_triggers')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers((data || []) as unknown as DatabaseTrigger[]);
    } catch (error) {
      console.error('Error fetching triggers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch triggers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFunction = async (functionData: Omit<DatabaseFunction, 'id' | 'author_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('database_functions')
        .insert({
          ...functionData,
          author_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setFunctions(prev => [data as unknown as DatabaseFunction, ...prev]);
      
      // If it's an edge function, create the actual edge function
      if (functionData.is_edge_function && functionData.edge_function_name) {
        await createEdgeFunction(functionData.edge_function_name, functionData.function_body);
      }

      // If it's a CRON function and enabled, set up the CRON job
      if (functionData.function_type === 'cron' && functionData.is_cron_enabled) {
        await setupCronJob(functionData.name, functionData.cron_schedule || '0 0 * * *');
      }

      toast({
        title: "Success",
        description: "Function created successfully"
      });

      return data;
    } catch (error) {
      console.error('Error creating function:', error);
      toast({
        title: "Error",
        description: "Failed to create function",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateFunction = async (id: string, functionData: Partial<DatabaseFunction>) => {
    try {
      const { data, error } = await supabase
        .from('database_functions')
        .update(functionData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFunctions(prev => prev.map(f => f.id === id ? data as unknown as DatabaseFunction : f));
      
      toast({
        title: "Success",
        description: "Function updated successfully"
      });

      return data;
    } catch (error) {
      console.error('Error updating function:', error);
      toast({
        title: "Error",
        description: "Failed to update function",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteFunction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('database_functions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFunctions(prev => prev.filter(f => f.id !== id));
      
      toast({
        title: "Success",
        description: "Function deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting function:', error);
      toast({
        title: "Error",
        description: "Failed to delete function",
        variant: "destructive"
      });
      throw error;
    }
  };

  const createTrigger = async (triggerData: Omit<DatabaseTrigger, 'id' | 'author_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('database_triggers')
        .insert({
          ...triggerData,
          author_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setTriggers(prev => [data as unknown as DatabaseTrigger, ...prev]);
      
      toast({
        title: "Success",
        description: "Trigger created successfully"
      });

      return data;
    } catch (error) {
      console.error('Error creating trigger:', error);
      toast({
        title: "Error",
        description: "Failed to create trigger",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateTrigger = async (id: string, triggerData: Partial<DatabaseTrigger>) => {
    try {
      const { data, error } = await supabase
        .from('database_triggers')
        .update(triggerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTriggers(prev => prev.map(t => t.id === id ? data as unknown as DatabaseTrigger : t));
      
      toast({
        title: "Success",
        description: "Trigger updated successfully"
      });

      return data;
    } catch (error) {
      console.error('Error updating trigger:', error);
      toast({
        title: "Error",
        description: "Failed to update trigger",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteTrigger = async (id: string) => {
    try {
      const { error } = await supabase
        .from('database_triggers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTriggers(prev => prev.filter(t => t.id !== id));
      
      toast({
        title: "Success",
        description: "Trigger deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting trigger:', error);
      toast({
        title: "Error",
        description: "Failed to delete trigger",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Helper function to create edge function (placeholder)
  const createEdgeFunction = async (name: string, code: string) => {
    try {
      // This would need to be implemented via a Supabase edge function
      // that creates the actual edge function file
      console.log('Creating edge function:', name, code);
      
      // TODO: Call edge function creation API
      const response = await supabase.functions.invoke('create-edge-function', {
        body: { name, code }
      });
      
      if (response.error) throw response.error;
    } catch (error) {
      console.error('Error creating edge function:', error);
      // Don't throw here as the database function is already created
    }
  };

  // Helper function to setup CRON job (placeholder)
  const setupCronJob = async (functionName: string, schedule: string) => {
    try {
      // This would call a Supabase function to set up the CRON job
      console.log('Setting up CRON job:', functionName, schedule);
      
      // TODO: Call CRON setup API
      const response = await supabase.functions.invoke('setup-cron-job', {
        body: { functionName, schedule }
      });
      
      if (response.error) throw response.error;
    } catch (error) {
      console.error('Error setting up CRON job:', error);
      // Don't throw here as the database function is already created
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchFunctions();
      fetchTriggers();
    }
  }, [projectId]);

  return {
    functions,
    triggers,
    loading,
    createFunction,
    updateFunction,
    deleteFunction,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    refetch: () => {
      fetchFunctions();
      fetchTriggers();
    }
  };
}