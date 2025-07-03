const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add your Next.js configurations here
  images: {
    remotePatterns: [
      // Rule for the placeholder images used in development/mocking
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Rule for real Vinted images
      {
        protocol: 'https',
        hostname: 'images.vinted.net',
        port: '',
        pathname: '/**',
      },
      // Rule for real Depop images
      {
        protocol: 'https',
        hostname: 'depop-res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// Wrap your config with the bundle analyzer
module.exports = withBundleAnalyzer(nextConfig);