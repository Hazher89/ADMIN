import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  trailingSlash: true,
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
