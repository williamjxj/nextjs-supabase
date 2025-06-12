import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client for testing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Test basic database connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false })

    if (testError) {
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message 
      })
    }

    // Get recent purchases
    const { data: recentPurchases, error: purchasesError } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false })

    // Check Stripe configuration
    const stripeConfig = {
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
      secretKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    }

    return NextResponse.json({
      status: 'success',
      stripeConfig,
      recentPurchases: recentPurchases || [],
      databaseConnection: 'working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test creating a purchase record manually
    const body = await request.json()
    const { userId, imageId, licenseType = 'standard' } = body

    if (!userId || !imageId) {
      return NextResponse.json({
        error: 'userId and imageId are required'
      }, { status: 400 })
    }

    const testPurchase = {
      image_id: imageId,
      user_id: userId,
      license_type: licenseType,
      amount_paid: 999, // $9.99 in cents
      currency: 'usd',
      stripe_session_id: `test_session_${Date.now()}`,
      payment_method: 'stripe',
      payment_status: 'completed',
      purchased_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('purchases')
      .insert([testPurchase])
      .select()

    if (error) {
      return NextResponse.json({
        error: 'Failed to create test purchase',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      purchase: data[0],
      message: 'Test purchase created successfully'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
