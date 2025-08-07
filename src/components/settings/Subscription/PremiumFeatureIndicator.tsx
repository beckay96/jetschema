import React from 'react';
import { useStripe } from '@/contexts/StripeContext';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SubscriptionPlans } from './SubscriptionPlans';

interface PremiumFeatureIndicatorProps {
  feature: 'multidb' | 'ai';
  children: React.ReactNode;
  showLock?: boolean;
}

export function PremiumFeatureIndicator({
  feature,
  children,
  showLock = true,
}: PremiumFeatureIndicatorProps) {
  const { canUseMultipleDBs, canUseAIFeatures, isSubscribed } = useStripe();
  
  // Check if the user has access to this feature
  const hasAccess = feature === 'multidb' ? canUseMultipleDBs : canUseAIFeatures;
  
  // If they have access, just render the children
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Otherwise, render a locked version with upgrade option
  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative group">
              <div className="opacity-50 pointer-events-none">
                {children}
              </div>
              {showLock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Upgrade
                    </Button>
                  </DialogTrigger>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>
              {feature === 'multidb'
                ? 'Multiple databases require a premium subscription'
                : 'AI features require a premium subscription'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upgrade to Premium</DialogTitle>
          <DialogDescription>
            {feature === 'multidb'
              ? 'Unlock the ability to create and manage multiple databases with a premium subscription.'
              : 'Unlock AI-powered features to enhance your database design with a premium subscription.'}
          </DialogDescription>
        </DialogHeader>
        
        <SubscriptionPlans />
      </DialogContent>
    </Dialog>
  );
}
