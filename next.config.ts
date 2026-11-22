import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  const nextConfig: NextConfig = {
  // 既存の設定（images など）があればそのまま残してください
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://my-plamo-app-dev.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
