/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'webvitalai.com', 'www.webvitalai.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  experimental: {
    serverActions: true,
  },
  // Enable output standalone for containerized deployments
  output: process.env.STANDALONE === 'true' ? 'standalone' : undefined,
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