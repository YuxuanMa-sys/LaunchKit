/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Optimize for Railway deployment
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // Add production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};

module.exports = nextConfig;

