import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { useStripe } from '@/contexts/StripeContext';
import { Database, Settings, Home, Sparkles } from 'lucide-react';

export function MainNavigation() {
  const { isSubscribed } = useStripe();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            <span className="font-bold">JetSchema</span>
          </Link>
        </div>
        
        <div className="flex-1" />
        
        <nav className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          
          {isSubscribed && (
            <Link to="/ai-features">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                AI Tools
              </Button>
            </Link>
          )}
          
          <Link to="/settings">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          
          <SubscriptionStatus />
        </nav>
      </div>
    </header>
  );
}
