import { NextRequest, NextResponse } from 'next/server'
import {
  stripe,
  IMAGE_PRICE_CONFIG,
  ImageLicenseType,
  SUBSCRIPTION_PRICE_CONFIG,
  SubscriptionType,
} from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSubscriptionPlanByType } from '@/lib/supabase/subscriptions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      imageId,
      licenseType = 'standard',
      subscriptionType,
      isSubscription = false,
    } = body

    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession()
    const userId = authSession?.user?.id

    // Debug logging
    console.log('=== Stripe Checkout API Debug ===')
    console.log('Has session:', !!authSession)
    console.log('Has user:', !!authSession?.user)
    console.log('User ID:', userId)
    console.log('Is subscription:', isSubscription)
    console.log('Session expires at:', authSession?.expires_at)
    
    // Debug cookies
    const cookieHeader = request.headers.get('cookie')
    console.log('Cookie header present:', !!cookieHeader)
    console.log('Cookie header length:', cookieHeader?.length || 0)

    // If it's a subscription checkout
    if (isSubscription) {
      // Verify subscription type is valid
      if (
        !subscriptionType ||
        !Object.keys(SUBSCRIPTION_PRICE_CONFIG).includes(subscriptionType)
      ) {
        return NextResponse.json(
          { error: 'Invalid subscription type' },
          { status: 400 }
        )
      }

      // Get subscription plan details from the database
      const subscriptionPlan = await getSubscriptionPlanByType(
        subscriptionType as SubscriptionType
      )

      if (!subscriptionPlan) {
        return NextResponse.json(
          { error: 'Subscription plan not found' },
          { status: 404 }
        )
      }

      // If no user is logged in, redirect to login
      if (!userId) {
        return NextResponse.json(
          { error: 'Login required for subscriptions', requireLogin: true },
          { status: 401 }
        )
      }

      // Check if user already has a Stripe customer ID
      const { data: customer, error: customerError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

      // Create or retrieve Stripe customer
      let stripeCustomerId = customer?.stripe_customer_id

      if (!stripeCustomerId) {
        // Get user details for the customer
        const { data: user } = await supabase.auth.getUser()

        // Create a new customer in Stripe
        const newCustomer = await stripe.customers.create({
          email: user.user?.email,
          metadata: {
            userId: userId,
          },
        })

        stripeCustomerId = newCustomer.id

        // Save Stripe customer ID to user profile
        await supabase.from('profiles').upsert({
          id: userId,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
      }

      // Create the checkout session for subscription
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: stripeCustomerId,
        line_items: [
          {
            price: subscriptionPlan.stripe_price_id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.APP_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/membership`,
        metadata: {
          userId,
          subscriptionType,
          isSubscription: 'true',
        },
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // For one-time image purchases
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
    const checkoutSession = await stripe.checkout.sessions.create({
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
        userId: userId || image.user_id || null,
        isSubscription: 'false',
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
