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
        { error: 'No authenticated user' },
        { status: 401 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        message: 'Profile already exists',
        profile: existingProfile,
      })
    }

    // Create profile manually
    const profileData = {
      id: user.id,
      email: user.email,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.preferred_username ||
        user.email?.split('@')[0],
      avatar_url:
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      provider: user.app_metadata?.provider || 'email',
    }

    console.log('Creating profile manually:', profileData)

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (insertError) {
      console.error('Profile creation error:', insertError)
      return NextResponse.json(
        {
          error: 'Failed to create profile',
          details: insertError,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile created successfully',
      profile: newProfile,
      userData: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
    })
  } catch (error) {
    console.error('Fix profiles error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error,
      },
      { status: 500 }
    )
  }
}
