export interface Image {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  storage_path: string;
  storage_url: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

export interface ImageUploadData {
  file: File;
  filename: string;
  storage_path: string;
}

export interface ImageMetadata {
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
}
