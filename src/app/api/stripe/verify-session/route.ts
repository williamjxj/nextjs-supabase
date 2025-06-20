import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Create admin client
const supabaseAdmin = createServiceRoleClient()

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Only process completed payments for one-time purchases
    if (session.payment_status !== 'paid' || session.mode !== 'payment') {
      return NextResponse.json(
        { error: 'Session not completed or not a one-time payment' },
        { status: 400 }
      )
    }

    // Extract metadata from session
    const imageId = session.metadata?.imageId
    const licenseType = session.metadata?.licenseType
    const userId = session.metadata?.userId

    if (!imageId || !userId) {
      return NextResponse.json(
        { error: 'Missing required metadata (imageId or userId)' },
        { status: 400 }
      )
    }

    // Check if purchase record already exists (webhook might have created it)
    const { data: existingPurchase } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single()

    let purchase = existingPurchase

    if (!existingPurchase) {
      // Create purchase record only if it doesn't exist
      const purchaseData = {
        image_id: imageId,
        user_id: userId,
        license_type: licenseType || 'standard',
        amount_paid: session.amount_total || 0,
        currency: session.currency || 'usd',
        stripe_session_id: session.id,
        payment_method: 'stripe',
        payment_status: 'completed',
        purchased_at: new Date().toISOString(),
      }

      const { data: newPurchase, error: insertError } = await supabaseAdmin
        .from('purchases')
        .insert([purchaseData])
        .select()
        .single()

      if (insertError) {
        // Check if it's a duplicate key error (race condition)
        if (insertError.code === '23505') {
          const { data: existingRecord } = await supabaseAdmin
            .from('purchases')
            .select('*')
            .eq('stripe_session_id', session.id)
            .single()

          if (existingRecord) {
            purchase = existingRecord
          } else {
            console.error('Error creating purchase record:', insertError)
            return NextResponse.json(
              {
                error: 'Failed to create purchase record',
                details: insertError.message,
              },
              { status: 500 }
            )
          }
        } else {
          console.error('Error creating purchase record:', insertError)
          return NextResponse.json(
            {
              error: 'Failed to create purchase record',
              details: insertError.message,
            },
            { status: 500 }
          )
        }
      } else {
        purchase = newPurchase
      }
    } else {
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase recorded successfully',
      purchase: purchase,
    })
  } catch (error) {
    console.error('Stripe verification error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process Stripe session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
