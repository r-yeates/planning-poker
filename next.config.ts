import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin must run in Node.js — prevent Next.js from bundling it
  serverExternalPackages: ['firebase-admin', 'firebase-admin/app', 'firebase-admin/firestore', '@google-cloud/firestore', '@opentelemetry/api'],

  // Output configuration for static export if needed
  // output: 'export', // Uncomment if you want static export
  
  // Image optimization
  images: {
    unoptimized: false, // Set to true if using static export
  },
  
  // Compression and optimization
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
