import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe/config'
import {
  upsertProductRecord,
  upsertPriceRecord,
  deleteProductRecord,
  deletePriceRecord,
  manageSubscriptionStatusChange
} from '@/utils/supabase/admin'
import Stripe from 'stripe'

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!relevantEvents.has(event.type)) {
    console.log(`Unsupported event type: ${event.type}`)
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case 'product.created':
      case 'product.updated':
        await upsertProductRecord(event.data.object as Stripe.Product)
        break
      case 'price.created':
      case 'price.updated':
        await upsertPriceRecord(event.data.object as Stripe.Price)
        break
      case 'price.deleted':
        await deletePriceRecord(event.data.object as Stripe.Price)
        break
      case 'product.deleted':
        await deleteProductRecord(event.data.object as Stripe.Product)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription
        await manageSubscriptionStatusChange(
          subscription.id,
          subscription.customer as string,
          event.type === 'customer.subscription.created'
        )
        break
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        if (checkoutSession.mode === 'subscription') {
          const subscriptionId = checkoutSession.subscription
          await manageSubscriptionStatusChange(
            subscriptionId as string,
            checkoutSession.customer as string,
            true
          )
        }
        break
      default:
        throw new Error(`Unhandled relevant event type: ${event.type}`)
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
