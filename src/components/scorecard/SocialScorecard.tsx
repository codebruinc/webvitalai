'use client';

import React, { useState } from 'react';
import { ScorecardData } from '@/services/scorecardService';

interface SocialScorecardProps {
  scorecard: ScorecardData;
  isPublic?: boolean;
}

export default function SocialScorecard({ scorecard, isPublic = false }: SocialScorecardProps) {
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper function to get background color based on score
  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Helper function to get the overall grade
  const getOverallGrade = () => {
    const avgScore = (
      scorecard.performanceScore +
      scorecard.accessibilityScore +
      scorecard.seoScore +
      scorecard.securityScore
    ) / 4;

    if (avgScore >= 90) return 'A+';
    if (avgScore >= 85) return 'A';
    if (avgScore >= 80) return 'A-';
    if (avgScore >= 75) return 'B+';
    if (avgScore >= 70) return 'B';
    if (avgScore >= 65) return 'B-';
    if (avgScore >= 60) return 'C+';
    if (avgScore >= 55) return 'C';
    if (avgScore >= 50) return 'C-';
    if (avgScore >= 45) return 'D+';
    if (avgScore >= 40) return 'D';
    return 'F';
  };

  // Helper function to get the overall grade color
  const getOverallGradeColor = () => {
    const grade = getOverallGrade();
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-teal-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  // Helper function to get the overall grade background color
  const getOverallGradeBgColor = () => {
    const grade = getOverallGrade();
    if (grade.startsWith('A')) return 'bg-green-100';
    if (grade.startsWith('B')) return 'bg-teal-100';
    if (grade.startsWith('C')) return 'bg-yellow-100';
    if (grade.startsWith('D')) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Copy share URL to clipboard
  const copyShareUrl = () => {
    navigator.clipboard.writeText(scorecard.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share on social media
  const shareOnSocialMedia = (platform: 'twitter' | 'linkedin' | 'facebook') => {
    const text = `Check out the web performance scorecard for ${scorecard.websiteName}: Overall Grade ${getOverallGrade()}`;
    const url = scorecard.shareUrl;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
    }
    
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Web Performance Scorecard
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {scorecard.websiteName} ({scorecard.websiteUrl})
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Generated on {formatDate(scorecard.createdAt)}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center">
            <div className={`p-4 rounded-lg ${getOverallGradeBgColor()} mr-4`}>
              <span className="text-xs font-medium text-gray-500">Overall Grade</span>
              <p className={`text-3xl font-bold ${getOverallGradeColor()}`}>
                {getOverallGrade()}
              </p>
            </div>
            {!isPublic && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share
                </button>
                {showShareOptions && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        onClick={copyShareUrl}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        role="menuitem"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => shareOnSocialMedia('twitter')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        role="menuitem"
                      >
                        <svg className="h-5 w-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        Share on Twitter
                      </button>
                      <button
                        onClick={() => shareOnSocialMedia('linkedin')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        role="menuitem"
                      >
                        <svg className="h-5 w-5 mr-2 text-blue-700" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        Share on LinkedIn
                      </button>
                      <button
                        onClick={() => shareOnSocialMedia('facebook')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        role="menuitem"
                      >
                        <svg className="h-5 w-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Share on Facebook
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${getScoreBgColor(scorecard.performanceScore)}`}>
            <h4 className="text-sm font-medium text-gray-500">Performance</h4>
            <p className={`text-3xl font-bold ${getScoreColor(scorecard.performanceScore)}`}>
              {Math.round(scorecard.performanceScore)}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${getScoreBgColor(scorecard.accessibilityScore)}`}>
            <h4 className="text-sm font-medium text-gray-500">Accessibility</h4>
            <p className={`text-3xl font-bold ${getScoreColor(scorecard.accessibilityScore)}`}>
              {Math.round(scorecard.accessibilityScore)}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${getScoreBgColor(scorecard.seoScore)}`}>
            <h4 className="text-sm font-medium text-gray-500">SEO</h4>
            <p className={`text-3xl font-bold ${getScoreColor(scorecard.seoScore)}`}>
              {Math.round(scorecard.seoScore)}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${getScoreBgColor(scorecard.securityScore)}`}>
            <h4 className="text-sm font-medium text-gray-500">Security</h4>
            <div className="flex items-end space-x-2">
              <p className={`text-3xl font-bold ${getScoreColor(scorecard.securityScore)}`}>
                {Math.round(scorecard.securityScore)}
              </p>
              <p className={`text-xl font-semibold ${getScoreColor(scorecard.securityScore)}`}>
                ({scorecard.securityGrade})
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What These Scores Mean</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Performance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Measures how quickly pages load and become interactive. Higher scores mean faster loading times and better user experience.
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Accessibility</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Measures how accessible your site is to users with disabilities. Higher scores mean more users can effectively use your site.
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">SEO</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Measures how well search engines can index and understand your content. Higher scores mean better visibility in search results.
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Security</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Measures how well your site protects user data and prevents vulnerabilities. Higher scores mean better protection against threats.
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This scorecard was generated by <a href="/" className="text-primary-600 hover:text-primary-500">WebVital AI</a>
          </p>
        </div>
      </div>
    </div>
  );
}