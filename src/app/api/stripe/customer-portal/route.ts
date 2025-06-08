import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StripeAdmin } from '@/lib/stripe/admin'
import { SupabaseAdmin } from '@/utils/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
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

    // Get customer from database
    const customer = await SupabaseAdmin.getCustomer(user.id)
    
    if (!customer) {
      return NextResponse.json(
        { error: 'No customer found. Please subscribe first.' },
        { status: 404 }
      )
    }

    // Create customer portal session
    const session = await StripeAdmin.createCustomerPortalSession({
      customerId: customer.stripe_customer_id,
      returnUrl: returnUrl || `${request.nextUrl.origin}/account/subscriptions`,
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
