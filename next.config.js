/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    unoptimized: true,
  },
  // Ensure the basePath is set if you're not deploying to the root domain
  // basePath: '',
}

// Use ESM export syntax for compatibility with "type": "module" in package.json
export default nextConfig;