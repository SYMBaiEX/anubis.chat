/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure TS sources from workspace packages are transpiled by Next
  transpilePackages: ['@anubis-chat/shared'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
