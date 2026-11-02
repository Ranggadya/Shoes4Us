import { useEffect, useState } from "react";
import { api } from "@/services/api";
import ProductCard from "./ProductCard";
import type { Product } from "@/types";
import { Sparkles } from "lucide-react";

interface RelatedProductsProps {
  productId: string;
}

export default function RelatedProducts({ productId }: RelatedProductsProps) {
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get<{ success: boolean; data: Product[] }>(
        `/products/${encodeURIComponent(productId)}/related`
      )
      .then((res) => {
        if (isMounted && res.data) {
          setRelated(res.data);
        }
      })
      .catch(() => {
        if (isMounted) setRelated([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="mt-16 pt-10 border-t border-gray-100">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Produk Serupa (You May Also Like)
        </h2>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Rekomendasi sepatu pilihan dari kategori dan brand yang serupa untuk melengkapi gayamu.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
