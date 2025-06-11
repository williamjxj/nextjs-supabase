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
    const { returnUrl } = body

    // Get or create customer in Stripe
    const customer = await createOrRetrieveCustomer({
      uuid: user.id,
      email: user.email || ''
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'No customer found. Please subscribe first.' },
        { status: 404 }
      )
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer,
      return_url: returnUrl || `${request.nextUrl.origin}/account`,
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error creating customer portal session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
