import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // ✅ izinkan semua bucket Supabase
      },
      {
        protocol: "https",
        hostname: "share.google", // ✅ izinkan URL gambar dari Google Share
      },
    ],
  },
};

export default nextConfig;
