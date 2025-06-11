import { NextRequest, NextResponse } from 'next/server'
import {
  stripe,
  IMAGE_PRICE_CONFIG,
  ImageLicenseType,
} from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { imageId, licenseType } = body

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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Check if image exists
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('id, title, description')
      .eq('id', imageId)
      .single()

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
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
      // Try to find existing customer by email
      const customers = await stripe.customers.list({
        email: user.email!,
        limit: 1
      })

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            userId: userId,
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
              name: `${priceConfig.name} - ${image.title}`,
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
      success_url: `${process.env.APP_URL}/gallery?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/gallery`,
      metadata: {
        userId,
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
