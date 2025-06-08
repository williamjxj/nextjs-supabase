import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ??
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
        ''
    );
  }

  return stripePromise;
};

// Client-side utility to handle subscription checkout
export async function createSubscriptionCheckout(params: {
  priceId: string
  successUrl?: string
  cancelUrl?: string
}): Promise<string> {
  try {
    const response = await fetch('/api/stripe/checkout/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: params.priceId,
        successUrl: params.successUrl || `${window.location.origin}/account/subscriptions?success=true`,
        cancelUrl: params.cancelUrl || `${window.location.origin}/pricing`,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create checkout session')
    }

    const { sessionId } = await response.json()
    return sessionId
  } catch (error) {
    console.error('Error creating subscription checkout:', error)
    throw error
  }
}

// Client-side utility to access customer portal
export async function createCustomerPortalSession(returnUrl?: string): Promise<string> {
  try {
    const response = await fetch('/api/stripe/customer-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnUrl: returnUrl || `${window.location.origin}/account/subscriptions`,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create customer portal session')
    }

    const { url } = await response.json()
    return url
  } catch (error) {
    console.error('Error creating customer portal session:', error)
    throw error
  }
}

export default getStripe
