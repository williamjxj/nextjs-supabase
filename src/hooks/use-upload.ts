'use client';

import { useState } from 'react';
import { uploadImage, getImageUrl } from '@/lib/supabase/storage';
import { saveImageMetadata } from '@/lib/supabase/database';
import { validateImageFile, getImageDimensions } from '@/lib/utils/file-validation';
import { useAuth } from './use-auth';
import { ImageMetadata } from '@/types/image';

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export const useUpload = () => {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  const uploadFile = async (file: File) => {
    if (!user) {
      throw new Error('User must be authenticated to upload files');
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setUploadState(prev => ({ ...prev, error: validation.error! }));
      throw new Error(validation.error);
    }

    setUploadState({ uploading: true, progress: 0, error: null });

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // Upload to storage
      setUploadState(prev => ({ ...prev, progress: 25 }));
      const storagePath = await uploadImage(file, user.id);

      // Get public URL
      setUploadState(prev => ({ ...prev, progress: 50 }));
      const storageUrl = getImageUrl(storagePath);

      // Prepare metadata
      const metadata: ImageMetadata = {
        filename: storagePath,
        original_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        width: dimensions.width,
        height: dimensions.height,
      };

      // Save to database
      setUploadState(prev => ({ ...prev, progress: 75 }));
      const savedImage = await saveImageMetadata(
        user.id,
        metadata,
        storagePath,
        storageUrl
      );

      setUploadState(prev => ({ ...prev, progress: 100, uploading: false }));
      return savedImage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({ uploading: false, progress: 0, error: errorMessage });
      throw error;
    }
  };

  const resetUploadState = () => {
    setUploadState({ uploading: false, progress: 0, error: null });
  };

  return {
    uploadFile,
    uploadState,
    resetUploadState,
  };
};
