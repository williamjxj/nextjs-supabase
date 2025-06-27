import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No authenticated user', details: userError },
        { status: 401 }
      )
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get all OAuth users for comparison
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('provider', ['google', 'github'])
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      currentProfile: profile || null,
      profileError: profileError?.message || null,
      allOAuthProfiles: allProfiles || [],
      allProfilesError: allProfilesError?.message || null,
      comparison: {
        hasProfile: !!profile,
        isOAuthUser: ['google', 'github', 'facebook'].includes(
          user.app_metadata?.provider || ''
        ),
        provider: user.app_metadata?.provider,
        profileProvider: profile?.provider || null,
        providersMatch:
          user.app_metadata?.provider === profile?.provider || false,
      },
    })
  } catch (error) {
    console.error('OAuth comparison error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const supabase = await createClient()

    // Test GitHub OAuth initiation
    const { data: githubData, error: githubError } =
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`,
        },
      })

    // Test Google OAuth initiation
    const { data: googleData, error: googleError } =
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`,
        },
      })

    return NextResponse.json({
      github: {
        success: !githubError,
        error: githubError?.message || null,
        url: githubData?.url || null,
        provider: githubData?.provider || null,
      },
      google: {
        success: !googleError,
        error: googleError?.message || null,
        url: googleData?.url || null,
        provider: googleData?.provider || null,
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        authUrl: process.env.NEXTAUTH_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (error) {
    console.error('OAuth initiation test error:', error)
    return NextResponse.json(
      {
        error: 'Failed to test OAuth initiation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
