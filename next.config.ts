import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export solo para Capacitor (APK Android), no para Vercel
  ...(process.env.BUILD_TARGET === "capacitor" && {
    output: "export",
    distDir: "out",
  }),
};

export default nextConfig;
