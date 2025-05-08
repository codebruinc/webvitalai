/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly expose environment variables to the client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'webvitalai.com', 'www.webvitalai.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Server Actions are available by default in Next.js 14+
  // Disable static exports
  output: undefined,
  // Enable compression
  compress: true,
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Configure redirects
  async redirects() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
        permanent: false,
      },
    ];
  },
  // Configure webpack for optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev) {
      config.optimization.minimize = true;
    }
    
    // Handle Lighthouse and other ESM modules
    if (isServer) {
      // Add external modules that should not be bundled
      config.externals = [...(config.externals || []), 'lighthouse'];
    }
    
    return config;
  },
};

module.exports = nextConfig;