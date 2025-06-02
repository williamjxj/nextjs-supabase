import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get purchase details from database
    const supabase = await createServerSupabaseClient()
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(
        `
        *,
        images (
          id,
          original_name,
          storage_url,
          file_size,
          mime_type
        )
      `
      )
      .eq('stripe_session_id', sessionId)
      .single()

    if (purchaseError) {
      console.error('Purchase lookup error:', purchaseError)
      // If not found in database, fall back to Stripe metadata
      const imageId = session.metadata?.imageId
      if (imageId) {
        const { data: image, error: imageError } = await supabase
          .from('images')
          .select('*')
          .eq('id', imageId)
          .single()

        if (!imageError && image) {
          return NextResponse.json({
            imageId: image.id,
            imageName: image.original_name,
            imageUrl: image.storage_url,
            licenseType: session.metadata?.licenseType || 'standard',
            amount: (session.amount_total || 0) / 100, // Convert from cents
            currency: session.currency || 'usd',
            paymentStatus: session.payment_status,
            sessionId: session.id,
          })
        }
      }

      return NextResponse.json(
        { error: 'Purchase details not found' },
        { status: 404 }
      )
    }

    // Return complete purchase details
    return NextResponse.json({
      imageId: purchase.image_id,
      imageName: purchase.images?.original_name || 'Unknown Image',
      imageUrl: purchase.images?.storage_url || '',
      licenseType: purchase.license_type,
      amount: purchase.amount_paid / 100, // Convert from cents
      currency: purchase.currency,
      paymentStatus: purchase.payment_status,
      sessionId: purchase.stripe_session_id,
      purchasedAt: purchase.purchased_at,
      fileSize: purchase.images?.file_size,
      mimeType: purchase.images?.mime_type,
    })
  } catch (error) {
    console.error('Error fetching purchase details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase details' },
      { status: 500 }
    )
  }
}
