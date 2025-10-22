import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com", 
        pathname: "/v1/**",          
      },
    ],
  },
};

export default nextConfig;
