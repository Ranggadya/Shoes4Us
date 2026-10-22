import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Matikan header X-Powered-By untuk keamanan & sedikit lebih kecil
  poweredByHeader: false,

  // Aktifkan kompresi gzip/brotli di server
  compress: true,

  // Strict mode React untuk mendeteksi masalah lebih awal
  reactStrictMode: true,

  images: {
    // Format modern: AVIF lebih kecil dari WebP, WebP lebih kecil dari JPEG/PNG
    formats: ["image/avif", "image/webp"],

    // Cache gambar yang sudah dioptimasi selama 1 jam di Vercel CDN
    minimumCacheTTL: 3600,

    // Breakpoint layar untuk srcSet yang tepat (menghindari gambar terlalu besar)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],

    // Ukuran gambar kecil untuk komponen dengan ukuran fixed
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // izinkan semua bucket Supabase
      },
      {
        protocol: "https",
        hostname: "share.google", // izinkan URL gambar dari Google Share
      },
    ],
  },
};

export default nextConfig;
