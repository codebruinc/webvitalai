'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientReady, setClientReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setClientReady(true);
    
    // Get current session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      getSession();

      // Listen for auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('Auth state changed:', event);
          setUser(session?.user || null);
          setLoading(false);
          
          // Handle specific auth events
          if (event === 'SIGNED_IN') {
            router.refresh();
          } else if (event === 'SIGNED_OUT') {
            router.refresh();
          }
        }
      );

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, [router]);

  const signOut = async () => {
    if (!clientReady) return;
    
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}