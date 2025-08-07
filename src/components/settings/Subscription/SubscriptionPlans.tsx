import React, { useState, useEffect } from 'react';
import { useStripe } from '@/contexts/StripeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSubscriptionPlans } from '@/api/stripe';
import { toast } from 'sonner';

interface PricingTier {
  name: string;
  description: string;
  price: string;
  priceId: string;
  features: {
    text: string;
    included: boolean;
  }[];
  highlighted?: boolean;
}

// Default pricing tiers used as fallback if API call fails
const defaultPricingTiers: PricingTier[] = [
  {
    name: 'Free',
    description: 'Basic features for individual users',
    price: '$0',
    priceId: 'free',
    features: [
      { text: 'Single database', included: true },
      { text: 'Basic schema editor', included: true },
      { text: 'Export SQL', included: true },
      { text: 'Team collaboration', included: false },
      { text: 'AI-powered features', included: false },
      { text: 'Multiple databases', included: false },
    ],
  },
  {
    name: 'Pro',
    description: 'For professionals and small teams',
    price: '$19/month',
    priceId: 'price_pro',
    highlighted: true,
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Multiple databases', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'AI-powered features', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom branding', included: false },
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large teams and organizations',
    price: '$49/month',
    priceId: 'price_enterprise',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited databases', included: true },
      { text: 'Custom branding', included: true },
      { text: 'Advanced security', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom integrations', included: true },
    ],
  },
];

export function SubscriptionPlans() {
  const { 
    subscriptionTier,
    isSubscribed,
    startSubscription,
    manageSubscription,
    refreshSubscriptionStatus
  } = useStripe();
  
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(defaultPricingTiers);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Fetch subscription plans from the API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const plans = await getSubscriptionPlans();
        
        // Convert API response to PricingTier format
        const formattedPlans: PricingTier[] = plans.map(plan => ({
          name: plan.name,
          description: plan.description,
          price: `$${plan.price}/${plan.interval}`,
          priceId: plan.priceId,
          highlighted: plan.name === 'Pro',
          features: plan.features.map(feature => ({
            text: feature,
            included: true
          }))
        }));
        
        // Add free tier if not included in API response
        if (!formattedPlans.some(plan => plan.name === 'Free')) {
          formattedPlans.unshift(defaultPricingTiers[0]);
        }
        
        setPricingTiers(formattedPlans);
      } catch (error) {
        console.error('Failed to fetch subscription plans:', error);
        toast.error('Failed to load subscription plans. Using default plans.');
        // Fallback to default pricing tiers
        setPricingTiers(defaultPricingTiers);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    try {
      setProcessingPlan(priceId);
      await startSubscription(priceId);
      // The page will be redirected to Stripe by the startSubscription function
    } catch (error) {
      console.error('Failed to start subscription:', error);
      toast.error('Failed to start subscription. Please try again.');
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setProcessingPlan('manage');
      await manageSubscription();
      // The page will be redirected to Stripe by the manageSubscription function
    } catch (error) {
      console.error('Failed to open subscription management:', error);
      toast.error('Failed to open subscription management. Please try again.');
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading subscription plans...</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Select the plan that best fits your needs. Upgrade anytime to unlock more features.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {pricingTiers.map((tier) => {
          const isCurrentPlan = tier.name.toLowerCase() === subscriptionTier;
          const isProcessing = processingPlan === tier.priceId || (isCurrentPlan && processingPlan === 'manage');
          
          return (
            <Card 
              key={tier.name} 
              className={cn(
                "flex flex-col",
                tier.highlighted && "border-primary shadow-lg",
                isCurrentPlan && "bg-primary/5 border-primary"
              )}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{tier.name}</CardTitle>
                  {isCurrentPlan && (
                    <Badge variant="outline" className="bg-primary/20 text-primary">
                      Current Plan
                    </Badge>
                  )}
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-3xl font-bold mb-5">{tier.price}</div>
                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {feature.included ? (
                        <Check className="h-4 w-4 mr-2 text-primary" />
                      ) : (
                        <X className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      <span className={cn(!feature.included && "text-muted-foreground")}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrentPlan ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Manage Subscription'
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={tier.highlighted ? "default" : "outline"}
                    onClick={() => handleSubscribe(tier.priceId)}
                    disabled={isProcessing || (tier.name.toLowerCase() === 'free' && isSubscribed)}
                  >
                    {isProcessing && processingPlan === tier.priceId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      tier.name.toLowerCase() === 'free' ? 'Current Plan' : 'Subscribe'
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
