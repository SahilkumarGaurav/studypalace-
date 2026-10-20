/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // better-sqlite3 is a native module — it must not be bundled by webpack.
  serverExternalPackages: ['better-sqlite3', 'bcryptjs', 'pg', 'pg-pool', 'sharp'],
  images: {
    // Product cover images are uploaded to the local filesystem, so the
    // default sharp-based optimizer is disabled to keep deploys simple.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Never let a browser cache a signed download
      {
        source: '/api/download/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/blog/:slug', destination: '/guides/:slug', permanent: true },
      { source: '/product/:slug', destination: '/p/:slug', permanent: true },
      { source: '/downloads', destination: '/my-downloads', permanent: false },
      { source: '/track-order', destination: '/my-downloads', permanent: false },
    ];
  },
};

module.exports = nextConfig;
