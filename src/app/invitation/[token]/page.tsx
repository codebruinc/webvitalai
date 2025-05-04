'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { acceptInvitation } from '@/services/agencyService';

export default function InvitationPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);

  useEffect(() => {
    if (token) {
      fetchInvitationDetails();
    }
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('client_invitations')
        .select('*, users:agency_id(name, email)')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if the invitation has expired
      if (new Date(data.expires_at) < new Date()) {
        await supabase
          .from('client_invitations')
          .update({ status: 'expired' })
          .eq('id', data.id);
        
        throw new Error('Invitation has expired');
      }

      setInvitationDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      // If not logged in, redirect to login page with return URL
      router.push(`/login?returnUrl=/invitation/${token}`);
      return;
    }

    setAccepting(true);
    setError(null);
    setSuccess(null);

    try {
      const success = await acceptInvitation(token, user.id);
      
      if (success) {
        setSuccess('You have successfully joined the agency portal');
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setError('Failed to accept invitation');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while accepting the invitation');
      console.error(err);
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">{error}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please contact the agency that sent you this invitation for assistance.
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">{success}</h3>
              <p className="mt-1 text-sm text-gray-500">
                You will be redirected to the dashboard shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Agency Invitation</h2>
                <p className="mt-2 text-sm text-gray-500">
                  You have been invited to join an agency portal.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Agency</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {invitationDetails?.users?.name || 'Unknown Agency'}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Agency Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {invitationDetails?.users?.email || 'Unknown'}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Invitation Sent To</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {invitationDetails?.email}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Expires On</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(invitationDetails?.expires_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  By accepting this invitation, you will allow the agency to view and manage your website performance data.
                </p>
                <button
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {accepting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Accepting Invitation...
                    </>
                  ) : (
                    'Accept Invitation'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}