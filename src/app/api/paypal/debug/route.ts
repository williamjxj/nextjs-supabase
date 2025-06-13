import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    const orderId = searchParams.get('order_id')

    console.log('PayPal Debug - Looking for payment:', { paymentId, orderId })

    const supabase = await createServerSupabaseClient()

    // Get all PayPal purchases to debug
    const { data: allPurchases, error: allError } = await supabase
      .from('purchases')
      .select('*')
      .eq('payment_method', 'paypal')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('Recent PayPal purchases:', allPurchases)

    // Try to find specific purchase
    if (paymentId || orderId) {
      const { data: specificPurchase, error: specificError } = await supabase
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
        .or(
          `paypal_payment_id.eq.${paymentId || 'none'},paypal_order_id.eq.${
            orderId || 'none'
          }`
        )
        .maybeSingle()

      console.log('Specific purchase found:', specificPurchase)

      return NextResponse.json({
        allPurchases,
        specificPurchase,
        searchParams: { paymentId, orderId },
        errors: { allError, specificError },
      })
    }

    return NextResponse.json({
      allPurchases,
      searchParams: { paymentId, orderId },
      errors: { allError },
    })
  } catch (error) {
    console.error('PayPal debug error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error },
      { status: 500 }
    )
  }
}
