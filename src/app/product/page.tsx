"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductListSkeleton from "@/components/skeletons/ProductListSkeleton";
import ProductFilters from "@/components/ProductFilters";
import EmptySearchResults from "@/components/empty-states/EmptySearchResults";
import EmptyCategory from "@/components/empty-states/EmptyCategory";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  category: { name: string } | null;
  description: string | null;
  imageUrl: string | null;
};

type ProductResponse = {
  success: boolean;
  data: {
    items: Product[];
  };
};

type CategoryResponse = {
  success: boolean;
  data: { categories: string[] };
};

const DEFAULT_CATEGORIES = ["casual", "formal", "sports"];
const PRODUCTS_PER_PAGE = 20;

export default function ProductListPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get("search") || "";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: 0,
    maxPrice: 5000000,
    sortBy: "newest",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {

        const params = new URLSearchParams();
        params.append("page", "1");
        params.append("pageSize", "100"); // Fetch up to 100 products
        
        if (filters.category) {
          params.append("category", filters.category);
        }
        
        if (searchQuery) {
          params.append("search", searchQuery);
        }

        const productsRes = await fetch(`/api/products?${params.toString()}`, {
          credentials: "include",
        });

        if (!productsRes.ok) {
          throw new Error("Gagal memuat daftar produk");
        }

        const productJson = (await productsRes.json()) as ProductResponse;
        let items = productJson.data.items;

        // Apply price filter
        items = items.filter(
          (product) => product.price >= filters.minPrice && product.price <= filters.maxPrice
        );

        // Apply sorting
        switch (filters.sortBy) {
          case "price-asc":
            items.sort((a, b) => a.price - b.price);
            break;
          case "price-desc":
            items.sort((a, b) => b.price - a.price);
            break;
          case "name-asc":
            items.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "name-desc":
            items.sort((a, b) => b.name.localeCompare(a.name));
            break;
          default:
            // newest is default from API
            break;
        }

        setProducts(items);
        setFilteredProducts(items);
        setCurrentPage(1); // Reset to first page when filters change
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan pada server"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of product list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold mb-4 text-center text-gray-900">
          {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : "Daftar Produk"}
        </h1>
        {searchQuery && (
          <p className="text-center text-gray-600 mb-8">
            Menampilkan hasil pencarian untuk &quot;{searchQuery}&quot;
          </p>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <ProductFilters onFilterChange={setFilters} />
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <ProductListSkeleton count={20} />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 text-lg">{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              searchQuery ? (
                <EmptySearchResults query={searchQuery} />
              ) : filters.category ? (
                <EmptyCategory category={filters.category} />
              ) : (
                <EmptySearchResults />
              )
            ) : (
              <>
                {/* Result Count & Page Info */}
                <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                  <div className="text-gray-600">
                    Menampilkan{" "}
                    <span className="font-semibold">
                      {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}
                    </span>{" "}
                    dari <span className="font-semibold">{filteredProducts.length}</span>{" "}
                    produk
                  </div>
                  <div className="text-sm text-gray-500">
                    Halaman {currentPage} dari {totalPages}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {currentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                    {/* First Page */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      aria-label="First page"
                    >
                      <ChevronsLeft className="w-5 h-5" />
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === "number" && handlePageChange(page)}
                        disabled={page === "..."}
                        className={`min-w-[40px] px-4 py-2 rounded-lg font-semibold transition ${
                          page === currentPage
                            ? "bg-black text-white"
                            : page === "..."
                            ? "cursor-default"
                            : "border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next Page */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Last Page */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      aria-label="Last page"
                    >
                      <ChevronsRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Pagination Info (Mobile) */}
                {totalPages > 1 && (
                  <div className="text-center mt-4 text-sm text-gray-600">
                    Go to page:{" "}
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          handlePageChange(page);
                        }
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
