import { DataType } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

// Define the color theme interface
export interface ColorTheme {
  id?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  colors: Record<DataType, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the default view preference type
export type DefaultView = 'diagram' | 'table';

// Mock API for now - in a real implementation, this would connect to your backend
const API_ENDPOINT = '/api/user/settings';

// Get all saved color themes for the current user
export async function getUserColorThemes(): Promise<ColorTheme[]> {
  try {
    // In a real implementation, this would be a fetch call to your API
    // return await fetch(`${API_ENDPOINT}/color-themes`).then(res => res.json());
    
    // For now, we'll get from localStorage as fallback
    const storedThemes = localStorage.getItem('jetschema-color-themes');
    if (storedThemes) {
      return JSON.parse(storedThemes);
    }
    return [];
  } catch (error) {
    console.error('Failed to get user color themes:', error);
    return [];
  }
}

// Save a new color theme or update an existing one
export async function saveColorTheme(theme: ColorTheme): Promise<ColorTheme> {
  try {
    // In a real implementation, this would be a fetch POST/PUT call to your API
    // const method = theme.id ? 'PUT' : 'POST';
    // return await fetch(`${API_ENDPOINT}/color-themes${theme.id ? `/${theme.id}` : ''}`, {
    //   method,
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(theme)
    // }).then(res => res.json());
    
    // For now, we'll save to localStorage as fallback
    const storedThemes = localStorage.getItem('jetschema-color-themes');
    let themes: ColorTheme[] = storedThemes ? JSON.parse(storedThemes) : [];
    
    if (theme.id) {
      // Update existing theme
      themes = themes.map(t => t.id === theme.id ? { 
        ...theme, 
        updatedAt: new Date() 
      } : t);
    } else {
      // Create new theme
      const newTheme: ColorTheme = {
        ...theme,
        id: `theme-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      themes.push(newTheme);
      theme = newTheme;
    }
    
    localStorage.setItem('jetschema-color-themes', JSON.stringify(themes));
    return theme;
  } catch (error) {
    console.error('Failed to save color theme:', error);
    throw new Error('Failed to save color theme');
  }
}

// Delete a color theme
export async function deleteColorTheme(themeId: string): Promise<void> {
  try {
    // In a real implementation, this would be a fetch DELETE call to your API
    // return await fetch(`${API_ENDPOINT}/color-themes/${themeId}`, {
    //   method: 'DELETE'
    // }).then(res => res.json());
    
    // For now, we'll remove from localStorage as fallback
    const storedThemes = localStorage.getItem('jetschema-color-themes');
    if (storedThemes) {
      const themes: ColorTheme[] = JSON.parse(storedThemes);
      const filteredThemes = themes.filter(t => t.id !== themeId);
      localStorage.setItem('jetschema-color-themes', JSON.stringify(filteredThemes));
    }
  } catch (error) {
    console.error('Failed to delete color theme:', error);
    throw new Error('Failed to delete color theme');
  }
}

// Set a theme as the default
export async function setDefaultColorTheme(themeId: string): Promise<void> {
  try {
    // In a real implementation, this would be a fetch PATCH call to your API
    // return await fetch(`${API_ENDPOINT}/color-themes/${themeId}/set-default`, {
    //   method: 'PATCH'
    // }).then(res => res.json());
    
    // For now, we'll update localStorage as fallback
    const storedThemes = localStorage.getItem('jetschema-color-themes');
    if (storedThemes) {
      const themes: ColorTheme[] = JSON.parse(storedThemes);
      const updatedThemes = themes.map(t => ({
        ...t,
        isDefault: t.id === themeId
      }));
      localStorage.setItem('jetschema-color-themes', JSON.stringify(updatedThemes));
    }
  } catch (error) {
    console.error('Failed to set default color theme:', error);
    throw new Error('Failed to set default color theme');
  }
}

// Get current active theme (the default one or the first if no default)
export async function getActiveColorTheme(): Promise<ColorTheme | null> {
  try {
    const themes = await getUserColorThemes();
    if (themes.length === 0) return null;
    
    return themes.find(t => t.isDefault) || themes[0];
  } catch (error) {
    console.error('Failed to get active color theme:', error);
    return null;
  }
}

// Get user's default view preference
export async function getUserDefaultView(): Promise<DefaultView> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No authenticated user found when getting default view');
      // Check localStorage fallback
      const fallback = localStorage.getItem('jetschema-default-view') as DefaultView;
      return fallback === 'table' ? 'table' : 'diagram';
    }
    
    console.log('Getting default view for user:', user.id);
    
    // Check if the default_view column exists by trying to select it first
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('default_view')
      .limit(1);
    
    if (testError && testError.message.includes('default_view')) {
      console.warn('default_view column does not exist, using localStorage fallback');
      const fallback = localStorage.getItem('jetschema-default-view') as DefaultView;
      return fallback === 'table' ? 'table' : 'diagram';
    }
    
    // Try both id and user_id fields to handle potential schema differences
    let { data, error } = await supabase
      .from('profiles')
      .select('default_view, id, user_id')
      .eq('user_id', user.id)
      .single();
    
    // If no result with user_id, try with id field
    if (error || !data) {
      console.log('Trying with id field instead of user_id');
      const result = await supabase
        .from('profiles')
        .select('default_view, id, user_id')
        .eq('id', user.id)
        .single();
      data = result.data;
      error = result.error;
    }
    
    if (error) {
      console.error('Supabase query error:', error);
      console.log('Available profile data:', data);
      // Fallback to localStorage
      const fallback = localStorage.getItem('jetschema-default-view') as DefaultView;
      return fallback === 'table' ? 'table' : 'diagram';
    }
    
    // Log result for debugging
    console.log('Profile found:', data);
    console.log('Default view preference found:', data?.default_view);
    
    // Return the user's preference or default to 'diagram'
    return (data?.default_view as DefaultView) === 'table' ? 'table' : 'diagram';
  } catch (error) {
    console.error('Failed to get user default view:', error);
    // Fallback to localStorage
    const fallback = localStorage.getItem('jetschema-default-view') as DefaultView;
    return fallback === 'table' ? 'table' : 'diagram';
  }
}

// Set user's default view preference
export async function setUserDefaultView(view: DefaultView): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    console.log('Setting default view to:', view, 'for user:', user.id);
    
    // Check if the default_view column exists by trying to select it first
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('default_view')
      .limit(1);
    
    if (testError && testError.message.includes('default_view')) {
      console.error('MIGRATION REQUIRED: default_view column does not exist in profiles table');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_view TEXT CHECK (default_view IN (\'diagram\', \'table\')) DEFAULT \'diagram\';');
      
      // Store in localStorage as fallback
      localStorage.setItem('jetschema-default-view', view);
      console.log('Stored default view in localStorage as fallback:', view);
      return;
    }
    
    // First, check if profile exists and get the correct field to update
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .single();
    
    if (profileError) {
      console.error('Profile lookup error:', profileError);
      // Fallback to localStorage
      localStorage.setItem('jetschema-default-view', view);
      console.log('Stored default view in localStorage as fallback:', view);
      return;
    }
    
    console.log('Found profile:', profileData);
    
    // Determine which field to use for the update
    const updateField = profileData.user_id === user.id ? 'user_id' : 'id';
    const updateValue = profileData.user_id === user.id ? user.id : user.id;
    
    console.log(`Updating profile using ${updateField} = ${updateValue}`);
    
    // Update the user's profile with the new view preference
    const { error } = await supabase
      .from('profiles')
      .update({ default_view: view })
      .eq(updateField, updateValue);
    
    if (error) {
      console.error('Supabase update error:', error);
      // Fallback to localStorage
      localStorage.setItem('jetschema-default-view', view);
      console.log('Stored default view in localStorage as fallback:', view);
      return;
    }
    
    console.log('Default view updated successfully to:', view);
  } catch (error) {
    console.error('Failed to set user default view:', error);
    // Fallback to localStorage
    localStorage.setItem('jetschema-default-view', view);
    console.log('Stored default view in localStorage as fallback:', view);
  }
}
