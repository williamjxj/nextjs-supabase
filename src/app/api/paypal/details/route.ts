import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('Fetching PayPal purchase details...')
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get purchase details from database using PayPal order ID
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
      .or(`paypal_order_id.eq.${paymentId},paypal_payment_id.eq.${paymentId}`)
      .single()

    if (purchaseError || !purchase) {
      console.error('Purchase lookup error:', purchaseError)
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    // Format response
    const response = {
      imageId: purchase.image_id,
      imageName: purchase.images?.original_name || 'Unknown Image',
      imageUrl: purchase.images?.storage_url || '',
      licenseType: purchase.license_type,
      amount: purchase.amount_paid / 100, // Convert from cents to dollars
      currency: purchase.currency || 'usd',
      paymentStatus: purchase.payment_status,
      sessionId: paymentId, // Use payment ID as session ID for consistency
      purchasedAt: purchase.purchased_at,
      fileSize: purchase.images?.file_size,
      mimeType: purchase.images?.mime_type,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching PayPal purchase details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase details' },
      { status: 500 }
    )
  }
}
