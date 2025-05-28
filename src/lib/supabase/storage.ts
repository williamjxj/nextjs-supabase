import { supabase } from './client';
import { ImageUploadData, ImageMetadata } from '@/types/image';

const STORAGE_BUCKET = 'images';

export const uploadImage = async (
  file: File,
  userId: string
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file);

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.path;
};

export const getImageUrl = (path: string): string => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteImage = async (path: string): Promise<void> => {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

export const downloadImage = async (path: string): Promise<Blob> => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(path);

  if (error) {
    throw new Error(`Download failed: ${error.message}`);
  }

  return data;
};
