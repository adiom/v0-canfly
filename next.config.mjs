/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.199.12', '192.168.199.13', '192.168.203.1'],
}

export default nextConfig
