import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test login started')
    const supabase = await createServerSupabaseClient()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    console.log('🔐 Attempting sign in with email:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Sign in failed:', error.message)
      return NextResponse.json(
        { error: 'Authentication failed', details: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      console.error('❌ No user returned from sign in')
      return NextResponse.json({ error: 'No user returned' }, { status: 401 })
    }

    console.log('✅ Sign in successful for user:', data.user.id)

    // Immediately check if session is available
    const sessionCheck = await supabase.auth.getSession()
    const userCheck = await supabase.auth.getUser()

    console.log('📊 Immediate session check:', {
      hasSession: !!sessionCheck.data.session,
      hasUser: !!userCheck.data.user,
      sessionError: sessionCheck.error?.message,
      userError: userCheck.error?.message,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session?.access_token ? 'present' : 'missing',
        refresh_token: data.session?.refresh_token ? 'present' : 'missing',
      },
      immediateCheck: {
        hasSession: !!sessionCheck.data.session,
        hasUser: !!userCheck.data.user,
        sessionError: sessionCheck.error?.message,
        userError: userCheck.error?.message,
      },
    })
  } catch (error) {
    console.error('💥 Test login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
