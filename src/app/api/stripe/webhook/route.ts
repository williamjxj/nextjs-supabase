import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { getPlanByPriceId } from '@/lib/subscription-config'
import { paymentService } from '@/lib/payment-service'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!body || body.trim() === '') {
    return NextResponse.json(
      { error: 'No webhook payload provided' },
      { status: 400 }
    )
  }

  if (!signature) {
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
      // Unhandled event type
    }

    return NextResponse.json({ received: true })
  } catch (error) {
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
      // Error retrieving customer
    }
  }

  if (!userId) {
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
      throw new Error(result.error)
    }
  }
}

async function handleSubscriptionCancellation(subscription: any) {
  const subscriptionId = subscription.id

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    throw error
  }
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription

  if (subscriptionId) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      throw error
    }
  }
}

async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription

  if (subscriptionId) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      throw error
    }
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  // Handle subscription checkout sessions
  if (session.mode === 'subscription') {
    // Get metadata from session
    const userId = session.metadata?.userId
    const planType = session.metadata?.planType || 'standard'
    const billingInterval = session.metadata?.billingInterval || 'monthly'

    if (!userId) {
      return
    }

    // Get subscription details from Stripe
    const subscriptionId = session.subscription
    if (!subscriptionId) {
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
      throw error
    }

    return
  }

  // Handle one-time payments (image purchases) - existing logic
  if (session.mode !== 'payment') {
    return
  }

  // Extract metadata from session
  const imageId = session.metadata?.imageId
  const licenseType = session.metadata?.licenseType
  const userId = session.metadata?.userId

  if (!imageId) {
    return
  }

  // Check if purchase already exists
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: existingPurchase } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('stripe_session_id', session.id)
    .single()

  if (existingPurchase) {
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
    throw new Error(result.error)
  }
}
