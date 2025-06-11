import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Debug: Log all cookies with more detail
    const cookies = request.cookies.getAll()
    console.log('🍪 All cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`))
    
    // Look specifically for Supabase auth cookies
    const supabaseCookies = cookies.filter(c => c.name.startsWith('sb-'))
    console.log('🔐 Supabase cookies:', supabaseCookies.map(c => c.name))
    
    // Try to get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('📱 Session:', { 
      hasSession: !!session, 
      sessionError: sessionError?.message,
      sessionUser: session?.user?.id,
      expiresAt: session?.expires_at 
    })
    
    // Try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 User:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userError: userError?.message 
    })
    
    return NextResponse.json({
      success: true,
      debug: {
        cookieCount: cookies.length,
        cookieNames: cookies.map(c => c.name),
        supabaseCookieCount: supabaseCookies.length,
        supabaseCookieNames: supabaseCookies.map(c => c.name),
        hasSession: !!session,
        hasUser: !!user,
        userId: user?.id || null,
        sessionError: sessionError?.message || null,
        userError: userError?.message || null,
        sessionExpiresAt: session?.expires_at || null
      }
    })
  } catch (error: any) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
