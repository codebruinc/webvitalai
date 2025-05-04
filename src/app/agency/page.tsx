'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { isAgency, getAgencyClients, AgencyClient } from '@/services/agencyService';
import ClientList from '@/components/agency/ClientList';
import ClientInvitation from '@/components/agency/ClientInvitation';

export default function AgencyPortalPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAgencyUser, setIsAgencyUser] = useState(false);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clients' | 'invite'>('clients');

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      checkAgencyStatus();
    }
  }, [user]);

  const checkAgencyStatus = async () => {
    try {
      const agencyStatus = await isAgency(user?.id || '');
      setIsAgencyUser(agencyStatus);
      
      if (agencyStatus) {
        fetchClients();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking agency status:', err);
      setError('Failed to check agency status');
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const agencyClients = await getAgencyClients(user?.id || '');
      setClients(agencyClients);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!isAgencyUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Agency Plan Required</h3>
              <p className="mt-1 text-sm text-gray-500">
                You need to upgrade to the Agency plan to access the client portal.
              </p>
              <div className="mt-6">
                <a
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  View Pricing
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
          <h1 className="text-3xl font-bold text-gray-900">Agency Client Portal</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your clients and their websites in one place.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
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

        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('clients')}
                className={`${
                  activeTab === 'clients'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Clients
              </button>
              <button
                onClick={() => setActiveTab('invite')}
                className={`${
                  activeTab === 'invite'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Invite Client
              </button>
            </nav>
          </div>

          <div className="px-4 py-5 sm:p-6">
            {activeTab === 'clients' ? (
              <ClientList clients={clients} onClientRemoved={fetchClients} />
            ) : (
              <ClientInvitation agencyId={user?.id || ''} onInvitationSent={fetchClients} />
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Agency Benefits</h3>
            <div className="mt-5">
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Client Management</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{clients.length}</dd>
                </div>
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Websites</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {clients.reduce((total, client) => total + client.websites.length, 0)}
                  </dd>
                </div>
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">White-Label Reports</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">Unlimited</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}