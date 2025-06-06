export interface Image {
  id: string
  user_id: string
  filename: string
  original_name: string
  storage_path: string
  storage_url: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  created_at: string
  updated_at: string
  isPurchased: boolean // Indicates whether the image has been purchased
  licenseType?: 'standard' | 'premium' | 'commercial' // Optional license type for the image
  amount?: number // Optional amount property to support payment flows
}

export interface ImageMetadata {
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
}
