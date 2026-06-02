import os from "node:os";
import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_PROXY_ORIGIN ?? "http://127.0.0.1:8000";

function getAllowedDevOrigins(): string[] {
  const hosts = new Set(["localhost", "127.0.0.1"]);

  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        hosts.add(address.address);
      }
    }
  }

  return Array.from(hosts);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: getAllowedDevOrigins(),
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
