import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: { emotion: true },
  devIndicators: false,
};

export default nextConfig;
