import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, FolderOpen, Users, User, LogOut, Home, Settings, Sparkles } from 'lucide-react';

interface HeaderMenuProps {
  isSubscribed?: boolean;
}

export function HeaderMenu({ isSubscribed = false }: HeaderMenuProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" />
          Home
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/projects')}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Projects
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/team')}>
          <Users className="h-4 w-4 mr-2" />
          Team
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        
        {isSubscribed ? (
          <DropdownMenuItem onClick={() => navigate('/account')}>
            <User className="h-4 w-4 mr-2" />
            Account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => navigate('/upgrade')} className="text-primary font-medium">
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            Upgrade
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={signOut} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}