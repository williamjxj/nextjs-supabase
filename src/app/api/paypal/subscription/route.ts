import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType,
} from '@/lib/subscription-config'

const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL || 'https://api.sandbox.paypal.com'
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET

async function getPayPalAccessToken() {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  return data.access_token
}

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
    const { planType, billingInterval = 'monthly' } = body

    if (!planType || !Object.keys(SUBSCRIPTION_PLANS).includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan type' },
        { status: 400 }
      )
    }

    const plan = SUBSCRIPTION_PLANS[planType as SubscriptionPlanType]
    const amount =
      billingInterval === 'yearly' ? plan.priceYearly : plan.priceMonthly

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()

    // Create PayPal subscription
    const subscriptionData = {
      plan_id: `${planType}_${billingInterval}`, // You'll need to create these plans in PayPal
      start_time: new Date(Date.now() + 60000).toISOString(), // Start 1 minute from now
      quantity: '1',
      application_context: {
        brand_name: 'Gallery Subscription',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: `${process.env.APP_URL}/account/subscriptions?success=true`,
        cancel_url: `${process.env.APP_URL}/membership?cancelled=true`,
      },
      custom_id: user.id, // Store user ID for webhook processing
    }

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'PayPal-Request-Id': `subscription-${Date.now()}-${user.id}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(subscriptionData),
      }
    )

    const subscription = await response.json()

    if (!response.ok) {
      console.error('PayPal subscription creation failed:', subscription)
      return NextResponse.json(
        {
          error: 'Failed to create PayPal subscription',
          details: subscription,
        },
        { status: 400 }
      )
    }

    // Find approval URL
    const approvalUrl = subscription.links?.find(
      (link: any) => link.rel === 'approve'
    )?.href

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'No approval URL found in PayPal response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl,
      planType,
      billingInterval,
      amount,
    })
  } catch (error) {
    console.error('Error creating PayPal subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
