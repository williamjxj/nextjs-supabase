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
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured')
  }

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return data.access_token
}

async function createPayPalPlan(
  accessToken: string,
  planType: SubscriptionPlanType,
  billingInterval: 'monthly' | 'yearly'
) {
  const plan = SUBSCRIPTION_PLANS[planType]
  const amount =
    billingInterval === 'yearly' ? plan.priceYearly : plan.priceMonthly
  const intervalUnit = billingInterval === 'yearly' ? 'YEAR' : 'MONTH'

  const planData = {
    product_id: `gallery_${planType}`,
    name: `${plan.name} (${billingInterval})`,
    description: plan.description,
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: intervalUnit,
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Infinite cycles
        pricing_scheme: {
          fixed_price: {
            value: amount.toString(),
            currency_code: 'USD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
    taxes: {
      percentage: '0',
      inclusive: false,
    },
  }

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'PayPal-Request-Id': `plan-${planType}-${billingInterval}-${Date.now()}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(planData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create PayPal plan: ${JSON.stringify(error)}`)
  }

  return await response.json()
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

    // Create or get PayPal plan dynamically
    let paypalPlan
    try {
      paypalPlan = await createPayPalPlan(
        accessToken,
        planType,
        billingInterval
      )
    } catch (planError) {
      console.error('Error creating PayPal plan:', planError)
      return NextResponse.json(
        { error: 'Failed to create payment plan' },
        { status: 500 }
      )
    }

    // Create PayPal subscription
    const subscriptionData = {
      plan_id: paypalPlan.id,
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
        return_url: `${process.env.APP_URL}/account/subscription?success=true&payment=paypal`,
        cancel_url: `${process.env.APP_URL}/membership?cancelled=true&payment=paypal`,
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
