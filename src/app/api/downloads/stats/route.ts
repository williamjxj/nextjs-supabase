import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/downloads/stats - Get user's download statistics
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || user.id

    // Only allow users to access their own stats
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get this month's downloads using year/month columns
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11

    const { data: monthlyDownloads, error: monthlyError } = await supabase
      .from('image_downloads')
      .select('id')
      .eq('user_id', userId)
      .eq('download_year', currentYear)
      .eq('download_month', currentMonth)

    if (monthlyError) {
      console.error('Error fetching monthly downloads:', monthlyError)
    }

    // Get all-time downloads
    const { data: allDownloads, error: allError } = await supabase
      .from('image_downloads')
      .select('downloaded_at')
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false })

    if (allError) {
      console.error('Error fetching all downloads:', allError)
    }

    const stats = {
      thisMonth: monthlyDownloads?.length || 0,
      allTime: allDownloads?.length || 0,
      lastDownload: allDownloads?.[0]?.downloaded_at,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error getting download stats:', error)
    return NextResponse.json(
      {
        thisMonth: 0,
        allTime: 0,
      },
      { status: 500 }
    )
  }
}
