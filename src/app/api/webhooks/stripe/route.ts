import { NextRequest, NextResponse } from 'next/server';
import { constructEventFromPayload } from '@/services/stripeService';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') || '';

  try {
    // Verify the webhook signature
    const event = constructEventFromPayload(body, signature);

    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extract customer and subscription information
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.client_reference_id;
        
        if (!userId) {
          console.error('No userId found in session metadata');
          return NextResponse.json({ error: 'No userId found' }, { status: 400 });
        }

        // Update the user's subscription status in the database
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            plan_type: 'premium',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            cancel_at_period_end: false,
          });

        if (error) {
          console.error('Error updating subscription:', error);
          return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
        }

        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        
        // Get the user associated with this customer
        const { data: subscriptionData, error: fetchError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (fetchError || !subscriptionData) {
          console.error('Error fetching subscription:', fetchError);
          return NextResponse.json({ error: 'Error fetching subscription' }, { status: 500 });
        }
        
        // Update the subscription status
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_customer_id', customerId);
        
        if (error) {
          console.error('Error updating subscription:', error);
          return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        
        // Update the subscription status to canceled
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_customer_id', customerId);
        
        if (error) {
          console.error('Error updating subscription:', error);
          return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
        }
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }
}