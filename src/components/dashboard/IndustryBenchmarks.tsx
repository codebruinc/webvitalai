'use client';

import React, { useState, useEffect } from 'react';
import { getAvailableIndustries, compareWithIndustryBenchmarks, BenchmarkComparison } from '@/services/benchmarkService';

interface IndustryBenchmarksProps {
  scanId: string;
}

export default function IndustryBenchmarks({ scanId }: IndustryBenchmarksProps) {
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [comparisons, setComparisons] = useState<BenchmarkComparison[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available industries on component mount
  useEffect(() => {
    async function fetchIndustries() {
      try {
        const availableIndustries = await getAvailableIndustries();
        setIndustries(availableIndustries);
        
        // Set default industry if available
        if (availableIndustries.length > 0) {
          setSelectedIndustry(availableIndustries[0]);
        }
      } catch (err) {
        setError('Failed to load industries');
        console.error(err);
      }
    }

    fetchIndustries();
  }, []);

  // Fetch comparisons when industry changes
  useEffect(() => {
    if (selectedIndustry) {
      fetchComparisons();
    }
  }, [selectedIndustry]);

  async function fetchComparisons() {
    setLoading(true);
    setError(null);
    
    try {
      const benchmarkComparisons = await compareWithIndustryBenchmarks(scanId, selectedIndustry);
      setComparisons(benchmarkComparisons);
    } catch (err) {
      setError('Failed to load benchmark comparisons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'average':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Helper function to get background color based on status
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100';
      case 'average':
        return 'bg-yellow-100';
      case 'poor':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Industry Benchmarks</h3>
        <div className="mt-2 sm:mt-0">
          <label htmlFor="industry-select" className="sr-only">Select Industry</label>
          <select
            id="industry-select"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            disabled={loading || industries.length === 0}
          >
            {industries.length === 0 ? (
              <option value="">No industries available</option>
            ) : (
              industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading benchmarks...</span>
        </div>
      ) : comparisons.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No benchmark data available for this industry.
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Metric
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Your Value
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Industry Benchmark
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Percentile
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {comparisons.map((comparison) => (
                <tr key={comparison.metricName} className="hover:bg-gray-50">
                  <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {comparison.metricName}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {typeof comparison.currentValue === 'number' && comparison.currentValue < 0.01
                      ? comparison.currentValue.toFixed(4)
                      : typeof comparison.currentValue === 'number' && comparison.currentValue < 1
                      ? comparison.currentValue.toFixed(2)
                      : Math.round(comparison.currentValue)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span className="text-green-600">Good: {comparison.goodThreshold}</span>
                      <span className="text-yellow-600">Average: {comparison.averageThreshold}</span>
                      <span className="text-red-600">Poor: {comparison.poorThreshold}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusBgColor(comparison.status)} ${getStatusColor(comparison.status)}`}>
                      {comparison.status.charAt(0).toUpperCase() + comparison.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {comparison.percentile ? (
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              comparison.percentile >= 75 ? 'bg-green-600' : 
                              comparison.percentile >= 50 ? 'bg-yellow-500' : 'bg-red-600'
                            }`}
                            style={{ width: `${comparison.percentile}%` }}
                          ></div>
                        </div>
                        <span className="ml-2">{comparison.percentile}%</span>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}