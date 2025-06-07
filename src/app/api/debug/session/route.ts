import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()
    
    const cookieHeader = request.headers.get('cookie')
    
    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      expiresAt: session?.expires_at,
      error: error?.message,
      cookiePresent: !!cookieHeader,
      cookieLength: cookieHeader?.length || 0,
      // Include parts of cookies for debugging (don't expose full cookies)
      cookieInfo: cookieHeader?.split(';').map(c => c.trim().split('=')[0]).join(', ')
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
