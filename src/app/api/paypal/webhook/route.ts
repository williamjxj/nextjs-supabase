import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'
import { paymentService } from '@/lib/payment-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // Handle empty payload (for testing)
    if (!body || body.trim() === '') {
      console.log(
        'Empty PayPal webhook payload received - likely a test request'
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
      console.log('Invalid JSON in PayPal webhook:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Verify webhook authenticity (implement PayPal webhook verification here)

    switch (webhook.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(webhook.resource)
        break
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(webhook.resource)
        break
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(webhook.resource)
        break
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(webhook.resource)
        break
      default:
        console.log(`Unhandled PayPal webhook event: ${webhook.event_type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionActivated(subscription: any) {
  const userId = subscription.custom_id
  const subscriptionId = subscription.id

  if (!userId) {
    console.error('No user ID found in PayPal subscription')
    return
  }

  console.log(
    `PayPal subscription activated: ${subscriptionId} for user: ${userId}`
  )

  // Determine plan type from subscription plan_id
  const planId = subscription.plan_id
  let planType = 'standard'
  let billingInterval = 'monthly'

  if (planId.includes('premium')) {
    planType = 'premium'
  } else if (planId.includes('commercial')) {
    planType = 'commercial'
  }

  if (planId.includes('yearly')) {
    billingInterval = 'yearly'
  }

  // Use unified payment service for PayPal subscription creation
  const result = await paymentService.createSubscription({
    userId,
    userEmail: '', // We don't have email in PayPal webhook
    planType: planType as any,
    billingInterval: billingInterval as any,
    paymentProvider: 'paypal',
    externalSubscriptionId: subscription.id,
  })

  if (!result.success) {
    console.error(
      'Error creating PayPal subscription via payment service:',
      result.error
    )
    throw new Error(result.error)
  }

  console.log('✅ PayPal subscription successfully created via payment service')
}

async function handleSubscriptionCancelled(subscription: any) {
  const subscriptionId = subscription.id
  const userId = subscription.custom_id

  console.log(`PayPal subscription cancelled: ${subscriptionId}`)

  // Use unified payment service for status update
  const result = await paymentService.updateSubscriptionStatus(
    userId,
    'cancelled'
  )

  if (!result.success) {
    console.error('Error cancelling PayPal subscription:', result.error)
    throw new Error(result.error)
  }

  console.log(
    '✅ PayPal subscription successfully cancelled via payment service'
  )
}

async function handleSubscriptionSuspended(subscription: any) {
  const subscriptionId = subscription.id

  console.log(`PayPal subscription suspended: ${subscriptionId}`)

  const supabaseAdmin = createServiceRoleClient()
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', subscription.custom_id)

  if (error) {
    console.error('Error suspending PayPal subscription:', error)
    throw error
  }
}

async function handlePaymentCompleted(payment: any) {
  // Handle successful subscription payments
  const subscriptionId = payment.billing_agreement_id

  if (subscriptionId) {
    console.log(`PayPal payment completed for subscription: ${subscriptionId}`)

    // You could update the subscription status or log the payment here
  }
}
