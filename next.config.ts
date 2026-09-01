import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.ngrok-free.app"],
  serverExternalPackages: ["mongoose", "teleproto"],
  // The Next.js "N" badge sits on the login keypad and looks like an extra key.
  devIndicators: false,
};

export default nextConfig;
