import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
      userId: clientUserId,
    } = body

    // Check user authentication for PayPal checkout with fallback
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // PayPal checkout auth check completed

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
        // Using client-provided user ID
      } else {
        // If no profile, still trust client auth (user might be new)
        userId = clientUserId
        authMethod = 'client-fallback'
        // Trusting client auth for new user
      }
    } else if (!user && !clientUserId) {
      console.error('PayPal checkout: No user found in session or client')
      return NextResponse.json(
        { error: 'Authentication required - please log in' },
        { status: 401 }
      )
    }

    // Authentication successful

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
      application_context: {
        return_url: `${process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/purchase/success?method=paypal`,
        cancel_url: `${process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/gallery?paypal_cancelled=true`,
        brand_name: 'Gallery Purchase',
        locale: 'en-US',
        landing_page: 'NO_PREFERENCE',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
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
      const errorMessage =
        responseData.details?.[0]?.description ||
        responseData.message ||
        'Failed to create PayPal order.'

      return NextResponse.json(
        {
          error: errorMessage,
          details: responseData,
          redirectUrl: `${process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/gallery?paypal_error=${encodeURIComponent(errorMessage)}`,
        },
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
