import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel supports full Next.js features, no need for static export
  // output: "export",
  trailingSlash: false,
  images: {
    unoptimized: false, // Vercel supports Next.js Image optimization
  },
  env: {
    NEXT_PUBLIC_USE_MOCK: "true",
  },
  // Vercel-specific optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;
