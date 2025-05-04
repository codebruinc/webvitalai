'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface SubscriptionStatus {
  isSubscribed: boolean;
  plan: string;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    isSubscribed: false,
    plan: 'free',
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: null,
  });

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/status');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscription status');
      }
      
      const data = await response.json();
      setSubscription(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create checkout session
  const createCheckoutSession = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating checkout session:', err);
      setLoading(false);
    }
  };

  // Create customer portal session
  const createCustomerPortalSession = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer portal session');
      }
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating customer portal session:', err);
      setLoading(false);
    }
  };

  // Fetch subscription status on mount and when user changes
  useEffect(() => {
    fetchSubscriptionStatus();
  }, [isAuthenticated]);

  return {
    subscription,
    loading,
    error,
    isPremium: subscription.isSubscribed && subscription.plan === 'premium',
    createCheckoutSession,
    createCustomerPortalSession,
    refreshSubscription: fetchSubscriptionStatus,
  };
}