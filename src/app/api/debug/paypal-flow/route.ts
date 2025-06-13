import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())

  return NextResponse.json({
    message: 'PayPal Flow Debug Endpoint',
    timestamp: new Date().toISOString(),
    url: request.url,
    searchParams: params,
    paypalParams: {
      cancelled: params.paypal_cancelled,
      error: params.paypal_error,
      success: params.paypal_success,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      appUrl: process.env.APP_URL,
      paypalConfigured: !!(
        process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
      ),
    },
  })
}
