import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { getPlanByPriceId, SUBSCRIPTION_PLANS } from '@/lib/subscription-config'
import Stripe from 'stripe'

// Create admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to get features for each plan type (copied from webhook)
function getSubscriptionFeatures(planType: string): string[] {
  const featuresMap: Record<string, string[]> = {
    standard: [
      'Access to standard quality images',
      'Basic usage rights',
      'Download up to 50 images/month',
      'Email support',
    ],
    premium: [
      'Access to premium quality images',
      'Extended usage rights',
      'Download up to 200 images/month',
      'Priority email support',
      'Advanced filters and search',
    ],
    commercial: [
      'Access to all images',
      'Full commercial usage rights',
      'Unlimited downloads',
      'Priority phone support',
      'Early access to new features',
      'Custom licensing options',
    ],
  }
  return featuresMap[planType] || []
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log(
      '🔄 Manual Stripe subscription activation for session:',
      sessionId
    )

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    console.log('✅ Stripe session retrieved:', {
      id: session.id,
      mode: session.mode,
      status: session.status,
      payment_status: session.payment_status,
      subscription_id: session.subscription,
    })

    // Only process subscription sessions
    if (session.mode !== 'subscription') {
      return NextResponse.json({
        success: false,
        message: 'Not a subscription session',
        mode: session.mode,
      })
    }

    if (session.status !== 'complete') {
      return NextResponse.json({
        success: false,
        message: 'Session not complete',
        status: session.status,
      })
    }

    if (!session.subscription) {
      return NextResponse.json({
        success: false,
        message: 'No subscription found in session',
      })
    }

    // Get subscription details from Stripe
    const subscription: Stripe.Subscription =
      await stripe.subscriptions.retrieve(session.subscription as string)

    console.log('📋 Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer,
    })

    // Extract user ID from session metadata or customer
    let userId = session.metadata?.userId

    if (!userId) {
      // Try to get from customer metadata
      try {
        const customer = await stripe.customers.retrieve(
          subscription.customer as string
        )
        if (customer && !customer.deleted) {
          userId = (customer as any).metadata?.supabaseUUID
        }
      } catch (error) {
        console.error('Error retrieving customer:', error)
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No user ID found in session or customer metadata',
        },
        { status: 400 }
      )
    }

    // Get subscription plan details from Stripe
    const lineItems = subscription.items?.data?.[0]
    const priceId = lineItems?.price?.id

    // Determine plan type from price ID
    const planDetails = getPlanByPriceId(priceId)
    const planType =
      planDetails?.planType || session.metadata?.planType || 'standard'
    const billingInterval =
      planDetails?.billingInterval ||
      session.metadata?.billingInterval ||
      'monthly'

    // Get plan configuration
    const planConfig =
      SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]
    const priceMonthly = planConfig?.priceMonthly || 9.99
    const priceYearly = planConfig?.priceYearly || 99.99

    // Get features for the plan
    const features = getSubscriptionFeatures(planType)

    // Create subscription record in our database
    const subscriptionData = {
      user_id: userId,
      plan_type: planType,
      price_monthly: priceMonthly,
      price_yearly: priceYearly,
      status: subscription.status,
      billing_interval: billingInterval,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(
        (subscription as any).current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        (subscription as any).current_period_end * 1000
      ).toISOString(),
      features: features,
      updated_at: new Date().toISOString(),
    }

    console.log('💾 Creating Stripe subscription record:', subscriptionData)

    // Check if subscription already exists
    const { data: existingSubscription, error: checkError } =
      await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

    let data
    if (existingSubscription) {
      // Update existing subscription
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('stripe_subscription_id', subscription.id)
        .select()

      if (updateError) {
        console.error(
          '❌ Error updating existing Stripe subscription:',
          updateError
        )
        return NextResponse.json(
          {
            error: 'Failed to update subscription record',
            details: updateError.message,
          },
          { status: 500 }
        )
      }
      data = updateData
    } else {
      // Create new subscription
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
        .select()

      if (insertError) {
        console.error('❌ Error creating new Stripe subscription:', insertError)
        return NextResponse.json(
          {
            error: 'Failed to create subscription record',
            details: insertError.message,
          },
          { status: 500 }
        )
      }
      data = insertData
    }

    console.log(
      '✅ Stripe subscription successfully created/updated in database:',
      data
    )

    return NextResponse.json({
      success: true,
      message: 'Stripe subscription activated successfully',
      subscription: data[0],
      session_id: sessionId,
      stripe_subscription_id: subscription.id,
    })
  } catch (error) {
    console.error('💥 Stripe manual activation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
