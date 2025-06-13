import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    console.log('🔍 Listing Stripe prices...')

    const prices = await stripe.prices.list({
      active: true,
      limit: 50,
    })

    const formattedPrices = prices.data.map(price => ({
      id: price.id,
      nickname: price.nickname,
      unit_amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring,
      product: price.product,
      active: price.active,
    }))

    console.log('💰 Available Stripe prices:', formattedPrices)

    return NextResponse.json({
      success: true,
      prices: formattedPrices,
      total: prices.data.length,
    })
  } catch (error) {
    console.error('❌ Error listing Stripe prices:', error)
    return NextResponse.json(
      { error: 'Failed to list Stripe prices', details: error },
      { status: 500 }
    )
  }
}
