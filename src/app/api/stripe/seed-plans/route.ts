import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_PRICE_CONFIG } from '@/lib/stripe'
import { NextResponse } from 'next/server'

// This API route will seed the subscription plans in the database
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Convert the subscription price config to database format
    const plans = Object.entries(SUBSCRIPTION_PRICE_CONFIG).map(
      ([type, config]) => ({
        type,
        name: config.name,
        description: config.description,
        price: config.amount / 100, // Convert cents to dollars
        currency: config.currency,
        interval: config.interval,
        stripe_price_id: config.stripe_price_id || null,
        is_active: true,
        features: JSON.parse(getFeatures(type)),
      })
    )

    // Insert plans into the database
    const { data, error } = await supabase
      .from('subscription_plans')
      .upsert(plans, {
        onConflict: 'type',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Error seeding subscription plans:', error)
      return NextResponse.json(
        { error: 'Failed to seed subscription plans' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription plans seeded successfully',
      count: plans.length,
    })
  } catch (error) {
    console.error('Error in seed-plans API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get features for each plan type
function getFeatures(type: string): string {
  switch (type) {
    case 'standard':
      return JSON.stringify([
        'Unlimited thumbnail downloads',
        'Access to standard collection',
        'Personal and commercial use',
        'Digital usage unlimited',
        'Monthly renewal',
      ])
    case 'premium':
      return JSON.stringify([
        'Everything in Standard Plan',
        'Unlimited high-resolution downloads',
        'Access to premium collection',
        'Extended commercial rights',
        'Priority support',
        'Monthly renewal',
      ])
    case 'commercial':
      return JSON.stringify([
        'Everything in Premium Plan',
        'Access to entire collection',
        'Full commercial rights',
        'Merchandise and product use',
        'Advertising and marketing',
        'No attribution required',
        'Monthly renewal',
      ])
    default:
      return '[]'
  }
}
