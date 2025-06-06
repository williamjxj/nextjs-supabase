import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object

        // Record the purchase in the database
        const supabase = await createServerSupabaseClient()

        const userId = session.metadata?.userId
        const purchaseData = {
          image_id: session.metadata?.imageId,
          user_id: userId && userId !== 'anonymous' ? userId : null,
          license_type: session.metadata?.licenseType,
          amount_paid: session.amount_total,
          currency: session.currency,
          stripe_session_id: session.id,
          payment_method: 'stripe',
          payment_status: 'completed',
          purchased_at: new Date().toISOString(),
        }

        const { error: insertError } = await supabase
          .from('purchases')
          .insert([purchaseData])

        if (insertError) {
          // Return error so Stripe retries the webhook
          return NextResponse.json(
            { error: 'Failed to record purchase' },
            { status: 500 }
          )
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        // Record failed payments if needed
        break
      }

      default:
      // Handle other event types if needed
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
