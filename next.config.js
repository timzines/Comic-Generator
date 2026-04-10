/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ueqjubtrnxyudszdlzxj.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcWp1YnRybnh5dWRzemRsenhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzQ4OTQsImV4cCI6MjA5MTM1MDg5NH0.PLmaS-SOIRa5iYwupkefaleNPdaoonXhoGGqQEa2BLM',
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || 'https://comicgenerator.timzines.workers.dev',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fal.run' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: '**.fal.media' },
    ],
  },
};
module.exports = nextConfig;
