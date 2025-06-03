import { NextRequest, NextResponse } from 'next/server'

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
    const { orderID } = await request.json()

    if (!orderID) {
      return NextResponse.json({ error: 'Missing orderID' }, { status: 400 })
    }

    const accessToken = await getPayPalAccessToken()

    const response = await fetch(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          // 'PayPal-Request-Id': 'YOUR_UNIQUE_CAPTURE_REQUEST_ID', // Optional for idempotency
        },
      }
    )

    const responseData = await response.json()

    if (!response.ok) {
      console.error('PayPal Capture API Error:', responseData)
      const errorMessage =
        responseData.details?.[0]?.description ||
        responseData.message ||
        'Failed to capture PayPal payment.'
      return NextResponse.json(
        { error: errorMessage, details: responseData },
        { status: response.status }
      )
    }

    // On successful capture, responseData contains the transaction details.
    // You should save relevant information (e.g., transaction ID, status, payer info) to your database.
    // For example, if the payment is for an image license:
    // const imageId = responseData.purchase_units[0]?.custom_id?.split('_')[1];
    // const licenseType = responseData.purchase_units[0]?.custom_id?.split('_')[3];
    // await recordPurchaseInDb(imageId, licenseType, responseData.id, 'paypal', responseData.payer.email_address);

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('PayPal capture error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
