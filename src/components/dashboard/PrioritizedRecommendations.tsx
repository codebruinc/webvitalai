'use client';

import React, { useState } from 'react';

interface Recommendation {
  issueId: string;
  description: string;
  priority: string;
  implementationDetails: string;
  impact: number;
  effort: number;
  priorityScore: number;
}

interface PrioritizedRecommendationsProps {
  recommendations: Recommendation[];
}

export default function PrioritizedRecommendations({ recommendations }: PrioritizedRecommendationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'priorityScore' | 'impact' | 'effort'>('priorityScore');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

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

  // Sort recommendations
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    if (sortBy === 'priorityScore') {
      return b.priorityScore - a.priorityScore;
    } else if (sortBy === 'impact') {
      return b.impact - a.impact;
    } else {
      // Sort by effort (ascending - lower effort first)
      return a.effort - b.effort;
    }
  });

  // Filter recommendations by priority if filter is set
  const filteredRecommendations = filterPriority
    ? sortedRecommendations.filter(rec => rec.priority.toLowerCase() === filterPriority.toLowerCase())
    : sortedRecommendations;

  return (
    <div className="mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">AI-Prioritized Recommendations</h3>
        <div className="mt-2 sm:mt-0 flex flex-wrap gap-2">
          <div>
            <label htmlFor="sort-by" className="sr-only">Sort by</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="block w-full rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="priorityScore">Sort by Priority Score</option>
              <option value="impact">Sort by Impact</option>
              <option value="effort">Sort by Effort (Low to High)</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-priority" className="sr-only">Filter by Priority</label>
            <select
              id="filter-priority"
              value={filterPriority || ''}
              onChange={(e) => setFilterPriority(e.target.value || null)}
              className="block w-full rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Issue
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Priority
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Impact
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Effort
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Score
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredRecommendations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 pl-4 pr-3 text-sm text-gray-500 text-center">
                  No recommendations found.
                </td>
              </tr>
            ) : (
              filteredRecommendations.map((recommendation) => (
                <React.Fragment key={recommendation.issueId}>
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="font-medium text-gray-900 line-clamp-2">
                        {recommendation.description.split('.')[0]}.
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getPriorityBgColor(recommendation.priority)} ${getPriorityColor(recommendation.priority)}`}>
                        {recommendation.priority}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${recommendation.impact * 10}%` }}
                          ></div>
                        </div>
                        <span className="ml-2">{recommendation.impact}/10</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-orange-500 h-2.5 rounded-full" 
                            style={{ width: `${recommendation.effort * 10}%` }}
                          ></div>
                        </div>
                        <span className="ml-2">{recommendation.effort}/10</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm font-medium">
                      {recommendation.priorityScore.toFixed(1)}
                    </td>
                    <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => setExpandedId(expandedId === recommendation.issueId ? null : recommendation.issueId)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        {expandedId === recommendation.issueId ? 'Hide Details' : 'Show Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === recommendation.issueId && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="p-4 text-sm text-gray-700">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Why This Matters</h4>
                          <p>{recommendation.description}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Implementation Steps</h4>
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap bg-gray-100 p-3 rounded">
                              {recommendation.implementationDetails}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}