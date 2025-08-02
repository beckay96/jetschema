import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment variables
// Using Vite's import.meta.env instead of process.env
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key';

// Define subscription tiers
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface StripeContextType {
  stripe: Stripe | null;
  isLoading: boolean;
  subscriptionTier: SubscriptionTier;
  isSubscribed: boolean;
  canUseMultipleDBs: boolean;
  canUseAIFeatures: boolean;
  startSubscription: (priceId: string) => Promise<void>;
  manageSubscription: () => Promise<void>;
  checkoutSession: (priceId: string) => Promise<{ sessionId: string }>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripeInstance = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        setStripe(stripeInstance);
        
        // Fetch the user's subscription status from the backend
        await fetchSubscriptionStatus();
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStripe();
  }, []);
  
  // Function to fetch subscription status from backend
  const fetchSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      
      // Always use a local fallback if API_BASE_URL is not properly set
      const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
      const authToken = localStorage.getItem('authToken');
      
      // Check if we're in development mode or if required config is missing
      const isDev = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';
      const hasStripeConfig = STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY !== 'pk_test_your_stripe_publishable_key';
      
      // Use localStorage or default values if in dev mode or missing config
      if (isDev || !hasStripeConfig || !API_BASE_URL || !authToken) {
        console.log('Using local subscription data (development mode or missing config)');
        // Check if we have saved subscription info
        const savedTier = localStorage.getItem('subscriptionTier') || 'free';
        setSubscriptionTier(savedTier as SubscriptionTier);
        return;
      }
      
      // Only attempt API call in production with proper config
      try {
        // Use the API from the Stripe.ts file
        const { checkSubscriptionStatus } = await import('@/api/stripe');
        const result = await checkSubscriptionStatus();
        
        // Map the tier from the API to our subscription tier
        setSubscriptionTier(result.tier);
        console.log('Subscription status loaded successfully:', result);
      } catch (apiError) {
        console.error('API error when loading subscription status:', apiError);
        // Don't show error toast to user, just fall back to free tier
        setSubscriptionTier('free');
      }
    } catch (error) {
      console.error('Error in fetchSubscriptionStatus:', error);
      setSubscriptionTier('free'); // Default to free tier on error
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has an active subscription
  const isSubscribed = subscriptionTier !== 'free';
  
  // Define feature flags based on subscription tier
  const canUseMultipleDBs = isSubscribed;
  const canUseAIFeatures = subscriptionTier === 'enterprise' || subscriptionTier === 'pro';

  // Start a subscription flow
  const startSubscription = async (priceId: string) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (error) {
          console.error('Error redirecting to checkout:', error);
          throw new Error(error.message);
        }
      }
    } catch (error) {
      console.error('Error starting subscription:', error);
      throw error;
    }
  };

  // Open the customer portal to manage subscription
  const manageSubscription = async () => {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  // Create a checkout session
  const checkoutSession = async (priceId: string) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  return (
    <StripeContext.Provider
      value={{
        stripe,
        isLoading,
        subscriptionTier,
        isSubscribed,
        canUseMultipleDBs,
        canUseAIFeatures,
        startSubscription,
        manageSubscription,
        checkoutSession,
        refreshSubscriptionStatus: fetchSubscriptionStatus,
      }}
    >
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = (): StripeContextType => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};
