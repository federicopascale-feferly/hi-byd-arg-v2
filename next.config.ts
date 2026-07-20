import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export para Capacitor (APK Android)
  output: "export",
  distDir: "out",
};

export default nextConfig;
