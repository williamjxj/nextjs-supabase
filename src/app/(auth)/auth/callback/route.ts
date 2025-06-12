import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/gallery'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    )
  }

  if (code) {
    const supabase = await createServerSupabaseClient()

    try {
      // Exchange code for session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        return NextResponse.redirect(
          `${origin}/login?error=session_error&message=${encodeURIComponent(sessionError.message)}`
        )
      }

      if (sessionData.user) {
        // Check if this is a new user by looking for profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', sessionData.user.id)
          .single()

        // If no profile exists, create one (in case the trigger didn't work)
        if (profileError && profileError.code === 'PGRST116') {
          const metadata = sessionData.user.user_metadata || {}
          const appMetadata = sessionData.user.app_metadata || {}

          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: sessionData.user.id,
              email: sessionData.user.email,
              full_name: metadata.full_name || metadata.name || null,
              avatar_url: metadata.avatar_url || metadata.picture || null,
              provider: appMetadata.provider || 'email',
            })

          if (insertError) {
            console.error('Profile creation error:', insertError)
            // Continue anyway - profile creation is not critical for login
          }
        }

        // Successful authentication - redirect to intended destination
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        `${origin}/login?error=callback_error&message=${encodeURIComponent('Authentication callback failed')}`
      )
    }
  }

  // Check if user is already authenticated (sometimes happens with social auth)
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (user && !userError) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // No code parameter and no authenticated user - this indicates an issue
  console.error(
    'No code parameter and no authenticated user - possible OAuth issue'
  )
  return NextResponse.redirect(
    `${origin}/login?error=no_code&message=${encodeURIComponent('Authentication process incomplete. Please try again.')}`
  )
}
