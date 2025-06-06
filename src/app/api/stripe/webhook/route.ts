import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('Stripe webhook received')
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe signature')
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
    console.log('Webhook event constructed successfully:', event.type)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Processing completed checkout session:', session.id)

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

        console.log('Inserting purchase data:', purchaseData)

        const { error: insertError } = await supabase
          .from('purchases')
          .insert([purchaseData])

        if (insertError) {
          console.error('Failed to record purchase:', insertError)
          // Return error so Stripe retries the webhook
          return NextResponse.json(
            { error: 'Failed to record purchase' },
            { status: 500 }
          )
        } else {
          console.log('Purchase recorded successfully for session:', session.id)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        console.log('Payment failed:', paymentIntent.id)

        // You could record failed payments here if needed
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
