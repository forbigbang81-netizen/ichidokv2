import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.z.ai"],
  images: {
    remotePatterns: [
      // Archive.org posters / thumbnails used across the whole site.
      { protocol: "https", hostname: "archive.org" },
      { protocol: "https", hostname: "ia800800.us.archive.org" },
      { protocol: "https", hostname: "ia902204.us.archive.org" },
      // QR code fallback used inside the Cast dialog.
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },
};

export default nextConfig;
