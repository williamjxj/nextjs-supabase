'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getURL } from '@/lib/utils/helpers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  SUBSCRIPTION_PLANS,
  STRIPE_PRICE_IDS,
  SubscriptionPlanType,
} from '@/lib/subscription-config'
import {
  createUserSubscription,
  getUserSubscription,
} from '@/lib/supabase/subscriptions-simplified'

interface CheckoutParams {
  planType: SubscriptionPlanType
  billingInterval: 'monthly' | 'yearly'
  redirectPath?: string
}

export async function checkoutWithStripe({
  planType,
  billingInterval,
  redirectPath = '/account',
}: CheckoutParams) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('You must be signed in to purchase a subscription.')
  }

  const plan = SUBSCRIPTION_PLANS[planType]
  if (!plan) {
    throw new Error('Invalid subscription plan.')
  }

  // Get or create Stripe customer
  let stripeCustomerId: string

  try {
    // Try to find existing customer by email
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    })

    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabaseUUID: user.id,
        },
      })
      stripeCustomerId = customer.id
    }

    // Get the correct price ID
    const priceId = STRIPE_PRICE_IDS[planType][billingInterval]

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: getURL(`${redirectPath}?success=true`),
      cancel_url: getURL(`${redirectPath}?canceled=true`),
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        planType,
        billingInterval,
      },
    })

    if (!session.url) {
      throw new Error('Could not create checkout session')
    }

    redirect(session.url)
  } catch (error) {
    console.error('Error in checkoutWithStripe:', error)
    throw error
  }
}

export async function createStripePortal(currentPath: string) {
  try {
    const supabase = await createClient()
    const {
      error,
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      if (error) {
        console.error(error)
      }
      throw new Error('You must be signed in to access the customer portal.')
    }

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    })

    if (customers.data.length === 0) {
      throw new Error('Could not find customer.')
    }

    const customer = customers.data[0]

    try {
      const { url } = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: getURL('/account'),
      })
      if (!url) {
        throw new Error('Could not create billing portal')
      }
      redirect(url)
    } catch (err) {
      console.error(err)
      throw new Error('Could not create billing portal')
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error)
      throw error
    }
    throw new Error('An unexpected error occurred')
  }
}

export async function getSubscription() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return await getUserSubscription(user.id)
}

export async function getUserDetails() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Return user from auth.users since we removed public.users
  return {
    id: user.id,
    full_name: user.user_metadata?.full_name || '',
    avatar_url: user.user_metadata?.avatar_url || '',
    email: user.email,
  }
}

export async function updateUserName(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to update your name.')
  }

  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  })

  if (error) {
    throw new Error('Failed to update name.')
  }

  revalidatePath('/account')
  return { message: 'Name updated successfully!' }
}

export async function updateUserEmail(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to update your email.')
  }

  const newEmail = formData.get('email') as string

  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (error) {
    throw new Error('Failed to update email.')
  }

  revalidatePath('/account')
  return { message: 'Check your email to confirm the change!' }
}
