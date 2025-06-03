import { NextRequest, NextResponse } from 'next/server'
// This is a placeholder for Cryptocurrency payment gateway logic.
// For example, using Coinbase Commerce API.

// IMPORTANT: Store your API keys securely in environment variables.
const COINBASE_COMMERCE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY
const COINBASE_COMMERCE_API_URL = 'https://api.commerce.coinbase.com'

export async function POST(request: NextRequest) {
  if (!COINBASE_COMMERCE_API_KEY) {
    return NextResponse.json(
      { error: 'Cryptocurrency payment gateway is not configured.' },
      { status: 500 }
    )
  }

  try {
    const {
      amount,
      currency = 'USD',
      description,
      metadata,
    } = await request.json()

    if (!amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields for crypto payment' },
        { status: 400 }
      )
    }

    const chargePayload = {
      name: description, // Or a more generic product name
      description: metadata?.licenseType
        ? `${description} - ${metadata.licenseType}`
        : description,
      local_price: {
        amount: amount.toString(),
        currency: currency,
      },
      pricing_type: 'fixed_price',
      metadata: {
        image_id: metadata?.imageId,
        license_type: metadata?.licenseType,
        // customer_id: "YOUR_CUSTOMER_ID", // If you have one
      },
      // redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/purchase/success?method=crypto`, // For successful payments
      // cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/purchase/cancel?method=crypto`,   // For cancelled payments
    }

    const response = await fetch(`${COINBASE_COMMERCE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_COMMERCE_API_KEY,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify(chargePayload),
    })

    const responseData = await response.json()

    if (!response.ok || responseData.error) {
      console.error('Coinbase Commerce API Error:', responseData)
      const errorMessage =
        responseData.error?.message || 'Failed to create crypto charge.'
      return NextResponse.json(
        { error: errorMessage, details: responseData.error },
        { status: response.status }
      )
    }

    // responseData.data should contain the charge object, including hosted_url
    if (responseData.data && responseData.data.hosted_url) {
      return NextResponse.json({
        checkoutUrl: responseData.data.hosted_url,
        chargeId: responseData.data.id,
      })
    } else {
      console.error(
        'Coinbase Commerce API did not return a hosted_url:',
        responseData
      )
      return NextResponse.json(
        { error: 'Could not retrieve checkout URL from crypto gateway.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Crypto checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// You would also need a webhook handler for Coinbase Commerce to confirm payments:
// e.g., /api/crypto/webhook
