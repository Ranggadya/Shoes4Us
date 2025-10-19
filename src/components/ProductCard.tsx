"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";
import WishlistButton from "./WishlistButton";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl?: string | null;
};

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  const handleDetailClick = () => {
    router.push(`/product/${product.id}`);
  };

  const imageSrc =
    product.imageUrl && product.imageUrl.startsWith("http")
      ? product.imageUrl 
      : "/placeholder.png"; 

  return (
    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition duration-200">
      <div className="relative w-full h-56">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 33vw, 100vw"
          unoptimized 
        />

        {/* Wishlist Button */}
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton productId={product.id} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
          {product.name}
        </h3>

        <p className="text-gray-800 font-medium mb-2">
          {formatCurrency(product.price)}
        </p>

        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {product.description ?? "Tidak ada deskripsi"}
        </p>

        <button
          onClick={handleDetailClick}
          className="bg-black text-white w-full py-2 rounded-lg font-medium hover:bg-gray-800 transition"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
}
