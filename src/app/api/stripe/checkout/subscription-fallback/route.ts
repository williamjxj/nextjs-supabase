import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

async function createOrRetrieveCustomer(user: { id: string; email?: string }) {
  try {
    // Try to find existing customer by email
    if (user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (customers.data.length > 0) {
        return customers.data[0].id
      }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: user.email || '',
      metadata: {
        supabaseUUID: user.id,
      },
    })

    return customer.id
  } catch (error) {
    console.error('Error creating/retrieving customer:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Stripe subscription checkout started (fallback route)')

    const body = await request.json()
    let { priceId } = body
    const {
      successUrl,
      cancelUrl,
      trialPeriodDays,
      userId,
      userEmail,
      planType,
      billingInterval,
    } = body

    // This is a fallback route that bypasses server-side authentication
    // and uses client-provided user data directly

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required for fallback authentication' },
        { status: 400 }
      )
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    console.log(
      '🔄 Using fallback authentication with client-provided user:',
      userId
    )

    // Validate that the price ID exists in Stripe before proceeding
    try {
      console.log('🔍 Validating price ID:', priceId)
      await stripe.prices.retrieve(priceId)
      console.log('✅ Price ID is valid')
    } catch (priceError) {
      console.error('❌ Invalid price ID:', priceId, priceError)

      // Development mode: Use the first available price as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Looking for fallback price...')
        try {
          const availablePrices = await stripe.prices.list({
            active: true,
            limit: 10,
          })

          if (availablePrices.data.length > 0) {
            const fallbackPrice = availablePrices.data[0]
            console.log(
              '🔄 Using fallback price for development:',
              fallbackPrice.id
            )

            // Override the priceId for development testing
            priceId = fallbackPrice.id

            // If it's not a subscription price, we'll create a subscription session anyway for testing
            console.log(
              '⚠️ Note: Using non-subscription price for development testing'
            )
          } else {
            throw new Error('No prices available for development fallback')
          }
        } catch (fallbackError) {
          console.error('💥 Development fallback failed:', fallbackError)
          return NextResponse.json(
            {
              error: 'No Stripe prices configured',
              details:
                'Please create subscription prices in your Stripe Dashboard first',
              suggestion:
                'Go to https://dashboard.stripe.com/products and create subscription products',
            },
            { status: 400 }
          )
        }
      } else {
        // Production mode: Provide helpful error message with actual available prices
        try {
          const availablePrices = await stripe.prices.list({
            active: true,
            limit: 10,
            type: 'recurring', // Only subscription prices
          })

          const priceList = availablePrices.data.map(p => ({
            id: p.id,
            amount: p.unit_amount,
            currency: p.currency,
            interval: p.recurring?.interval,
          }))

          console.log('💰 Available subscription prices:', priceList)

          return NextResponse.json(
            {
              error: 'Invalid price ID',
              details: `Price ID '${priceId}' does not exist in your Stripe account`,
              availablePrices: priceList,
              suggestion:
                priceList.length > 0
                  ? `Try using one of these price IDs: ${priceList
                      .map(p => p.id)
                      .join(', ')}`
                  : 'No subscription prices found. Create subscription prices in your Stripe Dashboard first.',
            },
            { status: 400 }
          )
        } catch (listError) {
          return NextResponse.json(
            {
              error: 'Invalid price ID and unable to list alternatives',
              details: `Price ID '${priceId}' does not exist`,
              suggestion:
                'Check your Stripe Dashboard and update the price IDs in your environment variables',
            },
            { status: 400 }
          )
        }
      }
    }

    // Get or create Stripe customer using client-provided user data
    const customerId = await createOrRetrieveCustomer({
      id: userId,
      email: userEmail || '',
    })

    console.log('🛒 Creating checkout session (fallback)...', {
      customerId,
      priceId,
      userId,
    })

    // Check if the price is recurring (subscription) or one-time (payment)
    const priceDetails = await stripe.prices.retrieve(priceId)
    const isRecurring = !!priceDetails.recurring
    const checkoutMode = isRecurring ? 'subscription' : 'payment'

    console.log(
      `💳 Using checkout mode: ${checkoutMode} (recurring: ${isRecurring})`
    )

    // Create checkout session with appropriate mode
    const sessionConfig: any = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: checkoutMode,
      success_url:
        successUrl ||
        `${request.nextUrl.origin}/account/subscriptions?success=true`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/membership`,
      metadata: {
        userId: userId,
        planType: planType || 'standard',
        billingInterval: billingInterval || 'monthly',
        originalMode: 'subscription', // Mark that this was intended as a subscription
        developmentFallback: !isRecurring ? 'true' : 'false',
      },
    }

    // Add subscription-specific options only for recurring prices
    if (isRecurring && trialPeriodDays) {
      sessionConfig.subscription_data = {
        trial_period_days: trialPeriodDays,
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('✅ Stripe session created (fallback):', session.id)
    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('💥 Error creating subscription checkout (fallback):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
