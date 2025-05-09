'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ScanResults from '@/components/dashboard/ScanResults';
import { useSubscription } from '@/hooks/useSubscription';

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const { isPremium } = useSubscription();

  useEffect(() => {
    async function fetchData() {
      // Get the logged-in user from the session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      // Enhanced logging for session data
      console.log('Session data:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
        aud: session?.user?.aud,
        role: session?.user?.role
      });
      
      // If no user is logged in, show the login prompt
      if (!session?.user) {
        console.log('No user logged in - showing login prompt');
        setLoading(false);
        return;
      }
      
      const userId = session.user.id;
      console.log('Fetching scans for logged-in user:', userId);
      
      try {
        // Use the server-side API endpoint to fetch scans
        // This will use the service role key on the server
        const response = await fetch(`/api/reports?userId=${userId}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch scan data');
        }
        
        const { data: scansData } = await response.json();
        console.log(`Fetched ${scansData?.length || 0} scans from API`);
        
        if (scansData && scansData.length > 0) {
          setScans(scansData);
        } else {
          console.log('No scans found for user:', userId);
          setScans([]);
        }
      } catch (error: any) {
        console.error('Error fetching scan data:', error);
        setScans([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Function to fetch scan results
  const fetchScanResults = async (scanId: string) => {
    try {
      setLoadingResults(true);
      setResultsError(null);
      
      console.log(`Fetching scan results for scan ID: ${scanId}`);
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/scan/results?id=${encodeURIComponent(scanId)}&_=${timestamp}`;
      console.log(`API request URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      const data = await response.json();
      
      console.log('API response status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(data.error || 'Failed to get scan results');
      }
      
      console.log('Scan results fetched successfully:', {
        scanId: data.data?.id,
        url: data.data?.url,
        status: data.data?.status,
        hasPerformance: !!data.data?.performance,
        hasAccessibility: !!data.data?.accessibility,
        hasSeo: !!data.data?.seo,
        hasSecurity: !!data.data?.security
      });
      setScanResults(data.data);
      setSelectedScanId(scanId);
    } catch (error: any) {
      console.error('Error fetching scan results:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setResultsError(error.message || 'An error occurred while fetching scan results');
      setScanResults(null);
    } finally {
      setLoadingResults(false);
    }
  };

  // Function to close the results modal
  const closeResults = () => {
    setSelectedScanId(null);
    setScanResults(null);
    setResultsError(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Reports
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Please sign in to view your reports.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Reports
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            A list of all your website scans and their results.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            New Scan
          </Link>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {scans.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      Website
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Performance
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Accessibility
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      SEO
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Security
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scans.map((scan) => (
                    <tr key={scan.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        {scan.website_url}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            scan.performance_score >= 90 ? 'bg-green-100 text-green-700' :
                            scan.performance_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {scan.performance_score || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            scan.accessibility_score >= 90 ? 'bg-green-100 text-green-700' :
                            scan.accessibility_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {scan.accessibility_score || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            scan.seo_score >= 90 ? 'bg-green-100 text-green-700' :
                            scan.seo_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {scan.seo_score || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            scan.security_score >= 90 ? 'bg-green-100 text-green-700' :
                            scan.security_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {scan.security_score || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <button
                          onClick={() => fetchScanResults(scan.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View<span className="sr-only">, {scan.website_url}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-gray-500">No reports found. Start by scanning a website.</p>
                <div className="mt-6">
                  <Link
                    href="/"
                    className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    Scan a Website
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Scan Results Modal */}
    {selectedScanId && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeResults}></div>
          
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-7xl">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                onClick={closeResults}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              {loadingResults ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : resultsError ? (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error loading scan results</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{resultsError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : scanResults ? (
                <ScanResults results={scanResults} isPremium={isPremium} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-gray-500">No scan results available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}