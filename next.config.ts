import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // ✅ izinkan semua bucket Supabase
      },
    ],
  },
};

export default nextConfig;
