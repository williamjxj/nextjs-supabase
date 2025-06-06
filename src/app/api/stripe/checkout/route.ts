import { NextRequest, NextResponse } from 'next/server'
import { stripe, IMAGE_PRICE_CONFIG, ImageLicenseType } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageId, licenseType = 'standard' } = body

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
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

    // Get image details from database
    const supabase = await createServerSupabaseClient()
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (imageError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const priceConfig = IMAGE_PRICE_CONFIG[licenseType as ImageLicenseType]

    // Prepare image URL for Stripe - ensure it's publicly accessible
    const imageUrl = image.storage_url

    // Check if URL is valid and publicly accessible
    const isValidUrl = (url: string) => {
      try {
        const urlObj = new URL(url)
        return urlObj.protocol === 'https:' || urlObj.protocol === 'http:'
      } catch {
        return false
      }
    }

    // Check if URL is publicly accessible (not localhost)
    const isPubliclyAccessible = (url: string) => {
      return (
        !url.includes('localhost') &&
        !url.includes('127.0.0.1') &&
        !url.includes('0.0.0.0')
      )
    }

    // Only include image if it's a valid, publicly accessible URL
    const productImages =
      isValidUrl(imageUrl) && isPubliclyAccessible(imageUrl) ? [imageUrl] : []

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: priceConfig.currency,
            product_data: {
              name: `${priceConfig.name} - ${image.original_name}`,
              description: priceConfig.description,
              images: productImages,
              metadata: {
                imageId: image.id,
                licenseType,
              },
            },
            unit_amount: priceConfig.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/gallery`,
      metadata: {
        imageId: image.id,
        licenseType,
        userId: image.user_id || null,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
