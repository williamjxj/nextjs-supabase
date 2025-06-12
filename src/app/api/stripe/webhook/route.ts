import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { getPlanByPriceId, SUBSCRIPTION_PLANS } from '@/lib/subscription-config'

// Create admin client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  // Handle empty payload (for testing)
  if (!body || body.trim() === '') {
    console.log('Empty webhook payload received - likely a test request')
    return NextResponse.json(
      { error: 'No webhook payload provided' },
      { status: 400 }
    )
  }

  // Handle missing signature
  if (!signature) {
    console.log('Missing Stripe signature header')
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.log('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as any)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as any)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as any)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as any)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as any)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(subscription: any) {
  const customerId = subscription.customer
  const subscriptionId = subscription.id
  const status = subscription.status

  console.log(
    `Processing subscription ${subscriptionId} for customer ${customerId}`
  )

  // Try to find user_id from the subscription metadata or customer
  let userId = subscription.metadata?.userId

  // If no userId in metadata, try to get it from the customer
  if (!userId) {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer && !customer.deleted) {
        userId = (customer as any).metadata?.supabaseUUID
      }
    } catch (error) {
      console.error('Error retrieving customer:', error)
    }
  }

  if (!userId) {
    console.error(`No user ID found for subscription ${subscriptionId}`)
    return
  }

  // Get subscription plan details from Stripe
  const lineItems = subscription.items?.data?.[0]
  const priceId = lineItems?.price?.id

  // Determine plan type from price ID using the new mapping function
  const planDetails = getPlanByPriceId(priceId)
  const planType = planDetails?.planType || 'standard'
  const billingInterval = planDetails?.billingInterval || 'monthly'

  // Get plan configuration
  const planConfig = SUBSCRIPTION_PLANS[planType]
  const priceMonthly = planConfig?.priceMonthly || 9.99
  const priceYearly = planConfig?.priceYearly || 99.99

  // Get features for the plan
  const features = getSubscriptionFeatures(planType)

  // Update subscription in our database
  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan_type: planType,
      price_monthly: priceMonthly,
      price_yearly: priceYearly,
      status: status,
      billing_interval: billingInterval,
      stripe_subscription_id: subscriptionId,
      current_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      features: features,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'stripe_subscription_id',
    }
  )

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

// Helper function to get features for each plan type
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

async function handleSubscriptionCancellation(subscription: any) {
  const subscriptionId = subscription.id

  console.log(`Processing cancellation for subscription ${subscriptionId}`)

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription

  if (subscriptionId) {
    console.log(`Payment succeeded for subscription ${subscriptionId}`)

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      console.error('Error updating subscription after payment:', error)
      throw error
    }
  }
}

async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription

  if (subscriptionId) {
    console.log(`Payment failed for subscription ${subscriptionId}`)

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      console.error('Error updating subscription after payment failure:', error)
      throw error
    }
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log(`Processing checkout session completed: ${session.id}`)

  // Handle subscription checkout sessions
  if (session.mode === 'subscription') {
    console.log(`Processing subscription checkout session: ${session.id}`)

    const userId = session.metadata?.userId
    const planType = session.metadata?.planType || 'standard'
    const billingInterval = session.metadata?.billingInterval || 'monthly'

    if (!userId) {
      console.error(
        `No userId in metadata for subscription session ${session.id}`
      )
      return
    }

    // Get subscription details from Stripe
    const subscriptionId = session.subscription
    if (!subscriptionId) {
      console.error(`No subscription ID found for session ${session.id}`)
      return
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(
        subscriptionId as string
      )

      // Process the subscription using the same logic as subscription updates
      await handleSubscriptionChange(subscription)
    } catch (error) {
      console.error(
        'Error retrieving subscription for completed checkout:',
        error
      )
      throw error
    }

    return
  }

  // Handle one-time payments (image purchases) - existing logic
  if (session.mode !== 'payment') {
    console.log(`Skipping non-payment checkout session: ${session.id}`)
    return
  }

  // Extract metadata from session
  const imageId = session.metadata?.imageId
  const licenseType = session.metadata?.licenseType
  const userId = session.metadata?.userId

  if (!imageId) {
    console.error(`No imageId in metadata for session ${session.id}`)
    return
  }

  // Check if purchase already exists
  const { data: existingPurchase } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('stripe_session_id', session.id)
    .single()

  if (existingPurchase) {
    console.log(`Purchase already exists for session ${session.id}`)
    return
  }

  // Create purchase record
  const purchaseData = {
    image_id: imageId,
    user_id: userId && userId !== 'anonymous' ? userId : null,
    license_type: licenseType || 'standard',
    amount_paid: session.amount_total || 0,
    currency: session.currency || 'usd',
    stripe_session_id: session.id,
    payment_method: 'stripe',
    payment_status: 'completed',
    purchased_at: new Date().toISOString(),
  }

  const { error: insertError } = await supabaseAdmin
    .from('purchases')
    .insert([purchaseData])

  if (insertError) {
    console.error('Error creating purchase record:', insertError)
    throw insertError
  }

  console.log(`Purchase record created successfully for session ${session.id}`)
}
