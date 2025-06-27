import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
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

    // Check if user exists in auth.users (we can't query this directly)
    // But we can check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Try to create profile if it doesn't exist
    let profileCreated = false
    if (!profile && !profileError) {
      const profileData = {
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.user_name ||
          user.user_metadata?.preferred_username ||
          user.email?.split('@')[0] ||
          '',
        avatar_url:
          user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        provider: user.app_metadata?.provider || 'email',
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (!createError) {
        profileCreated = true
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          provider: user.app_metadata?.provider,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata,
        },
        profile: newProfile || null,
        profileCreated,
        createError: createError?.message || null,
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      profile: profile || null,
      profileError: profileError?.message || null,
      profileCreated: false,
    })
  } catch (error) {
    console.error('OAuth test error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
