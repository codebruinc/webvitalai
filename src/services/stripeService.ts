import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil', // Use the latest API version
});

// Premium subscription price ID
const PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '';

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(userId: string, email: string) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: PREMIUM_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    customer_email: email,
    client_reference_id: userId,
    metadata: {
      userId,
    },
  });

  return session;
}

/**
 * Retrieve a Stripe Checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session;
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
  });

  return session;
}

/**
 * Get a customer's subscription
 */
export async function getCustomerSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    expand: ['data.default_payment_method'],
  });

  return subscriptions.data[0];
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Verify Stripe webhook signature
 */
export function constructEventFromPayload(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get Stripe customer by ID
 */
export async function getCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId);
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(email: string, name?: string) {
  return await stripe.customers.create({
    email,
    name,
  });
}

export default stripe;