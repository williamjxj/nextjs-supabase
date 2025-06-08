import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_PRICE_CONFIG } from '@/lib/stripe'
import { NextResponse } from 'next/server'

// This API route will seed products and prices in the Vercel schema
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Create products and prices based on subscription config
    const results = []
    
    for (const [type, config] of Object.entries(SUBSCRIPTION_PRICE_CONFIG)) {
      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .upsert([{
          id: `prod_${type}`,
          name: config.name,
          description: config.description,
          active: true,
          metadata: { 
            index: type === 'standard' ? 0 : type === 'premium' ? 1 : 2,
            type: type
          }
        }], {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (productError) {
        console.error(`Error creating product ${type}:`, productError)
        continue
      }

      // Create price for the product
      const { data: price, error: priceError } = await supabase
        .from('prices')
        .upsert([{
          id: `price_${type}_monthly`,
          product_id: product.id,
          active: true,
          currency: config.currency,
          unit_amount: config.amount,
          interval: config.interval,
          interval_count: 1,
          type: 'recurring'
        }], {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()

      if (priceError) {
        console.error(`Error creating price for ${type}:`, priceError)
      } else {
        results.push({ product, price })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Products and prices seeded successfully',
      count: results.length,
      results: results
    })
  } catch (error) {
    console.error('Error in seed-plans API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
