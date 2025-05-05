'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupConfirmationPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
    
    async function checkSession() {
      try {
        if (!clientReady) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // If user is already signed in, redirect to dashboard
          router.push('/dashboard');
          return;
        }
        
        // Try to get email from localStorage (set during signup)
        if (typeof window !== 'undefined') {
          const storedEmail = localStorage.getItem('signupEmail');
          if (storedEmail) {
            setEmail(storedEmail);
            // Clear the stored email
            localStorage.removeItem('signupEmail');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (clientReady) {
      checkSession();
    }
  }, [router, clientReady]);

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mt-6 text-center">
            <div className="animate-pulse flex justify-center">
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Check your email
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <div className="text-center">
            <p className="text-base text-gray-500">
              {email ? (
                <>
                  We've sent a confirmation email to <span className="font-medium text-gray-900">{email}</span>.
                </>
              ) : (
                <>
                  We've sent a confirmation email to your email address.
                </>
              )}
            </p>
            <p className="mt-2 text-base text-gray-500">
              Please check your inbox and click on the link to confirm your account.
            </p>
            
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-gray-900">What's next?</span>
                </div>
              </div>
              
              <ul className="mt-8 space-y-4 text-left">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    <span className="font-medium text-gray-900">Confirm your email</span> by clicking the link we sent you
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    <span className="font-medium text-gray-900">Log in</span> to your account
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-500">
                    <span className="font-medium text-gray-900">Start analyzing</span> your website's performance
                  </p>
                </li>
              </ul>
            </div>
            
            <div className="mt-10">
              <Link
                href="/login"
                className="inline-flex items-center rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Go to login
              </Link>
            </div>
          </div>
        </div>
        
        <p className="mt-10 text-center text-sm text-gray-500">
          Didn't receive the email?{' '}
          <button
            type="button"
            className="font-semibold leading-6 text-primary-600 hover:text-primary-500"
            onClick={async () => {
              if (!email) {
                alert('Email address not found. Please try signing up again.');
                return;
              }
              
              try {
                const { error } = await supabase.auth.resend({
                  type: 'signup',
                  email,
                  options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
                
                if (error) {
                  throw error;
                }
                
                alert('Confirmation email resent! Please check your inbox.');
              } catch (error: any) {
                console.error('Error resending email:', error);
                alert(`Error resending email: ${error.message || 'Unknown error'}`);
              }
            }}
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
}