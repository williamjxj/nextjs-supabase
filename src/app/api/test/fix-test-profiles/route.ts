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
    
    console.log('🔧 Starting test profile fix...')

    // Get all auth users with test emails
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to fetch auth users' },
        { status: 500 }
      )
    }

    // Filter for test users
    const testUsers = authUsers.users.filter(user => 
      user.email && user.email.match(/^test\d+@example\.com$/)
    )

    console.log(`📋 Found ${testUsers.length} test auth users`)

    if (testUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No test auth users found',
        fixed: 0
      })
    }

    const results = []
    const errors = []

    // Create profiles for each test user
    for (const user of testUsers) {
      try {
        const email = user.email!
        const displayName = email.split('@')[0] // e.g., "test1"

        console.log(`🔧 Fixing profile for: ${email}`)

        // Create or update profile
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          email: email,
          full_name: displayName,
          avatar_url: null,
          provider: 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

        if (profileError) {
          console.error(`❌ Profile error for ${email}:`, profileError)
          errors.push({
            email,
            userId: user.id,
            error: profileError.message
          })
          continue
        }

        console.log(`✅ Fixed profile for ${email}`)
        results.push({
          email,
          userId: user.id,
          displayName,
          status: 'fixed'
        })

      } catch (error) {
        console.error(`💥 Unexpected error for ${user.email}:`, error)
        errors.push({
          email: user.email,
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`🎉 Test profile fix completed!`)
    console.log(`✅ Fixed: ${results.length}`)
    console.log(`❌ Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: `Fixed ${results.length} test profiles successfully`,
      summary: {
        found: testUsers.length,
        fixed: results.length,
        failed: errors.length
      },
      fixedProfiles: results,
      errors: errors.length > 0 ? errors : undefined,
      instructions: {
        login: 'You can now login with these accounts',
        pattern: 'test1@example.com to test30@example.com',
        password: 'William1!'
      }
    })

  } catch (error) {
    console.error('💥 Test profile fix failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test profile fix failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check test users and their profiles
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

    // Get all auth users with test emails
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      return NextResponse.json(
        { error: 'Failed to fetch auth users' },
        { status: 500 }
      )
    }

    // Filter for test users
    const testUsers = authUsers.users.filter(user => 
      user.email && user.email.match(/^test\d+@example\.com$/)
    )

    // Get existing profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', testUsers.map(u => u.id))

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    const userStatus = testUsers.map(user => ({
      email: user.email,
      userId: user.id,
      hasProfile: profileMap.has(user.id),
      profileData: profileMap.get(user.id) || null
    }))

    const missingProfiles = userStatus.filter(u => !u.hasProfile)

    return NextResponse.json({
      success: true,
      summary: {
        totalTestUsers: testUsers.length,
        withProfiles: userStatus.length - missingProfiles.length,
        missingProfiles: missingProfiles.length
      },
      users: userStatus,
      instructions: {
        fix: 'Send POST request to this endpoint to fix missing profiles',
        pattern: 'test1@example.com to test30@example.com',
        password: 'William1!'
      }
    })

  } catch (error) {
    console.error('Error checking test profiles:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
