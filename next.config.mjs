/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.litres.ru',
      },
      {
        protocol: 'https',
        hostname: '**.author.today',
      },
    ],
  },
  allowedDevOrigins: ['192.168.199.12', '192.168.199.13', '192.168.203.1'],
}

export default nextConfig
