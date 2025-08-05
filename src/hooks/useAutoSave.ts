import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { toast } from '@/components/ui/use-toast';

// Define the DatabaseSchema interface
export interface DatabaseSchema {
  tables: any[];
  triggers: any[];
  functions: any[];
  comments: any[];
  tasks: any[];
  mockups: any[];
  validationErrors: any[];
}

interface AutoSaveOptions {
  debounceMs?: number;
  onSave?: (data: DatabaseSchema) => Promise<void> | void;
  onRecover?: (data: DatabaseSchema) => void;
  projectId: string;
}

export function useAutoSave<T extends DatabaseSchema>(
  initialData: T,
  options: AutoSaveOptions
) {
  const { debounceMs = 1000, onSave, onRecover, projectId } = options;
  const [data, setData] = useState<T>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [debouncedData] = useDebounce(data, debounceMs);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`jetschema_autosave_${projectId}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as { data: T; timestamp: string };
        
        // Check if we should recover the auto-saved data
        const shouldRecover = window.confirm(
          'We found unsaved changes from your last session. Would you like to recover them?'
        );
        
        if (shouldRecover && onRecover) {
          onRecover(parsedData.data);
          setData(parsedData.data);
          setLastSaved(new Date(parsedData.timestamp));
          toast({
            title: 'Changes recovered',
            description: 'Your unsaved changes have been recovered.',
          });
        } else {
          // Clear the auto-save if user doesn't want to recover
          localStorage.removeItem(`jetschema_autosave_${projectId}`);
        }
      } catch (error) {
        console.error('Failed to parse auto-saved data:', error);
        localStorage.removeItem(`jetschema_autosave_${projectId}`);
      }
    }

    // Set up beforeunload handler
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, projectId, onRecover]);

  // Auto-save when data changes
  useEffect(() => {
    if (!debouncedData || !hasUnsavedChanges) return;

    const save = async () => {
      try {
        setIsSaving(true);
        
        // Call the provided save handler if available
        if (onSave) {
          await onSave(debouncedData);
        }
        
        // Save to localStorage as backup
        const timestamp = new Date().toISOString();
        localStorage.setItem(
          `jetschema_autosave_${projectId}`,
          JSON.stringify({ data: debouncedData, timestamp })
        );
        
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Failed to auto-save:', error);
        toast({
          title: 'Auto-save failed',
          description: 'Could not save your changes. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedData, hasUnsavedChanges, onSave, projectId]);

  // Update data and mark as changed
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setData(prev => {
      if (typeof newData === 'function') {
        const updateFn = newData as (prev: T) => T;
        return updateFn(prev);
      }
      return newData;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Clear auto-saved data (call this when saving to server)
  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(`jetschema_autosave_${projectId}`);
    setHasUnsavedChanges(false);
  }, [projectId]);

  return {
    data,
    updateData,
    hasUnsavedChanges,
    isSaving,
    lastSaved,
    clearAutoSave,
  };
}

export default useAutoSave;
