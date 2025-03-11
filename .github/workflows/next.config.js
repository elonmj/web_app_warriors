/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure the basePath is set if you're not deploying to the root domain
  // basePath: '',
}

module.exports = nextConfig