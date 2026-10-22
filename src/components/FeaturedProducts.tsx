import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import ProductCard from "./ProductCard";
import { ArrowRight } from "lucide-react";

type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
  category: { name: string } | null;
};

// ✅ Cache query selama 60 detik di Vercel Edge — otomatis revalidate di background
const getFeaturedProducts = unstable_cache(
  async (): Promise<FeaturedProduct[]> => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          description: true,
          category: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      });

      // Konversi Decimal ke number agar bisa di-serialize oleh Next.js cache.
      return products.map((p) => ({
        ...p,
        price: Number(p.price),
      }));
    } catch {
      return [];
    }
  },
  ["featured-products"], // cache key
  {
    revalidate: 60,       // revalidate setiap 60 detik di Vercel
    tags: ["products"],   // bisa di-invalidate manual via revalidateTag("products")
  }
);

export default async function FeaturedProducts() {
  // ✅ Data langsung ada saat render — tidak ada loading state / skeleton
  const products = await getFeaturedProducts();

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Produk Pilihan
          </h2>
          <p className="text-gray-600 text-lg">
            Koleksi terbaik untuk Anda
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.isArray(products) && products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              Tidak ada produk pilihan saat ini.
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            href="/product"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition transform hover:scale-105"
          >
            Lihat Semua Produk
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
