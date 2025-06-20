import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Verify user is logged in and owns this subscription
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get subscription from database to verify ownership
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', session.user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or access denied' },
        { status: 404 }
      )
    }

    // Reactivate the subscription by removing cancel_at_period_end
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    // Update the subscription in database
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
      })
      .eq('id', subscription.id)

    return NextResponse.json({
      success: true,
      message: 'Subscription has been reactivated successfully',
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}
