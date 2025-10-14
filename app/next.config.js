/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Optimize for Railway deployment
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://launchkit-api-production.up.railway.app/v1',
  },
  // Add production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};

module.exports = nextConfig;

