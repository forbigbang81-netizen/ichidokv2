import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles Next.js output natively; "standalone" is for Docker.
  // We keep it on so the same build works on Vercel, Docker, or anywhere.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow preview/chat sandboxes to hot-reload without origin warnings.
  allowedDevOrigins: ["*.space-z.ai", "*.z.ai"],
  // Vercel image optimization config — important since we load images
  // from media.kitsu.app
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.kitsu.app" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },
};

export default nextConfig;
