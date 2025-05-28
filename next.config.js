/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // Add your Supabase storage domain here
      'saamqzojqivrumnnnyrf.supabase.co',
      'localhost',
      'localhost:3000',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
  },
};

module.exports = nextConfig;
