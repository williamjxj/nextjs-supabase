import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { createOrRetrieveCustomer } from '@/utils/supabase/admin_vercel'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { priceId, successUrl, cancelUrl, trialPeriodDays } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer using Vercel pattern
    const customer = await createOrRetrieveCustomer({
      uuid: user.id,
      email: user.email || ''
    })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${request.nextUrl.origin}/account?success=true`,
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

    return NextResponse.json({ sessionId: session.id })

  } catch (error) {
    console.error('Error creating subscription checkout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
