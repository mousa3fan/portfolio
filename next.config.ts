import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Keep native/adapter packages out of the server bundle (needed for Turso)
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "@prisma/client"],
};

export default nextConfig;
