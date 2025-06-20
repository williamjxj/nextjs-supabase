import { supabase } from './client'
import { Image, ImageMetadata } from '@/types/image'

export const saveImageMetadata = async (
  userId: string,
  metadata: ImageMetadata,
  storagePath: string,
  storageUrl: string
): Promise<Image> => {
  const { data, error } = await supabase
    .from('images')
    .insert({
      user_id: userId, // Required field
      filename: metadata.filename,
      original_name: metadata.original_name,
      storage_path: storagePath,
      storage_url: storageUrl,
      file_size: metadata.file_size,
      mime_type: metadata.mime_type,
      width: metadata.width, // Required field
      height: metadata.height, // Required field
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`)
  }

  return data
}

export const getUserImages = async (userId: string): Promise<Image[]> => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch images: ${error.message}`)
  }

  return data || []
}

export const deleteImageMetadata = async (
  imageId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete image metadata: ${error.message}`)
  }
}

export const getImageById = async (
  imageId: string,
  userId: string
): Promise<Image | null> => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', imageId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No rows returned
    }
    throw new Error(`Failed to fetch image: ${error.message}`)
  }

  return data
}
