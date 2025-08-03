import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for Netlify deployment
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
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
