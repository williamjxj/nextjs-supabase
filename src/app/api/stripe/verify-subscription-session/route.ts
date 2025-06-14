import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Verifying Stripe session:', sessionId)

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    console.log('✅ Stripe session retrieved:', {
      id: session.id,
      mode: session.mode,
      status: session.status,
      payment_status: session.payment_status,
      subscription_id: session.subscription,
    })

    // For subscription mode, check if subscription was created
    if (session.mode === 'subscription') {
      if (session.status === 'complete' && session.subscription) {
        console.log('🎯 Subscription session completed successfully')
        return NextResponse.json({
          success: true,
          session_id: session.id,
          subscription_id: session.subscription,
          status: 'completed',
          message: 'Subscription session verified successfully',
        })
      } else {
        console.log('⚠️ Subscription session not complete:', {
          status: session.status,
          subscription: session.subscription,
        })
        return NextResponse.json({
          success: false,
          status: session.status,
          message: 'Subscription session not yet complete',
        })
      }
    }

    // For payment mode (not subscription)
    if (session.mode === 'payment') {
      return NextResponse.json({
        success: true,
        session_id: session.id,
        status: session.payment_status,
        message: 'Payment session verified',
      })
    }

    return NextResponse.json({
      success: true,
      session_id: session.id,
      mode: session.mode,
      status: session.status,
      message: 'Session verified',
    })
  } catch (error) {
    console.error('💥 Stripe session verification error:', error)

    if (
      error instanceof Error &&
      error.message.includes('No such checkout session')
    ) {
      return NextResponse.json(
        { error: 'Session not found', details: 'Invalid session ID' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Session verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
