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

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to get user', details: userError },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      )
    }

    // Check if profile exists (we can't directly query auth.users from client)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)

    // Get all profiles for comparison
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      database: {
        profile: profiles?.[0] || null,
        profileError,
      },
      allProfiles: {
        data: allProfiles || [],
        error: allProfilesError,
      },
    })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
