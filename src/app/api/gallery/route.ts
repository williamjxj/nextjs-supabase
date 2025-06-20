import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface GalleryQueryParams {
  search?: string
  sortBy?: 'created_at' | 'original_name' | 'file_size'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// GET /api/gallery - Get all images with filtering and pagination (no authentication required)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    // TODO: Add RLS policies
    // const userData = await supabase.auth.getUser()
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
    const ownershipFilter = searchParams.get('ownership') // 'owned', 'for-sale', or null

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

    // Get current user to check their subscription and purchases
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let purchasedImageIds: string[] = []
    let hasActiveSubscription = false

    if (user) {
      // Check for active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .single()

      hasActiveSubscription = !!subscription

      // Get purchases only if no active subscription
      if (!hasActiveSubscription) {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('image_id')
          .eq('user_id', user.id)
          .eq('payment_status', 'completed')

        purchasedImageIds = purchases?.map(purchase => purchase.image_id) || []
      }
    }

    // Build base query for counting
    let countQuery = supabase.from('images').select('id', { count: 'exact' })

    // Apply search filter to count query
    if (search) {
      countQuery = countQuery.or(
        `original_name.ilike.%${search}%,filename.ilike.%${search}%`
      )
    }

    // Apply ownership filter to count query if specified
    if (ownershipFilter === 'owned') {
      if (hasActiveSubscription) {
        // Subscription users "own" all images - no filter needed
      } else if (purchasedImageIds.length > 0) {
        countQuery = countQuery.in('id', purchasedImageIds)
      } else {
        // User has no purchases, so "owned" filter should return empty
        countQuery = countQuery.eq('id', 'non-existent-id')
      }
    } else if (ownershipFilter === 'for-sale') {
      if (hasActiveSubscription) {
        // Subscription users don't see "for sale" - return empty
        countQuery = countQuery.eq('id', 'non-existent-id')
      } else if (purchasedImageIds.length > 0) {
        countQuery = countQuery.not(
          'id',
          'in',
          `(${purchasedImageIds.join(',')})`
        )
      }
      // If no purchases, all images are "for sale" (no additional filter needed)
    }

    // Get total count with filters applied
    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error('Count query error:', countError)
      return NextResponse.json(
        { error: 'Failed to count images' },
        { status: 500 }
      )
    }

    // Build main query for actual data
    let query = supabase.from('images').select('*')

    // Apply search filter
    if (search) {
      query = query.or(
        `original_name.ilike.%${search}%,filename.ilike.%${search}%`
      )
    }

    // Apply ownership filter to main query if specified
    if (ownershipFilter === 'owned') {
      if (hasActiveSubscription) {
        // Subscription users "own" all images - no filter needed
      } else if (purchasedImageIds.length > 0) {
        query = query.in('id', purchasedImageIds)
      } else {
        // User has no purchases, so "owned" filter should return empty
        query = query.eq('id', 'non-existent-id')
      }
    } else if (ownershipFilter === 'for-sale') {
      if (hasActiveSubscription) {
        // Subscription users don't see "for sale" - return empty
        query = query.eq('id', 'non-existent-id')
      } else if (purchasedImageIds.length > 0) {
        query = query.not('id', 'in', `(${purchasedImageIds.join(',')})`)
      }
      // If no purchases, all images are "for sale" (no additional filter needed)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: images, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    // Get statistics
    const totalImages = totalCount || 0
    const hasMore = offset + limit < totalImages

    // Enrich images with purchase status
    const enrichedImages = images.map(image => ({
      ...image,
      isPurchased:
        hasActiveSubscription || purchasedImageIds.includes(image.id),
    }))

    const response = {
      images: enrichedImages || [],
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
        ownership: ownershipFilter,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in gallery API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// DELETE /api/gallery?id=<image-id> - Delete a specific image
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  try {
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
      .single()

    if (fetchError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
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
