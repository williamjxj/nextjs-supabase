import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType,
  STRIPE_PRICE_IDS,
} from '@/lib/subscription-config'

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    const { subscriptionId, newPlanType } = body

    if (!subscriptionId || !newPlanType) {
      return NextResponse.json(
        { error: 'Subscription ID and new plan type are required' },
        { status: 400 }
      )
    }

    // Validate plan type
    if (!Object.keys(SUBSCRIPTION_PLANS).includes(newPlanType)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan type' },
        { status: 400 }
      )
    }

    // Verify user is logged in and owns this subscription
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get subscription from database to verify ownership
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', session.user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or access denied' },
        { status: 404 }
      )
    }

    // Get new subscription plan details
    const newPlan = SUBSCRIPTION_PLANS[newPlanType as SubscriptionPlanType]

    if (!newPlan) {
      return NextResponse.json(
        { error: 'New subscription plan not found' },
        { status: 404 }
      )
    }

    // Get the monthly price ID (you could also add logic for yearly)
    const priceId = STRIPE_PRICE_IDS[newPlan.type]?.monthly

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not found for the selected plan' },
        { status: 404 }
      )
    }

    // Update the subscription in Stripe
    const updatedSubscription =
      await stripe.subscriptions.retrieve(subscriptionId)

    // Create a checkout session for subscription update
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/subscription`,
      customer: updatedSubscription.customer as string,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          subscriptionType: newPlanType,
          isSubscription: 'true',
          isUpdate: 'true',
        },
      },
    })

    return NextResponse.json({
      success: true,
      redirectUrl: checkoutSession.url,
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
