'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PrioritizedRecommendations from './PrioritizedRecommendations';
import IndustryBenchmarks from './IndustryBenchmarks';
import { generateScorecard } from '@/services/scorecardService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ScanResultsProps {
  results: {
    id: string;
    url: string;
    status: string;
    error?: string;
    performance?: {
      score: number;
      metrics?: Record<string, { value: number; unit?: string }>;
    };
    accessibility?: {
      score: number;
      issues?: Array<{
        title: string;
        description: string;
        severity: string;
      }>;
    };
    seo?: {
      score: number;
      issues?: Array<{
        title: string;
        description: string;
        severity: string;
      }>;
    };
    bestPractices?: {
      score: number;
      issues?: Array<{
        title: string;
        description: string;
        severity: string;
      }>;
    };
    security?: {
      score: number;
      grade: string;
      issues?: Array<{
        title: string;
        description: string;
        severity: string;
      }>;
    };
    recommendations?: Array<{
      issueId: string;
      description: string;
      priority: string;
      implementationDetails: string;
      impact: number;
      effort: number;
      priorityScore: number;
    }>;
  };
  isPremium: boolean;
}

export default function ScanResults({ results, isPremium }: ScanResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'accessibility' | 'seo' | 'security' | 'recommendations' | 'prioritized' | 'benchmarks'>('overview');
  const router = useRouter();
  const [generatingScorecard, setGeneratingScorecard] = useState(false);
  const [scorecardError, setScorecardError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

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

  // Helper function to get color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  // Helper function to get background color based on severity
  const getSeverityBgColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100';
      case 'medium':
        return 'bg-yellow-100';
      case 'low':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Helper function to get color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  // Helper function to get background color based on priority
  const getPriorityBgColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-100';
      case 'high':
        return 'bg-orange-100';
      case 'medium':
        return 'bg-yellow-100';
      case 'low':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden" ref={reportRef}>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Scan Results
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {results.url}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            {isPremium && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setGeneratingPdf(true);
                      setPdfError(null);
                      
                      if (reportRef.current) {
                        const canvas = await html2canvas(reportRef.current, {
                          scale: 2,
                          logging: false,
                          useCORS: true
                        });
                        
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF({
                          orientation: 'portrait',
                          unit: 'mm',
                          format: 'a4'
                        });
                        
                        const imgWidth = 210; // A4 width in mm
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        
                        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                        pdf.save(`${results.url.replace(/https?:\/\//i, '').replace(/[^a-z0-9]/gi, '-')}-report.pdf`);
                      }
                    } catch (error) {
                      console.error('Error generating PDF:', error);
                      setPdfError('An error occurred while generating the PDF');
                    } finally {
                      setGeneratingPdf(false);
                    }
                  }}
                  disabled={generatingPdf}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {generatingPdf ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                      </svg>
                      Download PDF
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setGeneratingScorecard(true);
                      setScorecardError(null);
                      const scorecard = await generateScorecard(results.id);
                      if (scorecard) {
                        router.push(`/scorecard/${scorecard.shareCode}`);
                      } else {
                        setScorecardError('Failed to generate scorecard');
                      }
                    } catch (error) {
                      console.error('Error generating scorecard:', error);
                      setScorecardError('An error occurred while generating the scorecard');
                    } finally {
                      setGeneratingScorecard(false);
                    }
                  }}
                  disabled={generatingScorecard}
                  className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  {generatingScorecard ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      Share Scorecard
                    </>
                  )}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Scan Another URL
            </button>
          </div>
        </div>
      </div>

      {/* Score Overview */}
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {results.performance && (
            <div className={`p-4 rounded-lg ${getScoreBgColor(results.performance.score)}`}>
              <h4 className="text-sm font-medium text-gray-500">Performance</h4>
              <p className={`text-3xl font-bold ${getScoreColor(results.performance.score)}`}>
                {Math.round(results.performance.score)}
              </p>
            </div>
          )}
          
          {results.accessibility && (
            <div className={`p-4 rounded-lg ${getScoreBgColor(results.accessibility.score)}`}>
              <h4 className="text-sm font-medium text-gray-500">Accessibility</h4>
              <p className={`text-3xl font-bold ${getScoreColor(results.accessibility.score)}`}>
                {Math.round(results.accessibility.score)}
              </p>
            </div>
          )}
          
          {results.seo && (
            <div className={`p-4 rounded-lg ${getScoreBgColor(results.seo.score)}`}>
              <h4 className="text-sm font-medium text-gray-500">SEO</h4>
              <p className={`text-3xl font-bold ${getScoreColor(results.seo.score)}`}>
                {Math.round(results.seo.score)}
              </p>
            </div>
          )}
          
          {results.security && (
            <div className={`p-4 rounded-lg ${getScoreBgColor(results.security.score)}`}>
              <h4 className="text-sm font-medium text-gray-500">Security</h4>
              <div className="flex items-end space-x-2">
                <p className={`text-3xl font-bold ${getScoreColor(results.security.score)}`}>
                  {Math.round(results.security.score)}
                </p>
                <p className={`text-xl font-semibold ${getScoreColor(results.security.score)}`}>
                  ({results.security.grade})
                </p>
              </div>
            </div>
          )}
        </div>

        {(scorecardError || pdfError) && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{scorecardError || pdfError}</h3>
              </div>
            </div>
          </div>
        )}

        {!isPremium && (
          <div className="mt-6 rounded-lg bg-primary-50 p-4 border border-primary-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary-800">Upgrade to Premium</h3>
                <div className="mt-2 text-sm text-primary-700">
                  <p>
                    Unlock detailed issues, recommendations, and implementation steps with our Premium plan.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isPremium && (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              
              {results.performance && (
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`${
                    activeTab === 'performance'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Performance
                </button>
              )}
              
              {results.accessibility && (
                <button
                  onClick={() => setActiveTab('accessibility')}
                  className={`${
                    activeTab === 'accessibility'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Accessibility
                </button>
              )}
              
              {results.seo && (
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`${
                    activeTab === 'seo'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  SEO
                </button>
              )}
              
              {results.security && (
                <button
                  onClick={() => setActiveTab('security')}
                  className={`${
                    activeTab === 'security'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Security
                </button>
              )}
              
              {results.recommendations && (
                <>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`${
                      activeTab === 'recommendations'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Recommendations
                  </button>
                  <button
                    onClick={() => setActiveTab('prioritized')}
                    className={`${
                      activeTab === 'prioritized'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Prioritized Fixes
                  </button>
                  <button
                    onClick={() => setActiveTab('benchmarks')}
                    className={`${
                      activeTab === 'benchmarks'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Industry Benchmarks
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-4 py-5 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Overview</h3>
                <div className="mt-5 border-t border-gray-200">
                  <dl className="divide-y divide-gray-200">
                    {results.performance?.metrics && (
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Core Web Vitals</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                            {Object.entries(results.performance.metrics)
                              .filter(([key]) => ['Largest Contentful Paint', 'Cumulative Layout Shift', 'Total Blocking Time'].includes(key))
                              .map(([key, value]) => (
                                <li key={key} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                                  <div className="flex w-0 flex-1 items-center">
                                    <span className="ml-2 w-0 flex-1 truncate">{key}</span>
                                  </div>
                                  <div className="ml-4 flex-shrink-0">
                                    <span className="font-medium">
                                      {value.value.toFixed(2)} {value.unit}
                                    </span>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </dd>
                      </div>
                    )}

                    {results.accessibility?.issues && (
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Accessibility Issues</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          <span className="font-medium">{results.accessibility.issues.length} issues found</span>
                        </dd>
                      </div>
                    )}

                    {results.seo?.issues && (
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">SEO Issues</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          <span className="font-medium">{results.seo.issues.length} issues found</span>
                        </dd>
                      </div>
                    )}

                    {results.security?.issues && (
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Security Issues</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          <span className="font-medium">{results.security.issues.length} issues found</span>
                        </dd>
                      </div>
                    )}

                    {results.recommendations && (
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">AI Recommendations</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          <span className="font-medium">{results.recommendations.length} recommendations available</span>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && results.performance && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Performance</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Performance metrics and issues affecting your website's speed and user experience.
                </p>

                {results.performance.metrics && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900">Metrics</h4>
                    <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                              Metric
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {Object.entries(results.performance.metrics).map(([key, value]) => (
                            <tr key={key}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {key}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {typeof value.value === 'number' && value.value < 0.01
                                  ? value.value.toFixed(4)
                                  : typeof value.value === 'number' && value.value < 1
                                  ? value.value.toFixed(2)
                                  : Math.round(value.value)}
                                {value.unit ? ` ${value.unit}` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Prioritized Recommendations Tab */}
            {activeTab === 'prioritized' && results.recommendations && (
              <PrioritizedRecommendations recommendations={results.recommendations} />
            )}
            
            {/* Industry Benchmarks Tab */}
            {activeTab === 'benchmarks' && (
              <IndustryBenchmarks scanId={results.id} />
            )}
            
            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && results.recommendations && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  AI-generated recommendations to improve your website.
                </p>
                
                <div className="mt-6 space-y-6">
                  {results.recommendations.map((recommendation) => (
                    <div key={recommendation.issueId} className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {recommendation.description.split('.')[0]}.
                          </h3>
                          <p className={`mt-1 max-w-2xl text-sm ${getPriorityColor(recommendation.priority)}`}>
                            {recommendation.priority} Priority
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900">{recommendation.description}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Implementation Details</dt>
                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                              {recommendation.implementationDetails}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}