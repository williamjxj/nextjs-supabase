import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth debug started')

    // Debug: Check what cookies are available
    const cookies = request.cookies.getAll()
    console.log(
      '🍪 Debug cookies:',
      cookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      }))
    )

    // Test both server client types
    const serverClient = await createServerSupabaseClient()
    const routeClient = await createClient()

    // Test server client
    console.log('🖥️ Testing server client...')
    const serverSession = await serverClient.auth.getSession()
    const serverUser = await serverClient.auth.getUser()

    // Test route client
    console.log('🛣️ Testing route client...')
    const routeSession = await routeClient.auth.getSession()
    const routeUser = await routeClient.auth.getUser()

    const result = {
      timestamp: new Date().toISOString(),
      cookies: cookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
      serverClient: {
        session: {
          hasSession: !!serverSession.data.session,
          hasUser: !!serverSession.data.session?.user,
          error: serverSession.error?.message,
        },
        user: {
          hasUser: !!serverUser.data.user,
          userId: serverUser.data.user?.id,
          userEmail: serverUser.data.user?.email,
          error: serverUser.error?.message,
        },
      },
      routeClient: {
        session: {
          hasSession: !!routeSession.data.session,
          hasUser: !!routeSession.data.session?.user,
          error: routeSession.error?.message,
        },
        user: {
          hasUser: !!routeUser.data.user,
          userId: routeUser.data.user?.id,
          userEmail: routeUser.data.user?.email,
          error: routeUser.error?.message,
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    }

    console.log('📊 Auth debug result:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('💥 Auth debug error:', error)
    return NextResponse.json(
      {
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
