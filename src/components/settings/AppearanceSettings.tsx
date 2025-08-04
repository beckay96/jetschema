import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { DataType } from '@/types/database';
import { DataTypePill } from '@/components/database/DataTypePill';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RefreshCcw, Save, Plus, Star, Trash, Check, ChevronDown, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { ColorTheme, getUserColorThemes, saveColorTheme, deleteColorTheme, setDefaultColorTheme, getActiveColorTheme } from '@/api/userSettings';

type ColorCategory = 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'json' | 'binary' | 'network' | 'other';

interface TypeColorGroup {
  category: ColorCategory;
  label: string;
  types: DataType[];
}

// This function takes a CSS HSL variable string like "340 100% 65%" and converts to hex
const hslToHex = (hslStr: string): string => {
  const [h, s, l] = hslStr.split(' ').map(val => parseFloat(val));
  const sDecimal = s / 100;
  const lDecimal = l / 100;
  
  const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lDecimal - c / 2;
  
  let r, g, b;
  
  if (0 <= h && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (60 <= h && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (120 <= h && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (180 <= h && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (240 <= h && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
  
  return `#${rHex}${gHex}${bHex}`;
};

// This function converts a hex color to HSL format for CSS variables
const hexToHsl = (hex: string): string => {
  // Remove the # if it exists
  hex = hex.replace('#', '');
  
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
  
  // New theme dialog state
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDescription, setNewThemeDescription] = useState('');
  
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
        colors[type] = hslToHex(cssValue);
      });
      
      setTypeColors(colors);
    };
    
    loadColorValues();
    loadSavedThemes();
  }, [loadSavedThemes]);

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

  // Apply color changes to CSS variables
  const applyColorChanges = (colors: Record<DataType, string>) => {
    Object.entries(colors).forEach(([type, hexColor]) => {
      const cssVarName = `--color-${type.toLowerCase()}`;
      document.documentElement.style.setProperty(cssVarName, hexToHsl(hexColor));
    });
  };

  // Handle color change for a specific type
  const handleColorChange = (type: DataType, newColor: string) => {
    setTypeColors(prev => {
      const updated = { ...prev, [type]: newColor };
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
    // Apply all color changes to CSS variables
    applyColorChanges(typeColors);
    
    // If there's an active theme, update it
    if (activeTheme) {
      try {
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
      } catch (error) {
        console.error('Failed to update theme:', error);
        toast.error('Failed to update theme');
      }
    } else {
      // If no active theme, just save to local storage for now
      localStorage.setItem('jetschema-type-colors', JSON.stringify(typeColors));
      toast.success('Color settings saved temporarily. Save as theme for permanence.');
    }
    
    setHasChanges(false);
  };

  // Reset colors to defaults
  const resetToDefaults = () => {
    const styles = getComputedStyle(document.documentElement);
    const resetColors: Record<DataType, string> = {} as Record<DataType, string>;
    
    // Remove custom colors from local storage
    localStorage.removeItem('jetschema-type-colors');
    
    // Reset all CSS variables to their default values
    document.documentElement.setAttribute('style', '');
    
    // Reset active theme (but don't delete saved themes)
    setActiveTheme(null);
    
    // Reload the page to get fresh CSS variables
    window.location.reload();
  };
  
  // Load a saved theme
  const loadTheme = (theme: ColorTheme) => {
    // Apply the theme colors
    setTypeColors(theme.colors);
    applyColorChanges(theme.colors);
    
    // Update active theme
    setActiveTheme(theme);
    setHasChanges(false);
    
    toast.success(`Theme "${theme.name}" applied`);
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
    </Card>
  );
}
