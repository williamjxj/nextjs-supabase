import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Development-only webhook test endpoint
 * This simulates webhook calls for completed checkout sessions
 * Use this when webhooks can't reach localhost during development
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Session is not paid' },
        { status: 400 }
      )
    }

    // Check if purchase already exists
    const supabase = await createServerSupabaseClient()
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single()

    if (existingPurchase) {
      return NextResponse.json({
        message: 'Purchase record already exists',
        purchaseId: existingPurchase.id,
      })
    }

    // Create the purchase record (same logic as webhook)
    const userId = session.metadata?.userId
    const purchaseData = {
      image_id: session.metadata?.imageId,
      user_id: userId && userId !== 'anonymous' ? userId : null,
      license_type: session.metadata?.licenseType,
      amount_paid: session.amount_total,
      currency: session.currency,
      stripe_session_id: session.id,
      payment_method: 'stripe',
      payment_status: 'completed',
      purchased_at: new Date().toISOString(),
    }

    const { data: purchase, error: insertError } = await supabase
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create purchase record', details: insertError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Purchase record created successfully',
      purchase,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process webhook test' },
      { status: 500 }
    )
  }
}
