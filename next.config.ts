import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_USE_MOCK: "true",
  },
  // ESLint configuration for build
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build for deployment
  },
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optional optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;
