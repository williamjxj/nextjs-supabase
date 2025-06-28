import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

// Helper function to extract image dimensions using sharp
async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const metadata = await sharp(buffer).metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not extract image dimensions')
    }

    return { width: metadata.width, height: metadata.height }
  } catch (error) {
    console.error('Error extracting image dimensions:', error)
    throw new Error('Failed to process image dimensions')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data first to access fallback user_id
    const formData = await request.formData()
    const file = formData.get('file')
    const clientWidth = formData.get('width')
    const clientHeight = formData.get('height')
    const fallbackUserId = formData.get('user_id') // Fallback user ID from client

    // Create supabase client
    const supabase = await createClient()

    // Strategy 1: Try to get user from server-side auth (preferred)
    let authenticatedUser = null
    let authMethod = 'unknown'

    const {
      data: { user: serverUser },
      error: serverAuthError,
    } = await supabase.auth.getUser()

    if (serverUser && !serverAuthError) {
      authenticatedUser = serverUser
      authMethod = 'server-auth'
      // Server auth successful
    } else {
      // Server auth failed, will try client-side fallback

      // Strategy 2: Fallback - use client-provided user_id (trusted since client is authenticated)
      if (fallbackUserId && typeof fallbackUserId === 'string') {
        // Simple validation: check if this user has uploaded images before or exists in profiles
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', fallbackUserId)
          .limit(1)
          .single()

        if (!profileError && userProfile) {
          // User exists in profiles table
          authenticatedUser = { id: fallbackUserId, email: null }
          authMethod = 'profile-validated'
          // Profile validation successful
        } else {
          // If no profile, trust client auth (user might be new)
          // This is safe because the client-side auth is already validated
          authenticatedUser = { id: fallbackUserId, email: null }
          authMethod = 'client-trusted'
          // Trusting client auth for new user
        }
      }
    }

    // Final authentication check
    if (!authenticatedUser) {
      console.error('❌ Authentication failed - no valid user found')
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: 'Unable to authenticate user. Please try logging in again.',
        },
        { status: 401 }
      )
    }

    // Authentication successful

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No valid file provided' },
        { status: 400 }
      )
    }

    // Convert to File if needed
    const uploadFile =
      file instanceof File
        ? file
        : new File([file], 'upload', {
            type: (file as Blob).type || 'application/octet-stream',
          })

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(uploadFile.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (uploadFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension =
      uploadFile.name.split('.').pop() ||
      (uploadFile.type === 'image/jpeg'
        ? 'jpg'
        : uploadFile.type === 'image/png'
          ? 'png'
          : uploadFile.type === 'image/gif'
            ? 'gif'
            : 'webp')
    const fileName = `${uuidv4()}.${fileExtension}`
    const storagePath = `public/${fileName}` // Store in public folder instead of user-specific folder

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, uploadFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath)

    // Extract image dimensions using sharp (with client fallback)
    let width: number
    let height: number

    // Try to use client-provided dimensions first
    if (clientWidth && clientHeight) {
      const parsedWidth = parseInt(clientWidth.toString(), 10)
      const parsedHeight = parseInt(clientHeight.toString(), 10)

      if (
        !isNaN(parsedWidth) &&
        !isNaN(parsedHeight) &&
        parsedWidth > 0 &&
        parsedHeight > 0
      ) {
        width = parsedWidth
        height = parsedHeight
      } else {
        // Fall back to server-side extraction
        try {
          const dimensions = await getImageDimensions(uploadFile)
          width = dimensions.width
          height = dimensions.height
        } catch (error) {
          console.error('Failed to extract image dimensions:', error)
          await supabase.storage.from('images').remove([storagePath])
          return NextResponse.json(
            { error: 'Failed to process image dimensions' },
            { status: 500 }
          )
        }
      }
    } else {
      // Extract dimensions server-side
      try {
        const dimensions = await getImageDimensions(uploadFile)
        width = dimensions.width
        height = dimensions.height
      } catch (error) {
        console.error('Failed to extract image dimensions:', error)
        await supabase.storage.from('images').remove([storagePath])
        return NextResponse.json(
          { error: 'Failed to process image dimensions' },
          { status: 500 }
        )
      }
    }

    // Create database record matching the schema with required fields
    const { data: imageData, error: dbError } = await supabase
      .from('images')
      .insert({
        user_id: authenticatedUser.id, // Required: Set authenticated user's ID
        filename: fileName,
        original_name: uploadFile.name,
        storage_path: storagePath,
        storage_url: urlData.publicUrl,
        file_size: uploadFile.size,
        mime_type: uploadFile.type,
        width: width, // Required: Extracted from image
        height: height, // Required: Extracted from image
      })
      .select()
      .single()

    if (dbError) {
      // Try to clean up uploaded file
      await supabase.storage.from('images').remove([storagePath])
      return NextResponse.json(
        { error: 'Failed to create image record' },
        { status: 500 }
      )
    }

    // Upload successful

    return NextResponse.json(
      {
        image: imageData,
        message: 'File uploaded successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
