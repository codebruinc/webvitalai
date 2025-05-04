'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import ScanResults from '@/components/dashboard/ScanResults';
import LoadingState from '@/components/dashboard/LoadingState';
import { useSubscription } from '@/hooks/useSubscription';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scanId = searchParams.get('scan');
  const { isPremium } = useSubscription();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<any | null>(null);

  // Poll for scan status if a scan ID is provided
  useEffect(() => {
    if (!scanId) return;

    setIsLoading(true);
    setError(null);

    const checkScanStatus = async () => {
      try {
        const response = await fetch(`/api/scan/status?id=${scanId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get scan status');
        }

        setScanStatus(data.data.status);
        setScanProgress(data.data.progress);

        // If the scan is completed, get the results
        if (data.data.status === 'completed') {
          const resultsResponse = await fetch(`/api/scan/results?id=${scanId}`);
          const resultsData = await resultsResponse.json();

          if (!resultsResponse.ok) {
            throw new Error(resultsData.error || 'Failed to get scan results');
          }

          setScanResults(resultsData.data);
          setIsLoading(false);
        } else if (data.data.status === 'failed') {
          setError(data.data.error || 'Scan failed');
          setIsLoading(false);
        } else {
          // Continue polling
          setTimeout(checkScanStatus, 2000);
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred');
        setIsLoading(false);
      }
    };

    checkScanStatus();

    return () => {
      // Cleanup
    };
  }, [scanId]);

  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              Dashboard
            </h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            {scanId ? (
              <div className="px-4 py-8 sm:px-0">
                {isLoading ? (
                  <LoadingState progress={scanProgress} />
                ) : error ? (
                  <div className="rounded-lg bg-red-50 p-4 text-center">
                    <p className="text-lg text-red-600">{error}</p>
                    <button
                      type="button"
                      onClick={() => router.push('/')}
                      className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                      Try Another URL
                    </button>
                  </div>
                ) : scanResults ? (
                  <ScanResults results={scanResults} isPremium={isPremium} />
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-lg text-gray-600">No scan results found.</p>
                  </div>
                )}
              </div>
            ) : (
              <DashboardContent />
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}