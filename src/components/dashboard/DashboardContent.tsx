'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';

interface Website {
  id: string;
  url: string;
  name: string;
  description: string | null;
  is_active: boolean;
  latest_scan?: {
    id: string;
    status: string;
    created_at: string;
    performance_score?: number;
    accessibility_score?: number;
    seo_score?: number;
    security_score?: number;
  };
}

export default function DashboardContent() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<Website | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { subscription, loading: subscriptionLoading, isPremium } = useSubscription();

  // Helper function to check if a website has a completed scan with metrics
  const hasCompletedScanWithMetrics = (website: Website) => {
    return website.latest_scan && 
           website.latest_scan.status === 'completed' && 
           (website.latest_scan.performance_score !== undefined || 
            website.latest_scan.accessibility_score !== undefined || 
            website.latest_scan.seo_score !== undefined || 
            website.latest_scan.security_score !== undefined);
  };

  const fetchWebsitesData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Use the server-side API endpoint to fetch websites with scans and metrics
      console.log('Fetching dashboard data for user:', session.user.id);
      
      const response = await fetch(`/api/dashboard?userId=${session.user.id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard data');
      }
      
      const { data: websitesData } = await response.json();
      console.log(`Fetched ${websitesData?.length || 0} websites with scans from API`);
      
      if (websitesData && websitesData.length > 0) {
        setWebsites(websitesData);
      } else {
        console.log('No websites found for user:', session.user.id);
        setWebsites([]);
      }
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsitesData();
  }, []);
  
  // Add debug useEffect to log websites state changes
  useEffect(() => {
    if (websites.length > 0) {
      console.log('DEBUG: Websites state after render:', websites.map(website => ({
        id: website.id,
        url: website.url,
        name: website.name,
        has_latest_scan: !!website.latest_scan,
        latest_scan_status: website.latest_scan ? website.latest_scan.status : 'none',
        has_scores: website.latest_scan ? {
          performance: website.latest_scan.performance_score !== undefined,
          accessibility: website.latest_scan.accessibility_score !== undefined,
          seo: website.latest_scan.seo_score !== undefined,
          security: website.latest_scan.security_score !== undefined
        } : 'no scan'
      })));
    }
  }, [websites]);
  
  // Add a function to refresh the data
  const refreshData = () => {
    console.log('Manually refreshing dashboard data');
    fetchWebsitesData();
  };

  const handleScan = (websiteUrl: string) => {
    router.push(`/?url=${encodeURIComponent(websiteUrl)}`);
  };

  const handleViewResults = (scanId: string) => {
    console.log('handleViewResults called with scanId:', scanId);
    
    if (!scanId) {
      console.warn('Invalid scan ID:', scanId);
      return;
    }
    
    try {
      console.log('Using window.location.href for navigation');
      // Use the full URL with origin to ensure proper navigation
      const origin = window.location.origin;
      const fullUrl = `${origin}/dashboard?scan=${encodeURIComponent(scanId)}`;
      console.log('Navigating to:', fullUrl);
      
      // Force a hard navigation to ensure the page reloads with the new URL
      window.location.href = fullUrl;
      
      // Add a small delay to ensure the navigation happens
      setTimeout(() => {
        console.log('Navigation should have happened by now');
        // If we're still here, try again with a different method
        if (window.location.href !== fullUrl) {
          console.log('Navigation failed, trying again with window.location.replace');
          window.location.replace(fullUrl);
        }
      }, 100);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleDeleteClick = (website: Website) => {
    setWebsiteToDelete(website);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setWebsiteToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!websiteToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete the website using a fetch request to a server-side API endpoint
      // This ensures we use the service role key on the server side
      const response = await fetch(`/api/websites/${websiteToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete website');
      }
      
      // Update the local state to remove the deleted website
      setWebsites(websites.filter(w => w.id !== websiteToDelete.id));
      setShowDeleteModal(false);
      setWebsiteToDelete(null);
    } catch (error: any) {
      console.error('Error deleting website:', error);
      setError(`Failed to delete website: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-8 sm:px-0">
        <div className="rounded-lg border-4 border-dashed border-gray-200 p-4 text-center">
          <p className="text-lg text-gray-500">Loading your websites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 sm:px-0">
        <div className="rounded-lg border-4 border-dashed border-red-200 p-4 text-center">
          <p className="text-lg text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (websites.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-0">
        <div className="rounded-lg border-4 border-dashed border-gray-200 p-4 text-center">
          <p className="text-lg text-gray-500">
            Welcome to your dashboard! You don't have any websites to monitor yet.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            Add Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-8 sm:px-0">
      {!isPremium && !subscriptionLoading && (
        <div className="mb-6 rounded-md bg-primary-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-primary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-primary-700">
                You're currently on the free plan. Upgrade to Premium for detailed analysis and AI recommendations.
              </p>
              <p className="mt-3 text-sm md:mt-0 md:ml-6">
                <button
                  onClick={() => router.push('/pricing')}
                  className="whitespace-nowrap font-medium text-primary-700 hover:text-primary-600"
                >
                  Upgrade <span aria-hidden="true">&rarr;</span>
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Your Websites</h2>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={refreshData}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh Data
          </button>
          {isPremium && (
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Manage Subscription
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            Add Website
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {websites.map((website) => (
          <div
            key={website.id}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 truncate">
                {website.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 truncate">{website.url}</p>
              
              {website.latest_scan ? (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Last scanned: {new Date(website.latest_scan.created_at).toLocaleDateString()}
                  </p>
                  
                  {website.latest_scan.status === 'completed' && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {website.latest_scan.performance_score !== undefined && (
                        <div className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">Performance</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(website.latest_scan.performance_score || 0)}
                          </p>
                        </div>
                      )}
                      
                      {website.latest_scan.accessibility_score !== undefined && (
                        <div className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">Accessibility</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(website.latest_scan.accessibility_score || 0)}
                          </p>
                        </div>
                      )}
                      
                      {website.latest_scan.seo_score !== undefined && (
                        <div className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">SEO</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(website.latest_scan.seo_score || 0)}
                          </p>
                        </div>
                      )}
                      
                      {website.latest_scan.security_score !== undefined && (
                        <div className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">Security</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(website.latest_scan.security_score || 0)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {website.latest_scan.status !== 'completed' && (
                    <p className="mt-2 text-sm font-medium text-amber-600">
                      Status: {website.latest_scan.status}
                    </p>
                  )}
                  
                  <div className="mt-4 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => handleScan(website.url)}
                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Scan Again
                    </button>
                    
                    {website.latest_scan.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => {
                          console.log('View Results button clicked for website:', website.url);
                          console.log('Website latest_scan:', website.latest_scan);
                          
                          if (website.latest_scan && website.latest_scan.id) {
                            console.log('Calling handleViewResults with scanId:', website.latest_scan.id);
                            handleViewResults(website.latest_scan.id);
                          } else {
                            console.warn('No valid scan ID found for website:', website.url);
                          }
                        }}
                        className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      >
                        View Results
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(website)}
                      className="inline-flex items-center rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">No scans yet</p>
                  <div className="mt-2 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => handleScan(website.url)}
                      className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                      Scan Now
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(website)}
                      className="inline-flex items-center rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCancelDelete}></div>
          
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Remove Website</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to remove <span className="font-medium">{websiteToDelete?.name}</span>? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
              >
                {isDeleting ? 'Removing...' : 'Remove'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleCancelDelete}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
