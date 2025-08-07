import React from 'react';
import { useStripe } from '@/contexts/StripeContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SubscriptionPlans } from './SubscriptionPlans';
import { Sparkles, Zap, Settings } from 'lucide-react';

export function SubscriptionStatus() {
  const { 
    subscriptionTier, 
    isSubscribed, 
    manageSubscription,
    canUseMultipleDBs,
    canUseAIFeatures
  } = useStripe();

  return (
    <div className="flex items-center gap-2">
      {isSubscribed ? (
        <>
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 gap-1.5">
            <Sparkles className="h-3 w-3" />
            {subscriptionTier === 'pro' ? 'Pro' : 'Enterprise'}
          </Badge>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs gap-1 h-7"
            onClick={() => manageSubscription()}
          >
            <Settings className="h-3 w-3" />
            Manage
          </Button>
        </>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs gap-1 h-7">
              <Zap className="h-3 w-3" />
              Upgrade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Upgrade to Premium</DialogTitle>
              <DialogDescription>
                Unlock premium features like multiple databases and AI-powered tools.
              </DialogDescription>
            </DialogHeader>
            <SubscriptionPlans />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
