import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import {
  upsertProductRecord,
  upsertPriceRecord,
  deleteProductRecord,
  deletePriceRecord,
  manageSubscriptionStatusChange
} from '@/utils/supabase/admin_vercel'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
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
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const supabase = await createServerSupabaseClient()

    switch (event.type) {
      // Handle checkout session completed
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const isSubscription = session.metadata?.isSubscription === 'true'

        if (isSubscription) {
          // This is a subscription checkout
          await handleSubscriptionCheckoutCompleted(session)
        } else {
          // This is a one-time purchase
          await handlePurchaseCheckoutCompleted(session, supabase)
        }
        break
      }

      // Handle customer created
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        await handleCustomerCreated(customer)
        break
      }

      // Handle customer updated
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer
        await handleCustomerUpdated(customer)
        break
      }

      // Handle invoice payment succeeded (for subscription renewals)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      // Handle subscription updated
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      // Handle subscription deleted/canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      // Handle payment failures
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(paymentIntent)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Handler functions for different webhook events
async function handleSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.userId
  const subscriptionType = session.metadata?.subscriptionType

  if (!subscriptionId || !userId || !subscriptionType) {
    throw new Error('Missing required metadata in session')
  }

  // Get subscription details from Stripe
  const subscription = await StripeAdmin.getSubscription(subscriptionId)
  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionId}`)
  }
  
  // Create or update customer record
  if (session.customer) {
    const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer
    await SupabaseAdmin.upsertCustomer({
      userId: userId,
      stripeCustomerId: customer.id,
      email: customer.email || '',
    })
  }

  // Create subscription record
  await SupabaseAdmin.upsertSubscription({
    userId: userId,
    stripeSubscription: subscription,
    planType: subscriptionType,
  })
}

async function handleCustomerCreated(
  customer: Stripe.Customer
) {
  // Customer will be linked to user when they create a subscription
  // For now, just log the event
  console.log(`Customer created: ${customer.id}`)
}

async function handleCustomerUpdated(
  customer: Stripe.Customer
) {
  // For now, we don't have an updateCustomerByStripeId method
  // This could be implemented later if needed
  console.log(`Customer updated: ${customer.id}`)
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
) {
  // Only process subscription invoices
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  // Get subscription from database to get user info
  const { data: subscription, error } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (error || !subscription) {
    throw new Error(`Subscription not found for invoice: ${invoice.id}`)
  }

  // Record the invoice using the recordInvoice method
  await SupabaseAdmin.recordInvoice({
    stripeInvoice: invoice,
    userId: subscription.user_id,
    subscriptionId: subscription.id,
  })

  // Update subscription period and status if needed
  if (invoice.lines.data[0]?.period?.end) {
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        current_period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Failed to update subscription period:', updateError)
    }
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  // Update subscription in database using upsertSubscription
  // We need to get the current subscription to know the user and plan type
  const { data: currentSub, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, subscription_plans(type)')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (error || !currentSub) {
    console.error('Subscription not found for update:', subscription.id)
    return
  }

  // Use upsertSubscription to update
  await SupabaseAdmin.upsertSubscription({
    userId: currentSub.user_id,
    stripeSubscription: subscription,
    planType: (currentSub as any).subscription_plans.type,
  })
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  // Update subscription status to canceled
  await SupabaseAdmin.updateSubscriptionStatus({
    stripeSubscriptionId: subscription.id,
    status: 'canceled',
    canceledAt: new Date().toISOString(),
  })
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
) {
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  // Update subscription status to past_due
  await SupabaseAdmin.updateSubscriptionStatus({
    stripeSubscriptionId: subscriptionId,
    status: 'past_due',
  })

  // Get subscription to record failed invoice
  const { data: subscription, error } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (subscription) {
    // Record failed invoice
    await SupabaseAdmin.recordInvoice({
      stripeInvoice: invoice,
      userId: subscription.user_id,
      subscriptionId: subscription.id,
    })
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  // Log failed payment intent for debugging
  console.error(`Payment intent failed: ${paymentIntent.id}`, {
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    last_payment_error: paymentIntent.last_payment_error,
  })
}

async function handlePurchaseCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  // Handle legacy one-time purchase logic
  const purchaseData = {
    image_id: session.metadata?.imageId,
    user_id: session.metadata?.userId,
    license_type: session.metadata?.licenseType,
    amount: (session.amount_total || 0) / 100, // Convert from cents
    currency: session.currency || 'usd',
    stripe_session_id: session.id,
    status: 'completed',
  }

  const { error: insertError } = await supabase
    .from('purchases')
    .insert([purchaseData])

  if (insertError) {
    throw new Error(`Failed to record purchase: ${insertError.message}`)
  }
}
