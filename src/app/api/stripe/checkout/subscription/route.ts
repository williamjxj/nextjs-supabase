import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StripeAdmin } from '@/lib/stripe/admin'
import { getPrice } from '@/lib/stripe/server'
import { SupabaseAdmin } from '@/utils/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { priceId, successUrl, cancelUrl, trialPeriodDays } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let customer = await SupabaseAdmin.getCustomer(user.id)
    
    if (!customer) {
      // Create Stripe customer
      const stripeCustomer = await StripeAdmin.createCustomer({
        email: user.email!,
        userId: user.id,
        metadata: {
          userId: user.id,
        },
      })

      // Save customer to database
      customer = await SupabaseAdmin.upsertCustomer({
        userId: user.id,
        stripeCustomerId: stripeCustomer.id,
        email: user.email!,
      })
    }

    // Determine subscription tier from price ID
    let subscriptionTier = 'starter'
    if (priceId.includes('pro')) {
      subscriptionTier = 'pro'
    } else if (priceId.includes('enterprise')) {
      subscriptionTier = 'enterprise'
    }

    // Create checkout session
    const session = await StripeAdmin.createCheckoutSession({
      customerId: customer.stripe_customer_id,
      priceId,
      successUrl: successUrl || `${request.nextUrl.origin}/account/subscriptions?success=true`,
      cancelUrl: cancelUrl || `${request.nextUrl.origin}/membership`,
      metadata: {
        userId: user.id,
        subscriptionType: subscriptionTier,
        isSubscription: 'true',
      },
      trialPeriodDays,
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (error) {
    console.error('Error creating subscription checkout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
