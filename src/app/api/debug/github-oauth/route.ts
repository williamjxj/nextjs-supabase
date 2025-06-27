import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test GitHub OAuth configuration
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        url: data.url,
        provider: data.provider,
      },
    })
  } catch (error) {
    console.error('GitHub OAuth test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error,
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // Check current auth configuration
    const supabase = await createClient()

    // Get current user (if any)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    return NextResponse.json({
      currentUser: user
        ? {
            id: user.id,
            email: user.email,
            provider: user.app_metadata?.provider,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata,
          }
        : null,
      userError: userError?.message || null,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        authUrl: process.env.NEXTAUTH_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (error) {
    console.error('GitHub OAuth config check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check OAuth configuration',
        details: error,
      },
      { status: 500 }
    )
  }
}
