'use client';

import React, { useState } from 'react';
import { AgencyClient, removeClient } from '@/services/agencyService';

interface ClientListProps {
  clients: AgencyClient[];
  onClientRemoved: () => void;
}

export default function ClientList({ clients, onClientRemoved }: ClientListProps) {
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [removingClientId, setRemovingClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Toggle client expansion
  const toggleClientExpansion = (clientId: string) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  // Handle client removal
  const handleRemoveClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to remove this client? This action cannot be undone.')) {
      return;
    }

    setRemovingClientId(clientId);
    setError(null);
    setSuccess(null);

    try {
      const success = await removeClient(localStorage.getItem('userId') || '', clientId);
      
      if (success) {
        setSuccess('Client removed successfully');
        onClientRemoved();
      } else {
        setError('Failed to remove client');
      }
    } catch (err) {
      setError('An error occurred while removing the client');
      console.error(err);
    } finally {
      setRemovingClientId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No clients found. Invite clients to get started.
      </div>
    );
  }

  return (
    <div>
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

      {success && (
        <div className="rounded-md bg-green-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Client
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Websites
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Joined
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clients.map((client) => (
              <React.Fragment key={client.id}>
                <tr className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {client.name || 'Unnamed Client'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {client.email}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {client.websites.length}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => toggleClientExpansion(client.id)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      {expandedClientId === client.id ? 'Hide Websites' : 'Show Websites'}
                    </button>
                    <button
                      onClick={() => handleRemoveClient(client.id)}
                      disabled={removingClientId === client.id}
                      className="text-red-600 hover:text-red-900"
                    >
                      {removingClientId === client.id ? 'Removing...' : 'Remove'}
                    </button>
                  </td>
                </tr>
                {expandedClientId === client.id && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-sm text-gray-500">
                      {client.websites.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No websites found for this client.
                        </div>
                      ) : (
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">
                                  Website
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                                  URL
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                                  Status
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                                  Last Scan
                                </th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                  <span className="sr-only">Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {client.websites.map((website) => (
                                <tr key={website.id} className="hover:bg-gray-50">
                                  <td className="whitespace-nowrap py-2 pl-4 pr-3 text-xs font-medium text-gray-900 sm:pl-6">
                                    {website.name}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                                    {website.url}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                                    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${
                                      website.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {website.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                                    {website.lastScanDate ? formatDate(website.lastScanDate) : 'Never'}
                                  </td>
                                  <td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-xs font-medium sm:pr-6">
                                    {website.lastScanId && (
                                      <a
                                        href={`/dashboard?scan=${website.lastScanId}`}
                                        className="text-primary-600 hover:text-primary-900"
                                      >
                                        View Results
                                      </a>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}