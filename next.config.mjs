/** @type {import('next').NextConfig} */

// eslint-disable-next-line @typescript-eslint/no-require-imports

const nextConfig = {
  // output: 'standalone',
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
