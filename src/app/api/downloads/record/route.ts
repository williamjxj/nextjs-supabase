import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/downloads/record - Record an image download
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { imageId, downloadType = 'subscription' } = body

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Validate download type
    if (!['subscription', 'purchase', 'free'].includes(downloadType)) {
      return NextResponse.json(
        { error: 'Invalid download type' },
        { status: 400 }
      )
    }

    // Record the download
    const { error } = await supabase.from('image_downloads').insert({
      user_id: user.id,
      image_id: imageId,
      download_type: downloadType,
      downloaded_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error recording image download:', error)
      return NextResponse.json(
        { error: 'Failed to record download' },
        { status: 500 }
      )
    }

    console.log(`Image download recorded: ${imageId} for user ${user.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error recording download:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
