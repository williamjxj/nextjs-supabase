import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    
    // Get users using admin API, not direct table query
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      userCount: users?.users?.length || 0,
      users: users?.users?.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at
      })) || [],
      message: users?.users?.length ? 'Users found' : 'No users found'
    })
  } catch (error) {
    console.error('Failed to check users:', error)
    return NextResponse.json({
      error: 'Failed to check users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
