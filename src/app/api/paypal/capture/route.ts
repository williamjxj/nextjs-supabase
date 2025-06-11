import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
        const parts = customId.split('_')
        const imageId = parts[1]
        const licenseType = parts[3]

        if (imageId && licenseType) {
          const supabase = await createServerSupabaseClient()

          // Implement fallback authentication similar to Stripe checkout
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser()

          console.log('🔐 PayPal capture auth result:', { 
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
              console.log(`🔐 PayPal capture: Using client-provided user ID: ${userId}`)
            } else {
              // If no profile, still trust client auth (user might be new)
              userId = clientUserId
              authMethod = 'client-fallback'
              console.log(`🔐 PayPal capture: Trusting client auth for new user: ${userId}`)
            }
          } else if (!user && !clientUserId) {
            console.error('PayPal capture: No user found in session or client')
            // Don't fail the transaction, but log the issue
            console.warn('⚠️ PayPal capture completing without user association')
          }

          console.log(`PayPal capture: Authenticated user (${authMethod}):`, userId)

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
              paypal_order_id: responseData.id, // Store order ID separately
              purchased_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('Failed to save purchase to database:', insertError)
          } else {
            console.log('Purchase saved successfully for image:', imageId)
          }
        }
      } catch (dbError) {
        console.error('Error saving purchase to database:', dbError)
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
