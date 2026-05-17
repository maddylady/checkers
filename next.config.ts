import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for custom server with Socket.io
  // (disables built-in Next.js server)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
