import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let Vercel handle everything automatically
  env: {
    NEXT_PUBLIC_USE_MOCK: "true",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
