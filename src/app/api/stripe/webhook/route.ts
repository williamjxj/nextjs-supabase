import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { getPlanByPriceId } from '@/lib/subscription-config'
import { paymentService } from '@/lib/payment-service'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  console.log(`🔔 Stripe webhook received: ${req.url}`)

  if (!body || body.trim() === '') {
    console.log('❌ No webhook payload provided')
    return NextResponse.json(
      { error: 'No webhook payload provided' },
      { status: 400 }
    )
  }

  if (!signature) {
    console.log('❌ Missing Stripe signature')
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
    console.log(
      `✅ Webhook signature verified for event: ${event.type} [${event.id}]`
    )
  } catch (err) {
    console.log(`❌ Webhook signature verification failed:`, err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    console.log(`🔄 Processing event: ${event.type} [${event.id}]`)

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
        console.log(`⚠️ Unhandled event type: ${event.type} [${event.id}]`)
    }

    console.log(`✅ Successfully processed event: ${event.type} [${event.id}]`)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(
      `💥 Webhook handler failed for event ${event.type} [${event.id}]:`,
      error
    )
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(subscription: any) {
  console.log(
    `🔄 handleSubscriptionChange called for subscription: ${subscription.id}`
  )

  const customerId = subscription.customer
  const subscriptionId = subscription.id
  const status = subscription.status

  console.log(`📋 Subscription details:`, {
    customerId,
    subscriptionId,
    status,
    metadata: subscription.metadata,
  })

  // Try to find user_id from the subscription metadata first
  let userId = subscription.metadata?.userId
  let planType = subscription.metadata?.planType
  let billingInterval = subscription.metadata?.billingInterval

  console.log(`🔍 Initial metadata extraction:`, {
    userId,
    planType,
    billingInterval,
  })

  // If no userId in metadata, try to get it from the customer
  if (!userId) {
    console.log(
      `🔍 No userId in subscription metadata, checking customer metadata...`
    )
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer && !customer.deleted) {
        userId = (customer as any).metadata?.supabaseUUID
        console.log(`✅ Found userId in customer metadata: ${userId}`)
      }
    } catch (error) {
      console.log(`❌ Error retrieving customer:`, error)
    }
  }

  if (!userId) {
    console.log(
      `❌ No userId found in subscription or customer metadata, skipping...`
    )
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
    console.log(`✅ Creating active subscription for user: ${userId}`)
    const subscriptionData = {
      userId,
      userEmail: '', // We don't have email in webhook, but it's not critical
      planType: planType as any,
      billingInterval: billingInterval as any,
      paymentProvider: 'stripe' as const,
      externalSubscriptionId: subscriptionId,
    }
    console.log(`📋 Subscription creation data:`, subscriptionData)

    const result = await paymentService.createSubscription(subscriptionData)

    if (!result.success) {
      console.log(`❌ Failed to create subscription:`, result.error)
      throw new Error(result.error)
    }
    console.log(`✅ Successfully created subscription:`, result.subscriptionId)
  } else {
    console.log(`🔄 Updating subscription status to: ${status}`)
    // Handle status updates (cancelled, expired, etc.)
    const result = await paymentService.updateSubscriptionStatus(
      userId,
      status === 'canceled' ? 'cancelled' : (status as any),
      subscriptionId
    )

    if (!result.success) {
      console.log(`❌ Failed to update subscription status:`, result.error)
      throw new Error(result.error)
    }
    console.log(`✅ Successfully updated subscription status`)
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
  console.log(
    `🔄 handleCheckoutSessionCompleted called for session: ${session.id}`
  )
  console.log(`📋 Session details:`, {
    mode: session.mode,
    metadata: session.metadata,
    subscription: session.subscription,
  })

  // Handle subscription checkout sessions
  if (session.mode === 'subscription') {
    console.log(`💳 Processing subscription checkout session`)

    // Get metadata from session
    const userId = session.metadata?.userId
    let planType = session.metadata?.planType
    let billingInterval = session.metadata?.billingInterval

    // If plan details aren't in session metadata, extract from subscription
    if (!planType || !billingInterval) {
      const subscriptionId = session.subscription
      if (subscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId as string
          )

          // Get plan details from the subscription's price ID
          const lineItems = subscription.items?.data?.[0]
          const priceId = lineItems?.price?.id

          if (priceId) {
            console.log(`🔍 Extracting plan details from price ID: ${priceId}`)
            const planDetails = getPlanByPriceId(priceId)
            if (planDetails) {
              planType = planDetails.planType
              billingInterval = planDetails.billingInterval
              console.log(`✅ Detected plan from price ID:`, {
                planType,
                billingInterval,
              })
            }
          }
        } catch (error) {
          console.log(
            `⚠️ Could not retrieve subscription for plan detection:`,
            error
          )
        }
      }
    }

    // Set defaults if still not found
    planType = planType || 'standard'
    billingInterval = billingInterval || 'monthly'

    console.log(`🔍 Extracted session metadata:`, {
      userId,
      planType,
      billingInterval,
    })

    if (!userId) {
      console.log(`❌ No userId in session metadata, skipping...`)
      return
    }

    // Get subscription details from Stripe
    const subscriptionId = session.subscription
    if (!subscriptionId) {
      console.log(`❌ No subscription ID in session, skipping...`)
      return
    }

    console.log(`🔍 Retrieving subscription details for: ${subscriptionId}`)

    try {
      const subscription = await stripe.subscriptions.retrieve(
        subscriptionId as string
      )

      console.log(`✅ Retrieved subscription:`, {
        id: subscription.id,
        status: subscription.status,
        metadata: subscription.metadata,
      })

      // Add the metadata to the subscription for processing
      subscription.metadata = {
        ...subscription.metadata,
        userId,
        planType,
        billingInterval,
      }

      console.log(`🔄 Processing subscription with enhanced metadata`)
      // Process the subscription using the same logic as subscription updates
      await handleSubscriptionChange(subscription)
    } catch (error) {
      console.log(`❌ Error retrieving subscription:`, error)
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
