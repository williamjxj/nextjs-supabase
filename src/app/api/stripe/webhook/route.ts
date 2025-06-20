import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { getPlanByPriceId } from '@/lib/subscription-config'
import { paymentService } from '@/lib/payment-service'

// Create admin client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  console.log('🎯 Stripe webhook received:', new Date().toISOString())

  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  // Enhanced logging for debugging
  console.log('📦 Webhook payload length:', body.length)
  console.log('🔐 Signature present:', !!signature)

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

  // Try to find user_id from the subscription metadata first
  let userId = subscription.metadata?.userId
  let planType = subscription.metadata?.planType
  let billingInterval = subscription.metadata?.billingInterval

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

  // If we don't have plan details from metadata, try to get them from the price
  if (!planType || !billingInterval) {
    const lineItems = subscription.items?.data?.[0]
    const priceId = lineItems?.price?.id

    if (priceId) {
      // Determine plan type from price ID using the mapping function
      const planDetails = getPlanByPriceId(priceId)
      planType = planDetails?.planType || planType || 'standard'
      billingInterval =
        planDetails?.billingInterval || billingInterval || 'monthly'
    }
  }

  // Ensure we have defaults
  planType = planType || 'standard'
  billingInterval = billingInterval || 'monthly'

  console.log('💾 Processing subscription with details:', {
    userId,
    planType,
    billingInterval,
    subscriptionId,
    status,
  })

  // Use unified payment service for subscription creation/update
  if (status === 'active') {
    const result = await paymentService.createSubscription({
      userId,
      userEmail: '', // We don't have email in webhook, but it's not critical
      planType: planType as any,
      billingInterval: billingInterval as any,
      paymentProvider: 'stripe',
      externalSubscriptionId: subscriptionId,
    })

    if (!result.success) {
      console.error(
        '❌ Error creating subscription via payment service:',
        result.error
      )
      throw new Error(result.error)
    }
  } else {
    // Handle status updates (cancelled, expired, etc.)
    const result = await paymentService.updateSubscriptionStatus(
      userId,
      status === 'canceled' ? 'cancelled' : (status as any),
      subscriptionId
    )

    if (!result.success) {
      console.error('❌ Error updating subscription status:', result.error)
      throw new Error(result.error)
    }
  }

  console.log('✅ Subscription successfully processed via payment service')
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

    // Get metadata from session
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

      // Add the metadata to the subscription for processing
      subscription.metadata = {
        ...subscription.metadata,
        userId,
        planType,
        billingInterval,
      }

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

  // Use unified payment service for purchase creation
  const result = await paymentService.createPurchase({
    userId: userId && userId !== 'anonymous' ? userId : undefined,
    imageId,
    licenseType: licenseType || 'standard',
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    paymentProvider: 'stripe',
    externalPaymentId: session.id,
  })

  if (!result.success) {
    console.error('Error creating purchase via payment service:', result.error)
    throw new Error(result.error)
  }

  console.log(`Purchase record created successfully for session ${session.id}`)
}
