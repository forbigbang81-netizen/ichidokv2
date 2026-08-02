import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow preview/chat sandboxes to hot-reload without origin warnings.
  allowedDevOrigins: ["*.space-z.ai", "*.z.ai"],
};

export default nextConfig;
