import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()
    const results = []
    const errors = []

    console.log('🔄 Starting bulk test account creation...')

    // Create accounts from test1 to test30
    for (let i = 1; i <= 30; i++) {
      const email = `test${i}@example.com`
      const password = 'William1!'
      const displayName = `test${i}`

      try {
        console.log(`📝 Creating account ${i}/30: ${email}`)

        // Create user in auth.users
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              full_name: displayName,
            },
          })

        if (authError) {
          console.error(`❌ Auth error for ${email}:`, authError)
          errors.push({
            email,
            step: 'auth_creation',
            error: authError.message,
          })
          continue
        }

        if (!authData.user) {
          console.error(`❌ No user data returned for ${email}`)
          errors.push({
            email,
            step: 'auth_creation',
            error: 'No user data returned',
          })
          continue
        }

        console.log(`✅ Auth user created for ${email}: ${authData.user.id}`)

        // Create or update profile in public.profiles (use upsert in case trigger already created it)
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: authData.user.id,
            email: email,
            full_name: displayName,
            avatar_url: null,
            provider: 'email',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        )

        if (profileError) {
          console.error(`❌ Profile error for ${email}:`, profileError)
          errors.push({
            email,
            step: 'profile_creation',
            error: profileError.message,
            userId: authData.user.id,
          })
          continue
        }

        console.log(`✅ Profile created for ${email}`)

        results.push({
          email,
          userId: authData.user.id,
          displayName,
          status: 'success',
        })

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`💥 Unexpected error for ${email}:`, error)
        errors.push({
          email,
          step: 'unexpected',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(`🎉 Bulk account creation completed!`)
    console.log(`✅ Successful: ${results.length}`)
    console.log(`❌ Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} test accounts successfully`,
      summary: {
        total: 30,
        successful: results.length,
        failed: errors.length,
      },
      accounts: results,
      errors: errors.length > 0 ? errors : undefined,
      instructions: {
        login: 'You can now login with any of these accounts',
        pattern: 'test1@example.com to test30@example.com',
        password: 'William1!',
        cleanup:
          'Use DELETE /api/test/cleanup-test-accounts to remove all test accounts',
      },
    })
  } catch (error) {
    console.error('💥 Bulk account creation failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Bulk account creation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check existing test accounts
export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()

    // Check existing test accounts
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at')
      .like('email', 'test%@example.com')
      .order('email')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch test accounts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Found ${profiles?.length || 0} existing test accounts`,
      accounts: profiles || [],
      instructions: {
        create: 'Send POST request to this endpoint to create 30 test accounts',
        pattern: 'test1@example.com to test30@example.com',
        password: 'William1!',
      },
    })
  } catch (error) {
    console.error('Error fetching test accounts:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
