import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      googleClientId: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID,
      hasGoogleSecret: !!process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET,
      googleSecretLength: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET?.length || 0,
      redirectUri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
      envVarsStatus: {
        clientId: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
        secret: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET ? 'Present' : 'Missing',
      }
    }

    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check OAuth configuration' },
      { status: 500 }
    )
  }
}
