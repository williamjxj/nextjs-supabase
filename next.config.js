/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'saamqzojqivrumnnnyrf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
  },
}

module.exports = nextConfig
