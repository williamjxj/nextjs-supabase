import { NextRequest, NextResponse } from 'next/server'
import { seedStripeProducts } from '@/lib/seed-stripe-products'

export async function POST(request: NextRequest) {
  try {
    // Basic auth check - only allow in development or with admin key
    const adminKey = request.headers.get('x-admin-key')
    const expectedKey = process.env.ADMIN_SEED_KEY
    
    if (process.env.NODE_ENV === 'production' && adminKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting Stripe products seeding...')
    await seedStripeProducts()
    
    return NextResponse.json({ 
      success: true,
      message: 'Stripe products seeded successfully' 
    })
  } catch (error) {
    console.error('Failed to seed Stripe products:', error)
    return NextResponse.json(
      { 
        error: 'Failed to seed products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to seed Stripe products',
    instructions: 'Send a POST request to this endpoint to seed subscription products in Stripe'
  })
}
