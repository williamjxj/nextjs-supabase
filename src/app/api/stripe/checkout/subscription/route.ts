import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

async function createOrRetrieveCustomer(user: { id: string; email?: string }) {
  try {
    // Try to find existing customer by email
    if (user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (customers.data.length > 0) {
        return customers.data[0].id
      }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: user.email || '',
      metadata: {
        supabaseUUID: user.id,
      },
    })

    return customer.id
  } catch (error) {
    console.error('Error creating/retrieving customer:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Stripe subscription checkout started')
    const supabase = await createClient()

    // Debug: Check what cookies are available
    const cookies = request.cookies.getAll()
    console.log(
      '🍪 Stripe API cookies:',
      cookies.map(c => ({ name: c.name, hasValue: !!c.value }))
    )

    // Check if user is authenticated with detailed logging
    console.log('🔐 Checking authentication...')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('👤 Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    })

    if (authError || !user) {
      console.error('❌ Stripe subscription: Authentication failed', {
        authError: authError?.message,
        hasUser: !!user,
      })

      // Try to get user from session as fallback
      const {
        data: { session: authSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      const sessionUser = authSession?.user

      if (sessionError || !sessionUser) {
        console.error('❌ Session fallback also failed', {
          sessionError: sessionError?.message,
          hasSessionUser: !!sessionUser,
        })
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      console.log('✅ Using session user as fallback:', sessionUser.id)
      // Use session user as fallback
      const body = await request.json()
      const { priceId, successUrl, cancelUrl, trialPeriodDays } = body

      if (!priceId) {
        return NextResponse.json(
          { error: 'Price ID is required' },
          { status: 400 }
        )
      }

      console.log('💳 Creating/retrieving Stripe customer (fallback)...')
      const customerId = await createOrRetrieveCustomer({
        id: sessionUser.id,
        email: sessionUser.email || '',
      })

      console.log('🛒 Creating checkout session (fallback)...', {
        customerId,
        priceId,
        userId: sessionUser.id,
      })

      const stripeSession = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url:
          successUrl || `${request.nextUrl.origin}/account?success=true`,
        cancel_url: cancelUrl || `${request.nextUrl.origin}/membership`,
        metadata: {
          userId: sessionUser.id,
        },
        ...(trialPeriodDays && {
          subscription_data: {
            trial_period_days: trialPeriodDays,
          },
        }),
      })

      console.log('✅ Stripe session created (fallback):', stripeSession.id)
      return NextResponse.json({ sessionId: stripeSession.id })
    }

    console.log('✅ User authenticated:', user.id)

    const body = await request.json()
    const { priceId, successUrl, cancelUrl, trialPeriodDays } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    console.log('💳 Creating/retrieving Stripe customer...')
    // Get or create Stripe customer
    const customerId = await createOrRetrieveCustomer({
      id: user.id,
      email: user.email || '',
    })

    console.log('🛒 Creating checkout session...', {
      customerId,
      priceId,
      userId: user.id,
    })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url:
        successUrl ||
        `${request.nextUrl.origin}/account/subscription?success=true`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/pricing`,
      metadata: {
        userId: user.id,
      },
      ...(trialPeriodDays && {
        subscription_data: {
          trial_period_days: trialPeriodDays,
        },
      }),
    })

    console.log('✅ Stripe session created:', session.id)
    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('💥 Error creating subscription checkout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
