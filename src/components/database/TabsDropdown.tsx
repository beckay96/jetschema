import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Database, Table, Settings, Zap, Code } from 'lucide-react';

interface TabsDropdownProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * TabsDropdown component for sidebar navigation
 * 
 * Provides a dropdown menu for selecting between different tabs in the sidebar
 * (Tables, Triggers, Functions, RLS, Indexes)
 */
export function TabsDropdown({ activeTab, onTabChange }: TabsDropdownProps) {
  // Map of tab values to their corresponding icons
  const tabIcons: Record<string, JSX.Element> = {
    tables: <Table className="h-4 w-4" />,
    triggers: <Zap className="h-4 w-4" />,
    functions: <Code className="h-4 w-4" />,
    rls: <Settings className="h-4 w-4" />,
    indexes: <Database className="h-4 w-4" />
  };
  
  // Map of tab values to their display names
  const tabNames: Record<string, string> = {
    tables: "Tables",
    triggers: "Triggers",
    functions: "Functions",
    rls: "RLS",
    indexes: "Indexes"
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center">
            <div className="mr-2">
              {tabIcons[activeTab as keyof typeof tabIcons]}
            </div>
            <span>{tabNames[activeTab as keyof typeof tabNames]}</span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 opacity-50"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        <DropdownMenuItem onSelect={() => onTabChange("tables")}>
          <Table className="h-4 w-4 mr-2" />
          <span>Tables</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onTabChange("triggers")}>
          <Zap className="h-4 w-4 mr-2" />
          <span>Triggers</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onTabChange("functions")}>
          <Code className="h-4 w-4 mr-2" />
          <span>Functions</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onTabChange("rls")}>
          <Settings className="h-4 w-4 mr-2" />
          <span>RLS</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onTabChange("indexes")}>
          <Database className="h-4 w-4 mr-2" />
          <span>Indexes</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
