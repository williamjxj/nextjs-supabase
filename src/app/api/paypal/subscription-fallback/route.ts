import { NextRequest, NextResponse } from 'next/server'
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
    const errorText = await response.text()
    throw new Error(`Failed to get PayPal access token: ${errorText}`)
  }

  const data = await response.json()
  return data.access_token
}

async function createPayPalProduct(
  accessToken: string,
  planType: SubscriptionPlanType
) {
  const plan = SUBSCRIPTION_PLANS[planType]

  const productData = {
    id: `gallery_${planType}`,
    name: plan.name,
    description: plan.description,
    type: 'SERVICE',
    category: 'SOFTWARE',
    // Only include URLs if we have a valid production URL
    ...(process.env.NEXT_PUBLIC_SITE_URL &&
      !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost') && {
        image_url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
        home_url: process.env.NEXT_PUBLIC_SITE_URL,
      }),
  }

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'PayPal-Request-Id': `product-${planType}-${Date.now()}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(productData),
  })

  if (!response.ok) {
    const error = await response.json()
    // If product already exists, that's okay
    if (
      error.name === 'RESOURCE_ALREADY_EXISTS' ||
      (error.name === 'UNPROCESSABLE_ENTITY' &&
        error.details?.some(
          (detail: any) => detail.issue === 'DUPLICATE_RESOURCE_IDENTIFIER'
        ))
    ) {
      console.log(`✅ PayPal product already exists: gallery_${planType}`)
      return { id: `gallery_${planType}` }
    }
    throw new Error(`Failed to create PayPal product: ${JSON.stringify(error)}`)
  }

  return await response.json()
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
    console.log('🎯 PayPal subscription checkout started (fallback route)')

    const body = await request.json()
    const { planType, billingInterval = 'monthly', userId, userEmail } = body

    // This is a fallback route that bypasses server-side authentication
    // and uses client-provided user data directly

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required for fallback authentication' },
        { status: 400 }
      )
    }

    if (!planType || !Object.keys(SUBSCRIPTION_PLANS).includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan type' },
        { status: 400 }
      )
    }

    console.log(
      '🔄 Using fallback authentication with client-provided user:',
      userId
    )

    const plan = SUBSCRIPTION_PLANS[planType as SubscriptionPlanType]
    const amount =
      billingInterval === 'yearly' ? plan.priceYearly : plan.priceMonthly

    // Get PayPal access token
    let accessToken
    try {
      accessToken = await getPayPalAccessToken()
      console.log('✅ PayPal access token obtained')
    } catch (tokenError) {
      console.error('❌ PayPal token error:', tokenError)

      if (process.env.NODE_ENV === 'development') {
        // In development, provide a mock response if PayPal isn't configured
        console.log(
          '🔧 Development mode: PayPal not configured, returning mock'
        )
        return NextResponse.json({
          approvalUrl: `${request.nextUrl.origin}/account?success=true&payment=paypal&mock=true`,
          message: 'PayPal not configured - using development mock',
          planType,
          amount: `$${amount}`,
        })
      }

      return NextResponse.json(
        {
          error: 'PayPal configuration error',
          details: 'PayPal credentials not properly configured',
          suggestion:
            'Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables',
        },
        { status: 500 }
      )
    }

    // Create or get PayPal product and plan dynamically
    let paypalPlan
    try {
      console.log('🛒 Creating PayPal product and plan...', {
        planType,
        billingInterval,
        amount,
      })

      // First, ensure the product exists
      console.log('📦 Creating/verifying PayPal product...')
      await createPayPalProduct(accessToken, planType)
      console.log('✅ PayPal product ready')

      // Then create the plan
      console.log('📋 Creating PayPal plan...')
      paypalPlan = await createPayPalPlan(
        accessToken,
        planType,
        billingInterval
      )
      console.log('✅ PayPal plan created:', paypalPlan.id)
    } catch (planError) {
      console.error('❌ Error creating PayPal plan:', planError)

      if (process.env.NODE_ENV === 'development') {
        // In development, provide a mock response if plan creation fails
        console.log('🔧 Development mode: Plan creation failed, returning mock')
        return NextResponse.json({
          approvalUrl: `${request.nextUrl.origin}/account?success=true&payment=paypal&mock=true`,
          message: 'PayPal plan creation failed - using development mock',
          planType,
          amount: `$${amount}`,
        })
      }

      return NextResponse.json(
        { error: 'Failed to create payment plan' },
        { status: 500 }
      )
    }

    // Create PayPal subscription
    const subscriptionData = {
      plan_id: paypalPlan.id,
      start_time: new Date(Date.now() + 60000).toISOString(), // Start 1 minute from now
      subscriber: {
        email_address: userEmail || 'test@example.com',
        name: {
          given_name: 'Gallery',
          surname: 'User',
        },
      },
      application_context: {
        brand_name: 'Gallery Subscription',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: `${request.nextUrl.origin}/account?success=true&payment=paypal`,
        cancel_url: `${request.nextUrl.origin}/membership?cancelled=true`,
      },
      custom_id: userId, // Store user ID for webhook processing
    }

    console.log('💳 Creating PayPal subscription...', {
      planId: paypalPlan.id,
      userId,
      amount,
    })

    const subscriptionResponse = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'PayPal-Request-Id': `subscription-${userId}-${Date.now()}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(subscriptionData),
      }
    )

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json()
      console.error('❌ PayPal subscription creation failed:', error)

      if (process.env.NODE_ENV === 'development') {
        console.log(
          '🔧 Development mode: Subscription creation failed, returning mock'
        )
        return NextResponse.json({
          approvalUrl: `${request.nextUrl.origin}/account?success=true&payment=paypal&mock=true`,
          message:
            'PayPal subscription creation failed - using development mock',
          planType,
          amount: `$${amount}`,
          error: error,
        })
      }

      return NextResponse.json(
        {
          error: 'Failed to create subscription',
          details: error,
        },
        { status: 500 }
      )
    }

    const subscription = await subscriptionResponse.json()
    console.log('✅ PayPal subscription created:', subscription.id)

    // Find the approval URL
    const approvalLink = subscription.links?.find(
      (link: any) => link.rel === 'approve'
    )

    if (!approvalLink) {
      throw new Error('No approval URL found in PayPal response')
    }

    console.log('🔗 PayPal approval URL:', approvalLink.href)

    return NextResponse.json({
      approvalUrl: approvalLink.href,
      subscriptionId: subscription.id,
      planType,
      amount: `$${amount}`,
      billingInterval,
    })
  } catch (error) {
    console.error('💥 Error creating PayPal subscription (fallback):', error)

    if (process.env.NODE_ENV === 'development') {
      console.log(
        '🔧 Development mode: Critical error, returning mock response'
      )
      return NextResponse.json({
        approvalUrl: `${request.nextUrl.origin}/account?success=true&payment=paypal&mock=true`,
        message: 'PayPal error - using development mock',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
