import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Use session data if available, fallback to user data
    const finalUser = session?.user || user
    const finalError = sessionError || authError

    if (finalError) {
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
    return NextResponse.json(
      { error: 'Internal server error during session validation' },
      { status: 500 }
    )
  }
}
