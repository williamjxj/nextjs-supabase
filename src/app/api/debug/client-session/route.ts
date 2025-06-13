import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userEmail, hasUser } = body

    console.log('🔍 Client session debug info:')
    console.log('  hasUser:', hasUser)
    console.log('  userId:', userId)
    console.log('  userEmail:', userEmail)

    // Check what cookies are sent from the client
    const cookies = request.cookies.getAll()
    console.log(
      '🍪 Cookies from client:',
      cookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueStart: c.value ? c.value.substring(0, 20) + '...' : 'empty',
      }))
    )

    return NextResponse.json({
      success: true,
      message: 'Debug info logged to server console',
      clientInfo: { hasUser, userId, userEmail },
      cookieCount: cookies.length,
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to process debug info' },
      { status: 500 }
    )
  }
}
