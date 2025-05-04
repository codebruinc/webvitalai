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
  const router = useRouter();
  const { subscription, loading: subscriptionLoading, isPremium } = useSubscription();

  useEffect(() => {
    async function fetchWebsites() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // Get websites for the current user
        const { data: websitesData, error: websitesError } = await supabase
          .from('websites')
          .select('id, url, name, description, is_active')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (websitesError) {
          throw new Error(websitesError.message);
        }

        // Get the latest scan for each website
        const websitesWithScans = await Promise.all(
          (websitesData || []).map(async (website) => {
            const { data: scanData, error: scanError } = await supabase
              .from('scans')
              .select('id, status, created_at')
              .eq('website_id', website.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (scanError && scanError.code !== 'PGRST116') {
              console.error(`Error fetching scan for website ${website.id}:`, scanError);
            }

            let latestScan = scanData ? {
              id: scanData.id,
              status: scanData.status,
              created_at: scanData.created_at,
              performance_score: undefined as number | undefined,
              accessibility_score: undefined as number | undefined,
              seo_score: undefined as number | undefined,
              security_score: undefined as number | undefined,
            } : undefined;

            // If there's a scan, get the scores
            if (latestScan && latestScan.status === 'completed') {
              const { data: metricsData, error: metricsError } = await supabase
                .from('metrics')
                .select('name, value')
                .eq('scan_id', latestScan.id)
                .in('name', ['Performance Score', 'Accessibility Score', 'SEO Score', 'Security Score']);

              if (metricsError) {
                console.error(`Error fetching metrics for scan ${latestScan.id}:`, metricsError);
              } else if (metricsData) {
                metricsData.forEach(metric => {
                  if (metric.name === 'Performance Score') {
                    latestScan!.performance_score = metric.value;
                  } else if (metric.name === 'Accessibility Score') {
                    latestScan!.accessibility_score = metric.value;
                  } else if (metric.name === 'SEO Score') {
                    latestScan!.seo_score = metric.value;
                  } else if (metric.name === 'Security Score') {
                    latestScan!.security_score = metric.value;
                  }
                });
              }
            }

            return {
              ...website,
              latest_scan: latestScan,
            };
          })
        );

        setWebsites(websitesWithScans);
        setIsLoading(false);
      } catch (error: any) {
        setError(error.message);
        setIsLoading(false);
      }
    }

    fetchWebsites();
  }, [router]);

  const handleScan = (websiteUrl: string) => {
    router.push(`/?url=${encodeURIComponent(websiteUrl)}`);
  };

  const handleViewResults = (scanId: string) => {
    router.push(`/dashboard?scan=${scanId}`);
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
                  
                  {website.latest_scan.status === 'completed' ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {website.latest_scan.performance_score !== undefined && (
                        <div className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">Performance</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(website.latest_scan.performance_score)}
                          </p>
                        </div>
                      )}
                      
                      {website.latest_scan.accessibility_score !== undefined && (
                        <div className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">Accessibility</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(website.latest_scan.accessibility_score)}
                          </p>
                        </div>
                      )}
                      
                      {website.latest_scan.seo_score !== undefined && (
                        <div className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">SEO</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(website.latest_scan.seo_score)}
                          </p>
                        </div>
                      )}
                      
                      {website.latest_scan.security_score !== undefined && (
                        <div className="rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">Security</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(website.latest_scan.security_score)}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
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
                        onClick={() => handleViewResults(website.latest_scan!.id)}
                        className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">No scans yet</p>
                  <button
                    type="button"
                    onClick={() => handleScan(website.url)}
                    className="mt-2 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    Scan Now
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}