"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: string;
  imageUrl: string | null;
};

export default function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?limit=5&search=${encodeURIComponent(searchQuery.trim())}`);
        const data = await response.json();
        
        if (data.success && data.data.products) {
          setSuggestions(data.data.products);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/product?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSearch} className="relative">
        {/* Search Input */}
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition">
          <Search size={18} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Cari produk, kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="bg-transparent outline-none w-full text-sm text-gray-700 placeholder-gray-400"
          />
          {loading && (
            <Loader2 size={18} className="text-gray-400 animate-spin ml-2" />
          )}
          {searchQuery && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {suggestions.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              onClick={() => {
                setShowSuggestions(false);
                setSearchQuery("");
              }}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
            >
              {/* Product Image */}
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <Search size={20} className="text-gray-400" />
                </div>
              )}

              {/* Product Info */}
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm line-clamp-1">
                  {product.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {product.category}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* View All Results */}
          <button
            onClick={() => {
              setShowSuggestions(false);
              router.push(`/product?search=${encodeURIComponent(searchQuery)}`);
            }}
            className="w-full px-4 py-3 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
          >
            Lihat Semua Hasil untuk &quot;{searchQuery}&quot;
          </button>
        </div>
      )}

      {/* No Results */}
      {showSuggestions && !loading && searchQuery.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
          <p className="text-gray-500 text-sm">
            Tidak ada hasil untuk &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
