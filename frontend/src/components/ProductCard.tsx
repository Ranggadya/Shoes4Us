import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format";
import WishlistButton from "./WishlistButton";

type Product = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
};

export default function ProductCard({ product }: { product: Product }) {
  const imageSrc =
    product.imageUrl &&
    (product.imageUrl.startsWith("http") || product.imageUrl.startsWith("/"))
      ? product.imageUrl
      : "/sepatu1.jpeg";

  return (
    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
      <div>
        <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
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
        </div>
      </div>

      <div className="p-4 pt-0">
        <Link
          to={`/product/${product.id}`}
          className="block bg-black text-white w-full py-2 rounded-lg font-medium hover:bg-gray-800 transition text-center"
        >
          Lihat Detail
        </Link>
      </div>
    </div>
  );
}
