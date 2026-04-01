/** @type {import('next').NextConfig} */
// Cache invalidation v5
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
