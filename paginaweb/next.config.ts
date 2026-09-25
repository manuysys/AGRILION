import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'prod.spline.design',
        pathname: '/**',
      },
    ],
  },

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
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },

  // API rewrites for backend and ML service
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/:path*`,
      },
      {
        source: '/api/ml/:path*',
        destination: `${process.env.ML_URL || 'http://localhost:8001'}/api/v1/:path*`,
      },
      {
        // AI API proxy — frontend calls /api/ai/* which maps to the Python AI API
        source: '/api/ai/:path*',
        destination: `${process.env.AI_API_URL || 'http://localhost:8000'}/api/v1/:path*`,
      },
    ];
  },

  // Turbopack configuration
  turbopack: {},

  // Experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'gsap',
      'three',
      '@react-three/drei',
      '@react-three/fiber',
      'maath',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'usehooks-ts',
    ],
  },
};

export default nextConfig;
