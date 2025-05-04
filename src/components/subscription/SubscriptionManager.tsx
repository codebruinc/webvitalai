'use client';

import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionManager() {
  const { 
    subscription, 
    loading, 
    error, 
    isPremium, 
    createCheckoutSession, 
    createCustomerPortalSession 
  } = useSubscription();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading subscription information</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Subscription</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage your WebVital AI subscription
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-start sm:justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              {isPremium ? 'Premium Plan' : 'Free Plan'}
            </h4>
            
            {isPremium && (
              <div className="mt-2 text-sm text-gray-500">
                <p>Status: <span className="font-medium capitalize">{subscription.status}</span></p>
                <p>Renewal Date: <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span></p>
                {subscription.cancelAtPeriodEnd && (
                  <p className="text-amber-600 font-medium mt-2">
                    Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-5 text-sm">
              <p className="font-medium text-primary-600">
                {isPremium 
                  ? 'You have access to all premium features' 
                  : 'Upgrade to premium for detailed analysis and AI recommendations'}
              </p>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0 sm:flex sm:items-center">
            {isPremium ? (
              <button
                type="button"
                onClick={createCustomerPortalSession}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Manage Subscription
              </button>
            ) : (
              <button
                type="button"
                onClick={createCheckoutSession}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
        <div className="text-sm">
          <a href="/pricing" className="font-medium text-primary-600 hover:text-primary-500">
            View all pricing plans <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}