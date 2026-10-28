import { useState, useEffect } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { api } from "@/services/api";
import { Category } from "@/types";

type FilterValues = {
  category: string;
  minPrice: number;
  maxPrice: number;
  sortBy: string;
};

type FilterProps = {
  initialFilters?: Partial<FilterValues>;
  onFilterChange: (filters: FilterValues) => void;
};

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "price-asc", label: "Harga: Rendah ke Tinggi" },
  { value: "price-desc", label: "Harga: Tinggi ke Rendah" },
  { value: "name-asc", label: "Nama: A-Z" },
  { value: "name-desc", label: "Nama: Z-A" },
];

export default function ProductFilters({ initialFilters, onFilterChange }: FilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [minPrice, setMinPrice] = useState(initialFilters?.minPrice ?? 0);
  const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice ?? 5000000);
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy ?? "newest");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const json = await api.get<{
          success?: boolean;
          data?: Category[] | { categories?: Category[] };
        }>("/categories");
        if (Array.isArray(json.data)) {
          setCategories(json.data);
        } else if (json.data?.categories) {
          setCategories(json.data.categories);
        }
      } catch (error) {
        console.error("Gagal mengambil kategori:", error);
      }
    };
    void fetchCategories();
  }, []);

  useEffect(() => {
    if (!initialFilters) return;
    if (typeof initialFilters.minPrice === "number") {
      setMinPrice(initialFilters.minPrice);
    }
    if (typeof initialFilters.maxPrice === "number") {
      setMaxPrice(initialFilters.maxPrice);
    }
    if (initialFilters.sortBy) {
      setSortBy(initialFilters.sortBy);
    }
    if (!initialFilters.category) {
      setSelectedCategory("Semua");
    } else {
      const matched = categories.find(
        (c) =>
          c.slug.toLowerCase() === initialFilters.category?.toLowerCase() ||
          c.name.toLowerCase() === initialFilters.category?.toLowerCase()
      );
      setSelectedCategory(matched ? matched.name : initialFilters.category);
    }
  }, [
    initialFilters?.category,
    initialFilters?.minPrice,
    initialFilters?.maxPrice,
    initialFilters?.sortBy,
    categories,
    initialFilters,
  ]);

  const applyFilters = () => {
    const categorySlug =
      selectedCategory === "Semua"
        ? ""
        : categories.find((c) => c.name === selectedCategory)?.slug ||
          selectedCategory;

    onFilterChange({
      category: categorySlug,
      minPrice,
      maxPrice,
      sortBy,
    });
    setIsOpen(false);
  };

  const resetFilters = () => {
    setSelectedCategory("Semua");
    setMinPrice(0);
    setMaxPrice(5000000);
    setSortBy("newest");
    onFilterChange({
      category: "",
      minPrice: 0,
      maxPrice: 5000000,
      sortBy: "newest",
    });
  };

  const activeFiltersCount =
    (selectedCategory !== "Semua" ? 1 : 0) +
    (minPrice > 0 || maxPrice < 5000000 ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

  const categoryNames = ["Semua", ...categories.map((c) => c.name)];

  return (
    <div className="mb-6">
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
        >
          <Filter size={20} />
          <span className="font-medium">Filter & Urutkan</span>
          {activeFiltersCount > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } lg:block bg-white border border-gray-200 rounded-lg p-6 shadow-sm`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Filter Produk</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Urutkan Berdasarkan
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Kategori
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categoryNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    selectedCategory === name
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-600 hover:text-blue-600"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Rentang Harga
            </label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Harga Minimum
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  min="0"
                  step="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rp 0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Harga Maksimum
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  min="0"
                  step="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rp 5.000.000"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={applyFilters}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Terapkan
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
