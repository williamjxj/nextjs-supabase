import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'

// Create admin client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // Handle empty payload (for testing)
    if (!body || body.trim() === '') {
      console.log(
        'Empty Coinbase Commerce webhook payload received - likely a test request'
      )
      return NextResponse.json(
        { error: 'No webhook payload provided' },
        { status: 400 }
      )
    }

    let webhook
    try {
      webhook = JSON.parse(body)
    } catch (parseError) {
      console.log('Invalid JSON in Coinbase Commerce webhook:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Verify webhook authenticity (implement Coinbase Commerce webhook verification here)

    switch (webhook.type) {
      case 'charge:confirmed':
        await handleChargeConfirmed(webhook.data)
        break
      case 'charge:failed':
        await handleChargeFailed(webhook.data)
        break
      case 'charge:delayed':
        await handleChargeDelayed(webhook.data)
        break
      default:
        console.log(
          `Unhandled Coinbase Commerce webhook event: ${webhook.type}`
        )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Coinbase Commerce webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleChargeConfirmed(charge: any) {
  const userId = charge.metadata?.user_id
  const planType = charge.metadata?.plan_type || 'standard'
  const billingInterval = charge.metadata?.billing_interval || 'monthly'

  if (!userId) {
    console.error('No user ID found in Coinbase Commerce charge metadata')
    return
  }

  console.log(`Crypto subscription payment confirmed for user: ${userId}`)

  const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]

  // Create subscription record
  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan_type: planType,
      price_monthly: plan.priceMonthly,
      price_yearly: plan.priceYearly,
      status: 'active',
      billing_interval: billingInterval,
      stripe_subscription_id: null, // This is a crypto subscription
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() +
          (billingInterval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      features: plan.features,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id', // Update if subscription already exists for user
    }
  )

  if (error) {
    console.error('Error creating crypto subscription record:', error)
    throw error
  }
}

async function handleChargeFailed(charge: any) {
  const userId = charge.metadata?.user_id

  if (!userId) {
    console.error('No user ID found in failed charge metadata')
    return
  }

  console.log(`Crypto subscription payment failed for user: ${userId}`)

  // You might want to handle failed payments by updating subscription status
  // or sending notifications to the user
}

async function handleChargeDelayed(charge: any) {
  const userId = charge.metadata?.user_id

  if (!userId) {
    console.error('No user ID found in delayed charge metadata')
    return
  }

  console.log(`Crypto subscription payment delayed for user: ${userId}`)

  // Handle delayed payments - maybe update status to pending
}
