import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType,
} from '@/lib/subscription-config'

const COINBASE_COMMERCE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY
const COINBASE_COMMERCE_BASE_URL = 'https://api.commerce.coinbase.com'

async function createCoinbaseCharge(chargeData: any) {
  if (!COINBASE_COMMERCE_API_KEY) {
    throw new Error('Coinbase Commerce API key not configured')
  }

  const response = await fetch(`${COINBASE_COMMERCE_BASE_URL}/charges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': COINBASE_COMMERCE_API_KEY,
      'X-CC-Version': '2018-03-22',
    },
    body: JSON.stringify(chargeData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Coinbase Commerce API error: ${JSON.stringify(error)}`)
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

    // Create Coinbase Commerce charge for subscription
    const chargeData = {
      name: `${plan.name} - ${billingInterval === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`,
      description: plan.description,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toString(),
        currency: 'USD',
      },
      metadata: {
        user_id: user.id,
        plan_type: planType,
        billing_interval: billingInterval,
        subscription_type: 'crypto',
      },
      redirect_url: `${process.env.APP_URL}/account/subscriptions?success=true&provider=crypto`,
      cancel_url: `${process.env.APP_URL}/membership?cancelled=true&provider=crypto`,
    }

    let charge
    try {
      const response = await createCoinbaseCharge(chargeData)
      charge = response.data
    } catch (error) {
      console.error('Error creating Coinbase charge:', error)
      return NextResponse.json(
        {
          error: 'Failed to create crypto payment',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      chargeId: charge.id,
      chargeCode: charge.code,
      hostedUrl: charge.hosted_url,
      planType,
      billingInterval,
      amount,
      expiresAt: charge.expires_at,
    })
  } catch (error) {
    console.error('Error creating crypto subscription charge:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
