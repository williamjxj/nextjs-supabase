import { NextRequest, NextResponse } from 'next/server'
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
    const {
      amount,
      currencyCode = 'USD',
      imageId,
      licenseType,
    } = await request.json()

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
