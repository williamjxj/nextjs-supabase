import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      console.log('❌ Authentication error:', error?.message || 'No user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching subscription for user:', user.id)

    // Use the existing subscriptions sync endpoint logic
    const { data: subscriptions, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (dbError) {
      console.error('❌ Database error fetching subscription:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription data' },
        { status: 500 }
      )
    }

    const dbSubscription = subscriptions?.[0]

    if (dbSubscription) {
      // Return subscription data from database with proper formatting
      return NextResponse.json({
        subscription: {
          id: dbSubscription.id,
          status: dbSubscription.status,
          current_period_end: dbSubscription.current_period_end,
          current_period_start: dbSubscription.current_period_start,
          created_at: dbSubscription.created_at,
          plan_name: dbSubscription.plan_type,
          plan_type: dbSubscription.plan_type,
          amount:
            dbSubscription.billing_interval === 'monthly'
              ? dbSubscription.price_monthly
              : dbSubscription.price_yearly,
          price_monthly: dbSubscription.price_monthly,
          price_yearly: dbSubscription.price_yearly,
          currency: 'usd',
          interval: dbSubscription.billing_interval,
          billing_interval: dbSubscription.billing_interval,
          cancel_at_period_end: false,
          features: dbSubscription.features,
          payment_provider: 'stripe', // Since we're using Stripe for most subscriptions
        },
      })
    }

    console.log('❌ No active subscription found in database')

    // If no active subscription found, try Stripe as fallback
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      console.log('❌ No Stripe customer ID found')
      return NextResponse.json({ subscription: null })
    }

    console.log('🔍 Checking Stripe for customer:', profile.stripe_customer_id)

    // Get active subscriptions from Stripe
    const subscriptions_stripe = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions_stripe.data.length === 0) {
      console.log('❌ No active Stripe subscriptions found')
      return NextResponse.json({ subscription: null })
    }

    const subscription = subscriptions_stripe.data[0]
    const price = await stripe.prices.retrieve(
      subscription.items.data[0].price.id
    )
    const product = await stripe.products.retrieve(price.product as string)

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: (subscription as any).current_period_end ?? 0,
        current_period_start: (subscription as any).current_period_start ?? 0,
        created_at:
          (subscription as any).created || (subscription as any).start_date,
        plan_name: product.name,
        plan_type: product.name.toLowerCase().includes('premium')
          ? 'premium'
          : 'standard',
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        billing_interval: price.recurring?.interval,
        cancel_at_period_end:
          (subscription as any).cancel_at_period_end ?? false,
        payment_provider: 'stripe',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
