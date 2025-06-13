import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Session check started')
    const supabase = await createServerSupabaseClient()

    // Debug: Check what cookies are available
    const cookies = request.cookies.getAll()
    console.log(
      '🍪 Available cookies:',
      cookies.map(c => ({ name: c.name, hasValue: !!c.value }))
    )

    // Get current session and user with detailed logging
    console.log('📡 Getting session...')
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log('👤 Getting user...')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Debug logging
    console.log('🔒 Session result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      sessionError: sessionError?.message,
    })
    console.log('🔑 User result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    })

    // Use session data if available, fallback to user data
    const finalUser = session?.user || user
    const finalError = sessionError || authError

    if (finalError) {
      console.error('❌ Authentication failed:', finalError.message)
      return NextResponse.json(
        { error: 'Authentication failed', details: finalError.message },
        { status: 401 }
      )
    }

    if (!finalUser) {
      console.error('❌ No authenticated user found')
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      )
    }

    console.log('✅ Session check successful for user:', finalUser.id)
    // Return user info to confirm session is valid
    return NextResponse.json({
      success: true,
      user: {
        id: finalUser.id,
        email: finalUser.email,
        last_sign_in_at: finalUser.last_sign_in_at,
      },
      message: 'Session is valid',
    })
  } catch (error) {
    console.error('💥 Session check error:', error)
    return NextResponse.json(
      { error: 'Internal server error during session validation' },
      { status: 500 }
    )
  }
}
