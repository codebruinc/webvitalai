import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { getCustomerSubscription } from '@/services/stripeService';

export async function GET(req: NextRequest) {
  try {
    // Create a Supabase server client
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the user's subscription from the database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no subscription is found, return a default status
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          isSubscribed: false,
          plan: 'free',
          status: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: null,
        });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If subscription exists, return the details
    return NextResponse.json({
      isSubscribed: subscription.status === 'active',
      plan: subscription.plan_type,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeCustomerId: subscription.stripe_customer_id,
      stripeSubscriptionId: subscription.stripe_subscription_id,
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json(
      { error: `Error getting subscription status: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}