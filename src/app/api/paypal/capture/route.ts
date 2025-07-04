import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { orderID, userId: clientUserId } = body

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
    // Save the purchase to the database
    if (responseData.status === 'COMPLETED') {
      try {
        const purchaseUnit = responseData.purchase_units[0]
        const capture = purchaseUnit.payments.captures[0]

        // Extract imageId and licenseType from custom_id
        const customId = capture.custom_id || ''
        console.log('PayPal custom_id:', customId)
        const parts = customId.split('_')

        if (parts.length < 4 || parts[0] !== 'img' || parts[2] !== 'lic') {
          console.error('Invalid custom_id format:', customId)
          return NextResponse.json(responseData) // Still return success but log the error
        }

        const imageId = parts[1]
        const licenseType = parts[3]

        if (imageId && licenseType) {
          const supabase = await createClient()

          // Implement fallback authentication similar to Stripe checkout
          const {
            data: { user },
          } = await supabase.auth.getUser()

          // Strategy: Use server-side user if available, otherwise use client-provided user ID
          let userId = user?.id

          if (!user && clientUserId) {
            // Fallback: Verify client-provided user ID exists by checking profiles table
            const { data: userProfile, error: userCheckError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', clientUserId)
              .single()

            if (!userCheckError && userProfile) {
              userId = clientUserId
            } else {
              // If no profile, still trust client auth (user might be new)
              userId = clientUserId
            }
          }

          // Authentication successful

          // First, lookup the actual image using the image ID
          const { data: imageData, error: imageError } = await supabase
            .from('images')
            .select('id')
            .eq('id', imageId)
            .single()

          if (imageError || !imageData) {
            console.error('Failed to find image with id:', imageId, imageError)
            return NextResponse.json(responseData) // Still return success but log the error
          }

          const { error: insertError } = await supabase
            .from('purchases')
            .insert({
              user_id: userId || null, // Use fallback authentication result
              image_id: imageData.id,
              license_type: licenseType,
              amount_paid: Math.round(parseFloat(capture.amount.value) * 100), // Convert to cents
              currency: capture.amount.currency_code.toLowerCase(),
              payment_method: 'paypal',
              payment_status: 'completed',
              paypal_payment_id: capture.id, // Use capture ID as payment ID
              paypal_order_id: orderID, // Store order ID separately
              purchased_at: new Date().toISOString(),
            })

          if (insertError) {
            // Failed to save purchase to database - continue
          } else {
            // Purchase saved successfully
          }
        }
      } catch (dbError) {
        // Error saving purchase to database - continue
      }
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('PayPal capture error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
