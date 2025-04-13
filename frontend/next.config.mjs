/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add any custom Next.js configuration here
  reactStrictMode: true,
  images: {
    domains: ['your-backend-domain.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://your-backend-domain.com',
  },
  // Enable static exports if needed
  output: 'standalone',
  // Optional: Configure webpack if needed
  // webpack: (config, { isServer }) => {
  //   return config;
  // },
};

export default nextConfig; 