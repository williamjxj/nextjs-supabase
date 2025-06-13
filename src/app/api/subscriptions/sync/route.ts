import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  SubscriptionPlanType,
  SubscriptionStatus,
} from '@/lib/subscription-config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      subscriptionId,
      status,
      planType,
      billingInterval,
      provider,
      currentPeriodStart,
      currentPeriodEnd,
    } = body

    if (!subscriptionId || !status || !planType || !provider) {
      return NextResponse.json(
        { error: 'Missing required subscription data' },
        { status: 400 }
      )
    }

    // Update or create subscription record
    const subscriptionData = {
      user_id: user.id,
      plan_type: planType as SubscriptionPlanType,
      status: status as SubscriptionStatus,
      billing_interval: billingInterval || 'monthly',
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    }

    // Add provider-specific fields
    switch (provider) {
      case 'stripe':
        Object.assign(subscriptionData, {
          stripe_subscription_id: subscriptionId,
        })
        break
      case 'paypal':
        Object.assign(subscriptionData, {
          paypal_subscription_id: subscriptionId,
        })
        break
      case 'crypto':
        Object.assign(subscriptionData, {
          crypto_charge_id: subscriptionId,
        })
        break
    }

    // Upsert subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('Error syncing subscription:', error)
      return NextResponse.json(
        { error: 'Failed to sync subscription data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: data?.[0],
      message: 'Subscription status synchronized successfully',
    })
  } catch (error) {
    console.error('Error in subscription sync:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve current subscription status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's current subscription
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching subscription:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscription data' },
        { status: 500 }
      )
    }

    const subscription = subscriptions?.[0] || null

    return NextResponse.json({
      hasActiveSubscription: !!subscription,
      subscription,
      subscriptionTier: subscription?.plan_type || null,
      expiresAt: subscription?.current_period_end || null,
    })
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
