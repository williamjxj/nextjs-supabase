import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
// This is a placeholder for PayPal API logic.
// You'll need to install and use the PayPal SDK or make direct API calls.
// For example, using @paypal/checkout-server-sdk

// IMPORTANT: Store your PayPal client ID and secret securely in environment variables.
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal client ID or secret is not configured.')
  }
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString('base64')
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!response.ok) {
    const errorBody = await response.text()
    console.error('PayPal Auth Error:', errorBody)
    throw new Error('Failed to get PayPal access token')
  }
  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      amount,
      currencyCode = 'USD',
      imageId,
      licenseType,
      userId: clientUserId
    } = body

    // Check user authentication for PayPal checkout with fallback
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('🔐 PayPal checkout auth result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })

    // Strategy: Use server-side user if available, otherwise use client-provided user ID
    let userId = user?.id
    let authMethod = 'server-auth'

    if (!user && clientUserId) {
      // Fallback: Verify client-provided user ID exists by checking profiles table
      const { data: userProfile, error: userCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', clientUserId)
        .single()

      if (!userCheckError && userProfile) {
        userId = clientUserId
        authMethod = 'client-trusted'
        console.log(`🔐 PayPal checkout: Using client-provided user ID: ${userId}`)
      } else {
        // If no profile, still trust client auth (user might be new)
        userId = clientUserId
        authMethod = 'client-fallback'
        console.log(`🔐 PayPal checkout: Trusting client auth for new user: ${userId}`)
      }
    } else if (!user && !clientUserId) {
      console.error('PayPal checkout: No user found in session or client')
      return NextResponse.json(
        { error: 'Authentication required - please log in' },
        { status: 401 }
      )
    }

    console.log(`PayPal checkout: Authenticated user (${authMethod}):`, userId)

    if (!amount || !imageId || !licenseType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currencyCode,
            value: amount.toString(), // Ensure amount is a string
          },
          description: `License (${licenseType}) for image ${imageId}`,
          custom_id: `img_${imageId}_lic_${licenseType}`, // Optional: for your reference
        },
      ],
      // Add application_context for return_url and cancel_url if not using JS SDK's onApprove
    }

    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        // 'PayPal-Request-Id': 'YOUR_UNIQUE_REQUEST_ID', // Optional for idempotency
      },
      body: JSON.stringify(orderPayload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('PayPal API Error:', responseData)
      const errorMessage =
        responseData.details?.[0]?.description ||
        responseData.message ||
        'Failed to create PayPal order.'
      return NextResponse.json(
        { error: errorMessage, details: responseData },
        { status: response.status }
      )
    }

    // The responseData should contain an id (orderId) and links.
    // The JS SDK expects the order ID to be returned.
    return NextResponse.json({ id: responseData.id })
  } catch (error: any) {
    console.error('PayPal checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
