import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure dynamic deployment (not static export)
  output: undefined,
  env: {
    NEXT_PUBLIC_USE_MOCK: "true",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
