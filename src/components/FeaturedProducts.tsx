"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import ProductListSkeleton from "./skeletons/ProductListSkeleton";
import { ArrowRight } from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  description: string;
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const response = await fetch("/api/products?limit=8");
        const data = await response.json();

        if (data?.success && Array.isArray(data.data?.items)) {
          setProducts(data.data.items);
        } else {
          setProducts([]); // fallback biar aman
        }
      } catch (error) {
        console.error("❌ Error fetching featured products:", error);
        setProducts([]); 
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProducts();
  }, []);
  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Produk Pilihan
            </h2>
            <p className="text-gray-600 text-lg">
              Koleksi terbaik untuk Anda
            </p>
          </div>
          <ProductListSkeleton count={8} />
        </div>
      </section>
    );
  }

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
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
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
