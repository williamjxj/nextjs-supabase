export const APP_NAME = 'NextJS Supabase Gallery'
export const APP_DESCRIPTION =
  'A modern image gallery built with Next.js and Supabase'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  GALLERY: '/gallery',
  UPLOAD: '/upload',
  MEMBERSHIP: '/membership',
} as const

export const API_ROUTES = {
  IMAGES: '/api/images',
  UPLOAD: '/api/upload',
  AUTH_CALLBACK: '/api/auth/callback',
  AUTH_LOGOUT: '/api/auth/logout',
} as const

export const STORAGE = {
  BUCKET_NAME: 'images',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const

export const UI = {
  GALLERY_GRID_COLS: {
    MOBILE: 1,
    TABLET: 2,
    DESKTOP: 3,
    LARGE: 4,
  },
  UPLOAD_STATES: {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    SUCCESS: 'success',
    ERROR: 'error',
  },
} as const
