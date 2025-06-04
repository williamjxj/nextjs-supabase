import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  try {
    const formData = await request.formData()
    const file = formData.get('file')

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
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath)

    // Get image dimensions (basic implementation)
    const width: number | null = null
    const height: number | null = null

    // Create database record matching the schema
    const { data: imageData, error: dbError } = await supabase
      .from('images')
      .insert({
        filename: fileName,
        original_name: uploadFile.name,
        storage_path: storagePath,
        storage_url: urlData.publicUrl,
        file_size: uploadFile.size,
        mime_type: uploadFile.type,
        width: width,
        height: height,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from('images').remove([storagePath])
      return NextResponse.json(
        { error: 'Failed to create image record' },
        { status: 500 }
      )
    }

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
