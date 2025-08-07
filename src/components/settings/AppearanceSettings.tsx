import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { DataType } from '@/types/database';
import { DataTypePill } from '@/components/Settings/DataTypePill';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RefreshCcw, Save, Plus, Star, Trash, Check, ChevronDown, Bookmark, Grid, Table } from 'lucide-react';
import { toast } from 'sonner';
import { ColorTheme, getUserColorThemes, saveColorTheme, deleteColorTheme, setDefaultColorTheme, getActiveColorTheme, getUserDefaultView, setUserDefaultView, DefaultView } from '@/api/userSettings';

type ColorCategory = 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'json' | 'binary' | 'network' | 'other';

interface TypeColorGroup {
  category: ColorCategory;
  label: string;
  types: DataType[];
}

/**
 * Converts an HSL color string to hexadecimal format
 * 
 * Takes a CSS HSL value string like "340 100% 65%" and converts it to hexadecimal color format (#RRGGBB)
 * Handles edge cases and invalid input by providing default values and error handling
 *
 * @param hslStr - The HSL string in format "H S% L%" (e.g., "210 50% 40%")
 * @returns Hexadecimal color string (e.g., "#3366cc")
 */
const hslToHex = (hslStr: string): string => {
  // Default values for r, g, b, and m to fix linting errors
  let r = 0, g = 0, b = 0, m = 0;
  
  try {
    // Clean the string and handle edge cases
    const cleanStr = hslStr.trim();
    if (!cleanStr) return '#000000';
    
    // Parse the HSL values
    const [h, s, l] = cleanStr.split(' ').map(val => {
      const parsed = parseFloat(val.replace('%', ''));
      return isNaN(parsed) ? 0 : parsed;
    });
    
    const sDecimal = Math.min(Math.max(s / 100, 0), 1); // Clamp between 0-1
    const lDecimal = Math.min(Math.max(l / 100, 0), 1); // Clamp between 0-1
    
    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    m = lDecimal - c / 2;
    
    const hue = ((h % 360) + 360) % 360; // Normalize hue to 0-359
    
    if (0 <= hue && hue < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= hue && hue < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= hue && hue < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= hue && hue < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= hue && hue < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
  } catch (error) {
    console.error('Error converting HSL to Hex:', error, hslStr);
    return '#000000';
  }
  
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
  
  return `#${rHex}${gHex}${bHex}`;
};

/**
 * Converts a hexadecimal color string to HSL format for CSS variables
 * 
 * Takes a hex color code (#RRGGBB or #RGB) and converts it to HSL format used by CSS variables.
 * Includes validation, error handling, and support for both 6-digit and 3-digit hex formats.
 *
 * @param hex - The hexadecimal color string (e.g., "#3366cc" or "#36c")
 * @returns HSL string in the format "H S% L%" (e.g., "210 50% 40%")
 */
const hexToHsl = (hex: string): string => {
  try {
    // Validate and normalize the hex color
    if (!hex || typeof hex !== 'string') {
      console.warn('Invalid hex color:', hex);
      return '0 0% 0%';
    }
    
    // Remove the # if it exists
    hex = hex.replace('#', '').trim();
    
    // Handle shorthand hex (e.g., #F00 -> #FF0000)
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.warn('Invalid hex format:', hex);
      return '0 0% 0%';
    }
    
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Find the min and max values of RGB
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Calculate the lightness
    let l = (max + min) / 2;
    
    // If max and min are the same, it's a shade of grey
    if (max === min) {
      return `0 0% ${Math.round(l * 100)}%`;
    }
    
    // Calculate the saturation
    const s = l > 0.5 
      ? (max - min) / (2 - max - min) 
      : (max - min) / (max + min);
    
    // Calculate the hue
    let h;
    if (max === r) {
      h = ((g - b) / (max - min)) % 6;
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }
    
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch (error) {
    console.error('Error converting hex to HSL:', error, hex);
    return '0 0% 0%'; // Default to black
  }
};

// Group data types by category
const typeGroups: TypeColorGroup[] = [
  {
    category: 'string',
    label: 'String Types',
    types: ['VARCHAR', 'TEXT', 'CHAR', 'STRING', 'EMAIL', 'ENUM']
  },
  {
    category: 'number',
    label: 'Number Types',
    types: ['INTEGER', 'INT', 'INT4', 'INT8', 'BIGINT', 'SMALLINT', 'DECIMAL', 'NUMERIC', 'REAL', 'FLOAT', 'DOUBLE PRECISION', 'SERIAL']
  },
  {
    category: 'boolean',
    label: 'Boolean Types',
    types: ['BOOLEAN', 'BOOL']
  },
  {
    category: 'date',
    label: 'Date & Time Types',
    types: ['DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ']
  },
  {
    category: 'uuid',
    label: 'ID Types',
    types: ['UUID']
  },
  {
    category: 'json',
    label: 'JSON Types',
    types: ['JSON', 'JSONB']
  },
  {
    category: 'binary',
    label: 'Binary Types',
    types: ['ARRAY', 'BYTEA']
  },
  {
    category: 'network',
    label: 'Network Types',
    types: ['INET', 'CIDR', 'MACADDR']
  }
];

export function AppearanceSettings() {
  const [typeColors, setTypeColors] = useState<Record<DataType, string>>({} as Record<DataType, string>);
  const [currentTab, setCurrentTab] = useState<ColorCategory>('string');
  const [hasChanges, setHasChanges] = useState(false);
  const [savedThemes, setSavedThemes] = useState<ColorTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<ColorTheme | null>(null);
  const [defaultView, setDefaultView] = useState<DefaultView>('diagram');
  
  // New theme dialog state
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDescription, setNewThemeDescription] = useState('');
  
  // Load user's default view preference
  const loadDefaultView = useCallback(async () => {
    try {
      const view = await getUserDefaultView();
      setDefaultView(view);
    } catch (error) {
      console.error('Failed to load default view preference:', error);
    }
  }, []);
  
  // Save user's default view preference
  const saveDefaultView = async (view: DefaultView) => {
    try {
      console.log('Attempting to save default view:', view);
      await setUserDefaultView(view);
      setDefaultView(view);
      console.log('Default view saved successfully, state updated to:', view);
      toast.success(`Default view preference saved: ${view}`);
    } catch (error) {
      console.error('Failed to save default view preference:', error);
      toast.error(`Failed to save default view preference: ${error.message}`);
    }
  };
  
  // Load saved themes and active theme from database
  const loadSavedThemes = useCallback(async () => {
    try {
      const themes = await getUserColorThemes();
      setSavedThemes(themes);
      
      // Get active theme
      const active = await getActiveColorTheme();
      setActiveTheme(active);
    } catch (error) {
      console.error('Failed to load color themes:', error);
      toast.error('Failed to load saved color themes');
    }
  }, []);
  
  // Load current color values on component mount
  useEffect(() => {
    const loadColorValues = () => {
      const colors: Record<DataType, string> = {} as Record<DataType, string>;
      
      // Get all data types from all groups
      const allTypes: DataType[] = typeGroups.flatMap(group => group.types);
      
      // For each data type, get its current CSS variable value
      allTypes.forEach(type => {
        const cssVarName = `--color-${type.toLowerCase()}`;
        const cssValue = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
        
        if (cssValue) {
          // Convert HSL to hex for the color picker
          colors[type] = hslToHex(cssValue);
        } else {
          // Default color if not set
          colors[type] = '#000000';
        }
      });
      
      setTypeColors(colors);
      setHasChanges(false);
    };
    
    loadColorValues();
    loadSavedThemes();
    loadDefaultView();
  }, [loadSavedThemes, loadDefaultView]);

  // Load colors from local storage if available
  useEffect(() => {
    const savedColors = localStorage.getItem('jetschema-type-colors');
    if (savedColors) {
      try {
        setTypeColors(JSON.parse(savedColors));
        applyColorChanges(JSON.parse(savedColors));
      } catch (e) {
        console.error('Failed to parse saved colors:', e);
      }
    }
  }, []);

  /**
   * Applies the selected color values to CSS custom properties (variables)
   * 
   * Takes a record of data types mapped to their hex color values and sets
   * the corresponding CSS variables for use throughout the application.
   * Includes validation and a forced repaint to ensure immediate visual updates.
   * 
   * @param colors - Record mapping data types to hex color strings
   */
  const applyColorChanges = (colors: Record<DataType, string>) => {
    // Create a style element to apply all color changes at once
    const styleId = 'jetschema-dynamic-colors';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    // Build CSS rules for all colors
    let cssRules = '/* JetSchema dynamic color variables */\n:root {\n';
    
    Object.entries(colors).forEach(([type, hexColor]) => {
      // Ensure we have a valid hex color before conversion
      if (hexColor && hexColor.startsWith('#')) {
        try {
          const hslValue = hexToHsl(hexColor);
          const cssVarName = `--color-${type.toLowerCase().replace(/\s+/g, '-')}`;
          
          // Log for debugging
          console.log(`Applying color: ${type}, HEX: ${hexColor}, HSL: ${hslValue}`);
          
          // Add to our CSS rules
          cssRules += `  ${cssVarName}: ${hslValue};\n`;
          
          // Also apply directly to ensure immediate effect
          document.documentElement.style.setProperty(cssVarName, hslValue);
        } catch (error) {
          console.error(`Error applying color for ${type}:`, error);
        }
      } else {
        console.warn(`Invalid hex color for ${type}: ${hexColor}`);
      }
    });
    
    cssRules += '}\n';
    
    // Apply all rules at once
    styleEl.textContent = cssRules;
    
    // Force a repaint
    const existingTransition = document.body.style.transition;
    document.body.style.transition = 'none';
    document.body.style.backgroundColor = document.body.style.backgroundColor || 'transparent';
    document.body.offsetHeight; // Force reflow
    setTimeout(() => {
      document.body.style.transition = existingTransition;
    }, 50);
  };

  // Handle color change for a specific type
  const handleColorChange = (type: DataType, newColor: string) => {
    setTypeColors(prev => {
      const updated = { ...prev, [type]: newColor };
      
      // Apply change immediately to see preview
      const singleChange = { [type]: newColor } as Record<DataType, string>;
      applyColorChanges(singleChange);
      
      setHasChanges(true);
      return updated;
    });
  };

  // Save current color settings as a new theme
  const saveAsNewTheme = async () => {
    if (!newThemeName.trim()) {
      toast.error('Please enter a theme name');
      return;
    }
    
    try {
      const theme: ColorTheme = {
        name: newThemeName.trim(),
        description: newThemeDescription.trim() || undefined,
        colors: { ...typeColors },
        isDefault: savedThemes.length === 0, // Make it default if it's the first one
      };
      
      const savedTheme = await saveColorTheme(theme);
      
      // Update local state
      setSavedThemes(prev => [...prev, savedTheme]);
      setActiveTheme(savedTheme);
      
      // Apply changes
      applyColorChanges(typeColors);
      
      // Reset form
      setNewThemeName('');
      setNewThemeDescription('');
      setIsThemeDialogOpen(false);
      setHasChanges(false);
      
      toast.success(`Theme "${savedTheme.name}" saved successfully`);
      
      // Refresh themes
      loadSavedThemes();
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast.error('Failed to save theme');
    }
  };
  
  // Save all color changes
  const saveColorChanges = async () => {
    try {
      // Apply all color changes to CSS variables immediately
      applyColorChanges(typeColors);
      
      // Always save to localStorage for immediate persistence
      localStorage.setItem('jetschema-type-colors', JSON.stringify(typeColors));
      
      // If there's an active theme, update it in database/storage
      if (activeTheme) {
        const updatedTheme: ColorTheme = {
          ...activeTheme,
          colors: { ...typeColors },
          updatedAt: new Date()
        };
        
        await saveColorTheme(updatedTheme);
        setActiveTheme(updatedTheme);
        
        // Update in saved themes list
        setSavedThemes(prev => 
          prev.map(t => t.id === updatedTheme.id ? updatedTheme : t)
        );
        
        toast.success(`Theme "${updatedTheme.name}" updated successfully`);
        console.log('Theme updated with colors:', typeColors);
      } else {
        toast.success('Color settings saved');
        console.log('Colors saved without theme:', typeColors);
      }
      
      // Force reapplication of colors to ensure they take effect
      setTimeout(() => {
        applyColorChanges(typeColors);
        document.body.style.transition = 'background-color 0.1s';
        document.body.style.backgroundColor = document.body.style.backgroundColor || 'transparent';
        setTimeout(() => {
          document.body.style.transition = '';
        }, 100);
      }, 50);
      
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save color changes:', error);
      toast.error('Failed to save color changes. Please try again.');
    }
  };

  // Reset colors to defaults
  const resetToDefaults = () => {
    try {
      // Remove custom colors from local storage
      localStorage.removeItem('jetschema-type-colors');
      
      // Reset all CSS variables to their default values
      document.documentElement.setAttribute('style', '');
      
      // Reset active theme (but don't delete saved themes)
      setActiveTheme(null);
      setHasChanges(false);
      
      // Reload the page to get fresh CSS variables
      toast.success('Color settings reset to defaults');
      console.log('Color settings reset to defaults');
      
      // Force reload after toast is shown
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to reset colors:', error);
      toast.error('Failed to reset colors. Please try again.');
    }
  };
  
  // Load a saved theme
  const loadTheme = (theme: ColorTheme) => {
    try {
      if (!theme || !theme.colors) {
        toast.error('Invalid theme data');
        return;
      }

      console.log('Loading theme:', theme.name, theme.colors);
      
      // Apply the theme colors
      setTypeColors(theme.colors);
      applyColorChanges(theme.colors);
      
      // Save to localStorage for persistence
      localStorage.setItem('jetschema-type-colors', JSON.stringify(theme.colors));
      
      // Update active theme
      setActiveTheme(theme);
      setHasChanges(false);
      
      // Force reapplication of colors after a small delay to ensure they take effect
      setTimeout(() => {
        applyColorChanges(theme.colors);
        console.log('Theme colors reapplied');
      }, 100);
      
      toast.success(`Theme "${theme.name}" applied`);
    } catch (error) {
      console.error('Failed to load theme:', error);
      toast.error('Failed to load theme. Please try again.');
    }
  };
  
  // Set a theme as default
  const handleSetDefaultTheme = async (theme: ColorTheme) => {
    try {
      await setDefaultColorTheme(theme.id!);
      toast.success(`"${theme.name}" set as default theme`);
      loadSavedThemes(); // Refresh themes list
    } catch (error) {
      console.error('Failed to set default theme:', error);
      toast.error('Failed to set default theme');
    }
  };
  
  // Delete a saved theme
  const handleDeleteTheme = async (themeId: string) => {
    try {
      await deleteColorTheme(themeId);
      
      // Update local state
      setSavedThemes(prev => prev.filter(t => t.id !== themeId));
      
      // If active theme was deleted, set to null
      if (activeTheme && activeTheme.id === themeId) {
        setActiveTheme(null);
      }
      
      toast.success('Theme deleted successfully');
      
      // Refresh themes
      loadSavedThemes();
    } catch (error) {
      console.error('Failed to delete theme:', error);
      toast.error('Failed to delete theme');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Field Type Colors</CardTitle>
            <CardDescription>
              Customize the colors for different field data types used in your database diagrams
            </CardDescription>
          </div>
          {activeTheme && (
            <div className="flex items-center space-x-1 bg-muted/50 px-3 py-1.5 rounded-md">
              <span className="text-xs font-medium">Current Theme:</span>
              <span className="text-xs">{activeTheme.name}</span>
              {activeTheme.isDefault && (
                <Star className="h-3 w-3 text-amber-500 ml-1" fill="currentColor" />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-1">
                  <Bookmark className="h-4 w-4" />
                  Saved Themes
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {savedThemes.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No saved themes
                  </div>
                ) : (
                  savedThemes.map(theme => (
                    <DropdownMenuItem 
                      key={theme.id} 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => loadTheme(theme)}
                    >
                      <div className="flex items-center">
                        <span>{theme.name}</span>
                        {theme.isDefault && <Star className="h-3 w-3 text-amber-500 ml-1" fill="currentColor" />}
                      </div>
                      <div className="flex gap-0.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleSetDefaultTheme(theme);
                          }}
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleDeleteTheme(theme.id!);
                          }}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetToDefaults}
              className="gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            
            <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Save as New Theme
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Current Colors as Theme</DialogTitle>
                  <DialogDescription>
                    Save your color settings as a theme to use in other projects.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme-name">Theme Name</Label>
                    <Input 
                      id="theme-name" 
                      placeholder="My Custom Theme"
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="theme-description">Description (Optional)</Label>
                    <Textarea
                      id="theme-description"
                      placeholder="A brief description of this theme"
                      value={newThemeDescription}
                      onChange={(e) => setNewThemeDescription(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsThemeDialogOpen(false)}>Cancel</Button>
                  <Button onClick={saveAsNewTheme}>Save Theme</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={saveColorChanges}
              disabled={!hasChanges || !activeTheme}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {activeTheme ? 'Update Theme' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Tabs 
          value={currentTab} 
          onValueChange={(value) => setCurrentTab(value as ColorCategory)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="string">String</TabsTrigger>
            <TabsTrigger value="number">Number</TabsTrigger>
            <TabsTrigger value="date">Date/Time</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="string" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {typeGroups
                .filter(group => group.category === 'string')
                .map(group => (
                  <div key={group.category} className="space-y-4">
                    <h3 className="font-medium text-sm">{group.label}</h3>
                    {group.types.map(type => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DataTypePill type={type} />
                          <Label>{type}</Label>
                        </div>
                        <input
                          type="color"
                          value={typeColors[type] || '#000000'}
                          onChange={(e) => handleColorChange(type, e.target.value)}
                          className="h-8 w-16 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="number" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {typeGroups
                .filter(group => group.category === 'number')
                .map(group => (
                  <div key={group.category} className="space-y-4">
                    <h3 className="font-medium text-sm">{group.label}</h3>
                    {group.types.map(type => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DataTypePill type={type} />
                          <Label>{type}</Label>
                        </div>
                        <input
                          type="color"
                          value={typeColors[type] || '#000000'}
                          onChange={(e) => handleColorChange(type, e.target.value)}
                          className="h-8 w-16 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="date" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {typeGroups
                .filter(group => group.category === 'date')
                .map(group => (
                  <div key={group.category} className="space-y-4">
                    <h3 className="font-medium text-sm">{group.label}</h3>
                    {group.types.map(type => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DataTypePill type={type} />
                          <Label>{type}</Label>
                        </div>
                        <input
                          type="color"
                          value={typeColors[type] || '#000000'}
                          onChange={(e) => handleColorChange(type, e.target.value)}
                          className="h-8 w-16 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {typeGroups
                .filter(group => ['boolean', 'uuid', 'json', 'binary', 'network'].includes(group.category))
                .map(group => (
                  <div key={group.category} className="space-y-4">
                    <h3 className="font-medium text-sm">{group.label}</h3>
                    {group.types.map(type => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DataTypePill type={type} />
                          <Label>{type}</Label>
                        </div>
                        <input
                          type="color"
                          value={typeColors[type] || '#000000'}
                          onChange={(e) => handleColorChange(type, e.target.value)}
                          className="h-8 w-16 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <div className="flex flex-col space-y-4 w-full">
          <div>
            <h3 className="text-lg font-medium">Default View Preference</h3>
            <p className="text-sm text-muted-foreground">
              Choose your preferred default view when opening projects
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant={defaultView === 'diagram' ? 'default' : 'outline'}
              className="flex-1 justify-start gap-2"
              onClick={() => saveDefaultView('diagram')}
            >
              <Grid className="h-4 w-4" />
              Diagram View
            </Button>
            <Button
              variant={defaultView === 'table' ? 'default' : 'outline'}
              className="flex-1 justify-start gap-2"
              onClick={() => saveDefaultView('table')}
            >
              <Table className="h-4 w-4" />
              Table View
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
