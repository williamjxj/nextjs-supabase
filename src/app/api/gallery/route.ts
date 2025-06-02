import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface GalleryQueryParams {
  search?: string
  sortBy?: 'created_at' | 'original_name' | 'file_size'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// GET /api/gallery - Get images for the authenticated user with filtering and pagination
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sortBy =
      (searchParams.get('sortBy') as GalleryQueryParams['sortBy']) ||
      'created_at'
    const sortOrder =
      (searchParams.get('sortOrder') as GalleryQueryParams['sortOrder']) ||
      'desc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate parameters
    if (!['created_at', 'original_name', 'file_size'].includes(sortBy)) {
      return NextResponse.json(
        { error: 'Invalid sortBy parameter' },
        { status: 400 }
      )
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json(
        { error: 'Invalid sortOrder parameter' },
        { status: 400 }
      )
    }

    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('images')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply search filter
    if (search) {
      query = query.or(
        `original_name.ilike.%${search}%,filename.ilike.%${search}%`
      )
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: images, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    // Get statistics
    const totalImages = count || 0
    const hasMore = offset + limit < totalImages

    return NextResponse.json({
      images: images || [],
      pagination: {
        total: totalImages,
        limit,
        offset,
        hasMore,
      },
      filters: {
        search,
        sortBy,
        sortOrder,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// DELETE /api/gallery?id=<image-id> - Delete a specific image
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get image ID from query parameters
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Get image details first to get storage path
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('storage_path')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !image) {
      return NextResponse.json(
        { error: 'Image not found or access denied' },
        { status: 404 }
      )
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('images')
      .remove([image.storage_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete image from database' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
