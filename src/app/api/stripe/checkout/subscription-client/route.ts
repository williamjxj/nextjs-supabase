import { NextRequest, NextResponse } from 'next/server'
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
    console.log('🎯 Stripe subscription checkout (client fallback) started')

    const body = await request.json()
    const {
      priceId,
      successUrl,
      cancelUrl,
      trialPeriodDays,
      userId,
      userEmail,
    } = body

    // Validate required fields
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required for client-side checkout' },
        { status: 400 }
      )
    }

    console.log('💳 Using client-provided user info:', {
      userId,
      userEmail,
      priceId,
    })

    // Get or create Stripe customer using client-provided info
    const customerId = await createOrRetrieveCustomer({
      id: userId,
      email: userEmail || '',
    })

    console.log('🛒 Creating checkout session (client fallback)...', {
      customerId,
      priceId,
      userId,
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
        successUrl || `${request.nextUrl.origin}/account?success=true`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/membership`,
      metadata: {
        userId: userId,
      },
      ...(trialPeriodDays && {
        subscription_data: {
          trial_period_days: trialPeriodDays,
        },
      }),
    })

    console.log('✅ Stripe session created (client fallback):', session.id)
    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error(
      '💥 Error creating subscription checkout (client fallback):',
      error
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
