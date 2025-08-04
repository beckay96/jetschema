import { DataType } from '@/types/database';

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
