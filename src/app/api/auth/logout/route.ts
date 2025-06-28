import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  try {
    console.log('🔍 Server-side logout initiated')

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('🔍 Server-side logout error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('🔍 Server-side logout successful')

    // Create response with headers to clear cookies
    const response = NextResponse.json({ success: true })

    // Clear any auth-related cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  } catch (error) {
    console.error('🔍 Server-side logout exception:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
