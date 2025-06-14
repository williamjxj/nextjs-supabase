import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'

// Create admin client for manual subscription creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual PayPal subscription activation started')

    const body = await request.json()
    const { subscriptionId, userId, planType, billingInterval } = body

    if (!subscriptionId || !userId || !planType || !billingInterval) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: subscriptionId, userId, planType, billingInterval',
        },
        { status: 400 }
      )
    }

    // Development mode: Skip PayPal verification for test subscriptions
    const isDevelopmentTest =
      subscriptionId.startsWith('I-TEST') ||
      process.env.NODE_ENV === 'development'

    let paypalSubscription = null

    if (!isDevelopmentTest) {
      // Get PayPal access token and verify subscription
      const accessToken = await getPayPalAccessToken()

      // Fetch subscription details from PayPal
      const subscriptionResponse = await fetch(
        `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!subscriptionResponse.ok) {
        throw new Error('Failed to verify PayPal subscription')
      }

      paypalSubscription = await subscriptionResponse.json()
      console.log('✅ PayPal subscription verified:', {
        id: paypalSubscription.id,
        status: paypalSubscription.status,
        plan_id: paypalSubscription.plan_id,
      })

      // Only create subscription if PayPal shows it as active
      if (paypalSubscription.status !== 'ACTIVE') {
        return NextResponse.json(
          {
            error: `PayPal subscription is not active. Status: ${paypalSubscription.status}`,
          },
          { status: 400 }
        )
      }
    } else {
      console.log(
        '🔧 Development mode: Skipping PayPal verification for test subscription'
      )
    }

    const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]
    if (!plan) {
      return NextResponse.json(
        { error: `Invalid plan type: ${planType}` },
        { status: 400 }
      )
    }

    // Create subscription record in our database
    const subscriptionData = {
      user_id: userId,
      plan_type: planType,
      price_monthly: plan.priceMonthly,
      price_yearly: plan.priceYearly,
      status: 'active',
      billing_interval: billingInterval,
      stripe_subscription_id: null, // This is a PayPal subscription
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() +
          (billingInterval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      features: plan.features,
      updated_at: new Date().toISOString(),
    }

    console.log('💾 Creating subscription record:', subscriptionData)

    // First, check if user already has a subscription
    const { data: existingSubscription, error: checkError } =
      await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single()

    let data
    if (existingSubscription) {
      // Update existing subscription
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', userId)
        .select()

      if (updateError) {
        console.error('❌ Error updating existing subscription:', updateError)
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
        console.error('❌ Error creating new subscription:', insertError)
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
      '✅ PayPal subscription successfully created in database:',
      data
    )

    return NextResponse.json({
      success: true,
      message: 'PayPal subscription activated successfully',
      subscription: data[0],
    })
  } catch (error) {
    console.error('💥 PayPal manual activation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
