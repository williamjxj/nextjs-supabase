import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/images - Get all images for the authenticated user
export async function GET() {
  const supabase = await createClient()

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get images from database
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    return NextResponse.json({ images: data || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/images - Create a new image record
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      tags,
      file_name,
      file_size,
      file_type,
      storage_path,
      url,
      thumbnail_url,
      width,
      height,
    } = body

    // Validate required fields
    if (!title || !file_name || !storage_path || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert image into database
    const { data, error } = await supabase
      .from('images')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        tags: tags || [],
        file_name,
        file_size: file_size || 0,
        file_type: file_type || 'image/jpeg',
        storage_path,
        url,
        thumbnail_url: thumbnail_url || null,
        width: width || null,
        height: height || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create image record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ image: data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
