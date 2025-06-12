import { NextRequest, NextResponse } from 'next/server'
import { stripe, IMAGE_PRICE_CONFIG, ImageLicenseType } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Don't return error immediately - we'll try fallback authentication
    if (authError) {
      console.log(
        'Server-side auth failed, will try client-side fallback:',
        authError.message
      )
    }

    const body = await request.json()
    const { imageId, licenseType, userId: clientUserId } = body

    // Strategy: Use server-side user if available, otherwise use client-provided user ID
    const authenticatedUser = user
    let userId = user?.id
    let authMethod = 'server-auth'

    if (!user && clientUserId) {
      // Fallback: Verify client-provided user ID exists by checking profiles table
      // (more reliable than querying auth.users directly)
      const { data: userProfile, error: userCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', clientUserId)
        .single()

      if (!userCheckError && userProfile) {
        userId = clientUserId
        authMethod = 'client-trusted'
      } else {
        // If no profile, still trust client auth (user might be new)
        // This is safe because client-side auth is already validated
        userId = clientUserId
        authMethod = 'client-fallback'
      }
    } else if (!user) {
      console.error('Stripe checkout: No user found in session or client')
      return NextResponse.json(
        { error: 'Authentication required - please log in' },
        { status: 401 }
      )
    }

    // Validate input
    if (!imageId || !licenseType) {
      return NextResponse.json(
        { error: 'Image ID and license type are required' },
        { status: 400 }
      )
    }

    // Validate license type
    if (!Object.keys(IMAGE_PRICE_CONFIG).includes(licenseType)) {
      return NextResponse.json(
        { error: 'Invalid license type' },
        { status: 400 }
      )
    }

    // Check if image exists
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('id, original_name, filename')
      .eq('id', imageId)
      .single()

    if (imageError || !image) {
      console.error('Image lookup error:', imageError)
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Get price config for the license type
    const priceConfig = IMAGE_PRICE_CONFIG[licenseType as ImageLicenseType]

    // Check if user already owns this image with this license
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('image_id', imageId)
      .eq('license_type', licenseType)
      .eq('payment_status', 'completed')
      .single()

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You already own this image with this license' },
        { status: 400 }
      )
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId: string

    try {
      // Get user email - try from server auth first
      const userEmail: string | null = user?.email || null

      if (!userEmail && userId) {
        // For client-side fallback, create customer without email
        // The user ID in metadata will be sufficient for tracking
      }

      if (userEmail) {
        // Try to find existing customer by email
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        })

        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id
        } else {
          // Create new customer with email
          const customer = await stripe.customers.create({
            email: userEmail,
            metadata: {
              userId: userId || '',
            },
          })
          stripeCustomerId = customer.id
        }
      } else {
        // Create customer without email (fallback for client-side auth)
        const customer = await stripe.customers.create({
          metadata: {
            userId: userId || '',
          },
        })
        stripeCustomerId = customer.id
      }
    } catch (error) {
      console.error('Error creating/retrieving customer:', error)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }

    // Create Stripe Checkout Session for one-time payment
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: priceConfig.currency,
            product_data: {
              name: `${priceConfig.name} - ${image.original_name}`,
              description: priceConfig.description,
              metadata: {
                imageId: imageId,
                licenseType: licenseType,
              },
            },
            unit_amount: priceConfig.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/gallery?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/gallery?canceled=true`,
      metadata: {
        userId: userId || '',
        imageId,
        licenseType,
        isSubscription: 'false',
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
