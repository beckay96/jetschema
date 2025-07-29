import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-background/50 hover:bg-accent/20 transition-all duration-200 opacity-80 hover:opacity-100 border border-border/20 shadow-sm hover:shadow-md active:scale-95"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-foreground/80" />
      ) : (
        <Sun className="h-4 w-4 text-foreground/80" />
      )}
    </button>
  );
};
