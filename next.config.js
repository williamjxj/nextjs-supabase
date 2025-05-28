/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      // Add your Supabase storage domain here
      'your-project-id.supabase.co',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
  },
};

module.exports = nextConfig;
