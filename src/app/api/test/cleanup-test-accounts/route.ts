import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()
    
    console.log('🧹 Starting test account cleanup...')

    // Get all test accounts first
    const { data: testProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email')
      .like('email', 'test%@example.com')

    if (fetchError) {
      console.error('❌ Error fetching test accounts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch test accounts' },
        { status: 500 }
      )
    }

    if (!testProfiles || testProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No test accounts found to cleanup',
        deleted: 0
      })
    }

    console.log(`📋 Found ${testProfiles.length} test accounts to cleanup`)

    const results = []
    const errors = []

    // Delete each test account
    for (const profile of testProfiles) {
      try {
        console.log(`🗑️ Deleting account: ${profile.email}`)

        // Delete from auth.users (this should cascade to profiles due to foreign key)
        const { error: authError } = await supabase.auth.admin.deleteUser(profile.id)

        if (authError) {
          console.error(`❌ Auth deletion error for ${profile.email}:`, authError)
          errors.push({
            email: profile.email,
            userId: profile.id,
            error: authError.message
          })
          continue
        }

        // Also explicitly delete from profiles table (in case cascade doesn't work)
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id)

        if (profileError) {
          console.error(`⚠️ Profile deletion error for ${profile.email}:`, profileError)
          // Don't treat this as a failure since auth deletion succeeded
        }

        console.log(`✅ Deleted account: ${profile.email}`)
        results.push({
          email: profile.email,
          userId: profile.id,
          status: 'deleted'
        })

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50))

      } catch (error) {
        console.error(`💥 Unexpected error deleting ${profile.email}:`, error)
        errors.push({
          email: profile.email,
          userId: profile.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`🎉 Test account cleanup completed!`)
    console.log(`✅ Deleted: ${results.length}`)
    console.log(`❌ Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: `Deleted ${results.length} test accounts successfully`,
      summary: {
        found: testProfiles.length,
        deleted: results.length,
        failed: errors.length
      },
      deletedAccounts: results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('💥 Test account cleanup failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test account cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to preview what would be deleted
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

    // Get all test accounts
    const { data: testProfiles, error } = await supabase
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
      message: `Found ${testProfiles?.length || 0} test accounts that would be deleted`,
      accounts: testProfiles || [],
      instructions: {
        delete: 'Send DELETE request to this endpoint to remove all test accounts',
        warning: 'This action cannot be undone!'
      }
    })

  } catch (error) {
    console.error('Error fetching test accounts for cleanup preview:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
