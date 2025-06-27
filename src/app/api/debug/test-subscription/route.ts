import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'

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

    console.log('🧪 Testing subscription creation for user:', user.id)

    // Test creating a subscription
    const result = await paymentService.createSubscription({
      userId: user.id,
      userEmail: user.email || '',
      planType: 'standard',
      billingInterval: 'monthly',
      paymentProvider: 'stripe',
      externalSubscriptionId: 'test_sub_' + Date.now(),
    })

    if (!result.success) {
      console.error('❌ Subscription creation failed:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: 'Failed to create test subscription',
        },
        { status: 500 }
      )
    }

    console.log('✅ Test subscription created:', result.subscriptionId)

    // Check if subscription was actually created
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Test subscription created successfully',
      subscriptionId: result.subscriptionId,
      subscription: subscription,
      fetchError: fetchError?.message || null,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('💥 Test subscription error:', error)
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

    console.log('🗑️ Cleaning up test subscriptions for user:', user.id)

    // Delete test subscriptions
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .like('stripe_subscription_id', 'test_sub_%')

    if (deleteError) {
      console.error('❌ Failed to delete test subscriptions:', deleteError)
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
      message: 'Test subscriptions cleaned up successfully',
    })
  } catch (error) {
    console.error('💥 Cleanup error:', error)
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
