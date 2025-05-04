'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getScorecardByShareCode } from '@/services/scorecardService';
import SocialScorecard from '@/components/scorecard/SocialScorecard';

export default function ScorecardPage() {
  const params = useParams();
  const shareCode = params.shareCode as string;
  
  const [scorecard, setScorecard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScorecard() {
      try {
        const data = await getScorecardByShareCode(shareCode);
        if (data) {
          setScorecard(data);
        } else {
          setError('Scorecard not found');
        }
      } catch (err) {
        setError('Failed to load scorecard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (shareCode) {
      fetchScorecard();
    }
  }, [shareCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">{error || 'Scorecard not found'}</h3>
              <p className="mt-1 text-sm text-gray-500">
                The scorecard you're looking for doesn't exist or has been removed.
              </p>
              <div className="mt-6">
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Go to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Web Performance Scorecard</h1>
          <p className="mt-2 text-sm text-gray-500">
            A detailed analysis of website performance, accessibility, SEO, and security.
          </p>
        </div>

        <SocialScorecard scorecard={scorecard} isPublic={true} />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Want to analyze your own website's performance?
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Try WebVital AI
          </a>
        </div>
      </div>
    </div>
  );
}