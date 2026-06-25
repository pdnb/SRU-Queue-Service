import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@prisma/adapter-better-sqlite3",
    "@prisma/adapter-mariadb",
    "better-sqlite3",
    "mariadb",
  ],
};

export default nextConfig;
