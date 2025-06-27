import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No authenticated user', details: userError },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS
    const supabaseAdmin = createServiceRoleClient()

    // Check if subscription already exists
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        message: 'Subscription already exists',
        subscription: existingSubscription,
      })
    }

    // Create a subscription record manually
    const subscriptionData = {
      user_id: user.id,
      plan_type: 'standard',
      price_monthly: 9.99,
      price_yearly: 99.99,
      status: 'active',
      billing_interval: 'monthly',
      stripe_subscription_id: 'manual_' + Date.now(),
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // 30 days from now
      features: [
        'unlimited_downloads',
        'high_resolution',
        'commercial_license',
      ],
    }

    const { data: newSubscription, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create subscription',
          details: insertError.message,
        },
        { status: 500 }
      )
    }

    // Verify the subscription was created by checking with regular client
    const { data: verifySubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: newSubscription,
      verification: verifySubscription,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No authenticated user', details: userError },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS
    const supabaseAdmin = createServiceRoleClient()

    // Delete manual subscriptions
    const { error: deleteError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .like('stripe_subscription_id', 'manual_%')

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Manual subscriptions cleaned up successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No authenticated user', details: userError },
        { status: 401 }
      )
    }

    // Check subscriptions table
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)

    // Check user_subscription_status view
    const { data: statusView, error: viewError } = await supabase
      .from('user_subscription_status')
      .select('*')
      .eq('user_id', user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      subscriptions: {
        data: subscriptions || [],
        error: subError?.message || null,
        count: subscriptions?.length || 0,
      },
      statusView: {
        data: statusView || [],
        error: viewError?.message || null,
        count: statusView?.length || 0,
      },
      diagnosis: {
        hasSubscriptionRecords: (subscriptions?.length || 0) > 0,
        hasStatusViewRecords: (statusView?.length || 0) > 0,
        issue:
          (subscriptions?.length || 0) === 0 && (statusView?.length || 0) > 0
            ? 'View has records but subscriptions table is empty - webhook not firing'
            : 'Normal state',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
