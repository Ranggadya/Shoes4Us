import { useState, useEffect, useRef, memo } from "react";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/services/api";
import { Category } from "@/types";

let cachedCategories: Category[] | null = null;
let categoriesPromise: Promise<Category[]> | null = null;

async function loadCategoriesOnce(): Promise<Category[]> {
  if (cachedCategories) return cachedCategories;
  if (!categoriesPromise) {
    categoriesPromise = api
      .get<{
        success?: boolean;
        data?: Category[] | { categories?: Category[] };
      }>("/categories")
      .then((json) => {
        const list = Array.isArray(json.data)
          ? json.data
          : json.data?.categories || [];
        cachedCategories = list;
        return list;
      })
      .catch((err) => {
        categoriesPromise = null;
        throw err;
      });
  }
  return categoriesPromise;
}

export type FilterValues = {
  category: string;
  brand: string;
  audience: string;
  size: string;
  collection: string;
  isSale: boolean;
  inStock: boolean;
  minPrice: number;
  maxPrice: number;
  sortBy: string;
};

type FilterProps = {
  initialFilters?: Partial<FilterValues>;
  onFilterChange: (
    filters: FilterValues,
    options?: { isReset?: boolean }
  ) => void;
};

const DEFAULT_MAX_PRICE = 5000000;

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "price-asc", label: "Harga: Rendah ke Tinggi" },
  { value: "price-desc", label: "Harga: Tinggi ke Rendah" },
  { value: "name-asc", label: "Nama: A-Z" },
  { value: "name-desc", label: "Nama: Z-A" },
];

const EU_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

const POPULAR_BRANDS = [
  "Nike",
  "Adidas",
  "New Balance",
  "Puma",
  "Jordan",
  "Vans",
  "Converse",
  "Asics",
];

const AUDIENCE_OPTIONS = [
  { value: "MEN", label: "Pria" },
  { value: "WOMEN", label: "Wanita" },
  { value: "UNISEX", label: "Unisex" },
  { value: "KIDS", label: "Anak" },
];

const PRICE_PRESETS = [
  { label: "< 1 Jt", min: 0, max: 1000000 },
  { label: "1 - 2 Jt", min: 1000000, max: 2000000 },
  { label: "> 2 Jt", min: 2000000, max: DEFAULT_MAX_PRICE },
];

function ProductFilters({
  initialFilters,
  onFilterChange,
}: FilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(
    () => cachedCategories ?? []
  );

  // Accordion open states (Gaya A: Clean Accordion)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    size: true,
    brand: true,
    gender: true,
    category: true,
    collection: true,
    price: true,
  });

  const [minInput, setMinInput] = useState<number>(
    initialFilters?.minPrice ?? 0
  );
  const [maxInput, setMaxInput] = useState<number>(
    initialFilters?.maxPrice ?? DEFAULT_MAX_PRICE
  );
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentFilters: FilterValues = {
    category: initialFilters?.category ?? "",
    brand: initialFilters?.brand ?? "",
    audience: initialFilters?.audience ?? "",
    size: initialFilters?.size ?? "",
    collection: initialFilters?.collection ?? "",
    isSale: initialFilters?.isSale ?? false,
    inStock: initialFilters?.inStock ?? false,
    minPrice: initialFilters?.minPrice ?? 0,
    maxPrice: initialFilters?.maxPrice ?? DEFAULT_MAX_PRICE,
    sortBy: initialFilters?.sortBy ?? "newest",
  };

  useEffect(() => {
    let active = true;
    loadCategoriesOnce()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch((error) => {
        console.error("Gagal mengambil kategori:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (priceDebounceRef.current) {
        clearTimeout(priceDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMinInput(initialFilters?.minPrice ?? 0);
    setMaxInput(initialFilters?.maxPrice ?? DEFAULT_MAX_PRICE);
  }, [initialFilters?.minPrice, initialFilters?.maxPrice]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const emitChange = (partial: Partial<FilterValues>) => {
    const next: FilterValues = {
      ...currentFilters,
      ...partial,
    };
    onFilterChange(next);
  };

  const handlePriceInputChange = (nextMin: number, nextMax: number) => {
    setMinInput(nextMin);
    setMaxInput(nextMax);

    if (priceDebounceRef.current) {
      clearTimeout(priceDebounceRef.current);
    }

    priceDebounceRef.current = setTimeout(() => {
      if (nextMin > nextMax) {
        toast.error("Harga minimum tidak boleh lebih besar dari maksimum");
        return;
      }
      emitChange({ minPrice: nextMin, maxPrice: nextMax });
    }, 400);
  };

  const resetFilters = () => {
    if (priceDebounceRef.current) {
      clearTimeout(priceDebounceRef.current);
    }
    setMinInput(0);
    setMaxInput(DEFAULT_MAX_PRICE);
    onFilterChange(
      {
        category: "",
        brand: "",
        audience: "",
        size: "",
        collection: "",
        isSale: false,
        inStock: false,
        minPrice: 0,
        maxPrice: DEFAULT_MAX_PRICE,
        sortBy: "newest",
      },
      { isReset: true }
    );
    setIsOpen(false);
  };

  // Build active filter chips for Gaya A header
  const activeTags: { key: string; label: string; onRemove: () => void }[] = [];

  if (currentFilters.size) {
    activeTags.push({
      key: "size",
      label: `Size: ${currentFilters.size}`,
      onRemove: () => emitChange({ size: "" }),
    });
  }
  if (currentFilters.brand) {
    activeTags.push({
      key: "brand",
      label: currentFilters.brand,
      onRemove: () => emitChange({ brand: "" }),
    });
  }
  if (currentFilters.audience) {
    const audLabel =
      AUDIENCE_OPTIONS.find(
        (a) => a.value === currentFilters.audience.toUpperCase()
      )?.label || currentFilters.audience;
    activeTags.push({
      key: "audience",
      label: audLabel,
      onRemove: () => emitChange({ audience: "" }),
    });
  }
  if (currentFilters.category) {
    const catLabel =
      categories.find(
        (c) =>
          c.slug.toLowerCase() === currentFilters.category.toLowerCase() ||
          c.name.toLowerCase() === currentFilters.category.toLowerCase()
      )?.name || currentFilters.category;
    activeTags.push({
      key: "category",
      label: catLabel,
      onRemove: () => emitChange({ category: "" }),
    });
  }
  if (currentFilters.isSale) {
    activeTags.push({
      key: "isSale",
      label: "Sedang Diskon",
      onRemove: () => emitChange({ isSale: false }),
    });
  }
  if (currentFilters.collection) {
    const colMap: Record<string, string> = {
      "new-arrivals": "Rilisan Baru",
      exclusive: "Exclusive",
      "coming-soon": "Segera Hadir",
    };
    activeTags.push({
      key: "collection",
      label: colMap[currentFilters.collection] || currentFilters.collection,
      onRemove: () => emitChange({ collection: "" }),
    });
  }
  if (currentFilters.inStock) {
    activeTags.push({
      key: "inStock",
      label: "Stok Tersedia",
      onRemove: () => emitChange({ inStock: false }),
    });
  }
  if (
    currentFilters.minPrice > 0 ||
    currentFilters.maxPrice < DEFAULT_MAX_PRICE
  ) {
    const minStr = `Rp ${(currentFilters.minPrice / 1000).toLocaleString("id-ID")}rb`;
    const maxStr =
      currentFilters.maxPrice >= 1000000
        ? `Rp ${(currentFilters.maxPrice / 1000000).toFixed(1).replace(".0", "")} Jt`
        : `Rp ${(currentFilters.maxPrice / 1000).toLocaleString("id-ID")}rb`;
    activeTags.push({
      key: "price",
      label: `${minStr} - ${maxStr}`,
      onRemove: () => {
        if (priceDebounceRef.current) {
          clearTimeout(priceDebounceRef.current);
        }
        setMinInput(0);
        setMaxInput(DEFAULT_MAX_PRICE);
        emitChange({ minPrice: 0, maxPrice: DEFAULT_MAX_PRICE });
      },
    });
  }

  const activeFiltersCount =
    activeTags.length + (currentFilters.sortBy !== "newest" ? 1 : 0);

  return (
    <div className="mb-6">
      {/* Mobile Filter Trigger Button */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 w-full px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 transition"
        >
          <SlidersHorizontal size={18} className="text-slate-700" />
          <span className="font-semibold text-slate-800 text-sm">
            Filter & Urutkan
          </span>
          {activeFiltersCount > 0 && (
            <span className="ml-auto bg-slate-900 text-white text-xs font-bold px-2 py-0.5">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Sidebar Filter Panel — Sharp Rectangular Retail Style */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } lg:block bg-white border border-slate-200 p-5 sticky top-24`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={17} className="text-slate-900" />
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-900">
              Filter
              {activeFiltersCount > 0 && (
                <span className="ml-2 text-xs font-bold bg-slate-900 text-white px-2 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-black underline transition"
              >
                <RotateCcw size={12} />
                Hapus Semua
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-700"
              aria-label="Tutup filter"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Active Filter Tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-3 border-b border-slate-200">
            {activeTags.map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={tag.onRemove}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-slate-300 bg-slate-50 hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-slate-800 text-xs font-semibold transition group"
              >
                <span>{tag.label}</span>
                <X
                  size={12}
                  className="text-slate-400 group-hover:text-red-600"
                />
              </button>
            ))}
          </div>
        )}

        <div className="divide-y divide-slate-200">
          {/* 1. Sort By */}
          <div className="py-4">
            <label
              htmlFor="filter-sort-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5"
            >
              Urutkan Berdasarkan
            </label>
            <div className="relative">
              <select
                id="filter-sort-select"
                value={currentFilters.sortBy}
                onChange={(e) => emitChange({ sortBy: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 border border-slate-300 appearance-none bg-white hover:border-slate-900 focus:outline-none focus:border-slate-900 transition cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
            </div>
          </div>

          {/* 2. Shoe Size Matrix (EU) */}
          <div className="py-4">
            <button
              type="button"
              onClick={() => toggleSection("size")}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Ukuran Sepatu (EU)
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-500 transition-transform ${
                  openSections.size ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSections.size && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {EU_SIZES.map((sz) => {
                  const isSelected = currentFilters.size === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        emitChange({ size: isSelected ? "" : sz })
                      }
                      className={`py-2 text-xs font-bold border transition ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-800 border-slate-300 hover:border-slate-900"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Brand Checkboxes */}
          <div className="py-4">
            <button
              type="button"
              onClick={() => toggleSection("brand")}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Brand
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-500 transition-transform ${
                  openSections.brand ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSections.brand && (
              <div className="space-y-2 mt-3">
                {POPULAR_BRANDS.map((brandName) => {
                  const isChecked =
                    currentFilters.brand.toLowerCase() ===
                    brandName.toLowerCase();
                  return (
                    <button
                      key={brandName}
                      type="button"
                      onClick={() =>
                        emitChange({ brand: isChecked ? "" : brandName })
                      }
                      className="flex items-center justify-between w-full group py-0.5 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-4 h-4 flex items-center justify-center border transition ${
                            isChecked
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "border-slate-300 bg-white group-hover:border-slate-900"
                          }`}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span
                          className={`text-sm transition ${
                            isChecked
                              ? "font-semibold text-slate-900"
                              : "text-slate-600 group-hover:text-slate-900"
                          }`}
                        >
                          {brandName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Gender / Audience — Sharp Rectangular Boxes */}
          <div className="py-4">
            <button
              type="button"
              onClick={() => toggleSection("gender")}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Gender
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-500 transition-transform ${
                  openSections.gender ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSections.gender && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {AUDIENCE_OPTIONS.map((aud) => {
                  const isSelected =
                    currentFilters.audience.toUpperCase() === aud.value;
                  return (
                    <button
                      key={aud.value}
                      type="button"
                      onClick={() =>
                        emitChange({
                          audience: isSelected ? "" : aud.value,
                        })
                      }
                      className={`px-3 py-2 text-xs font-semibold border transition text-center ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-800 border-slate-300 hover:border-slate-900"
                      }`}
                    >
                      {aud.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Category — Sharp Rectangular Boxes */}
          <div className="py-4">
            <button
              type="button"
              onClick={() => toggleSection("category")}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Kategori Sepatu
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-500 transition-transform ${
                  openSections.category ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSections.category && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => emitChange({ category: "" })}
                  className={`px-3 py-2 text-xs font-semibold border transition text-center ${
                    !currentFilters.category
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-800 border-slate-300 hover:border-slate-900"
                  }`}
                >
                  Semua
                </button>
                {categories.map((cat) => {
                  const isSelected =
                    currentFilters.category.toLowerCase() ===
                      cat.slug.toLowerCase() ||
                    currentFilters.category.toLowerCase() ===
                      cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        emitChange({
                          category: isSelected ? "" : cat.slug,
                        })
                      }
                      className={`px-3 py-2 text-xs font-semibold border transition text-center truncate ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-800 border-slate-300 hover:border-slate-900"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Collection & Stock Availability — Sharp Rectangular Boxes */}
          <div className="py-4">
            <button
              type="button"
              onClick={() => toggleSection("collection")}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Koleksi & Status
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-500 transition-transform ${
                  openSections.collection ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSections.collection && (
              <div className="space-y-2.5 mt-3">
                {/* Ready Stock Switch — Square Track & Thumb */}
                <button
                  type="button"
                  onClick={() =>
                    emitChange({ inStock: !currentFilters.inStock })
                  }
                  className="flex items-center justify-between w-full px-3 py-2.5 border border-slate-300 bg-slate-50 hover:border-slate-900 transition"
                >
                  <span className="text-xs font-semibold text-slate-800">
                    Hanya Stok Tersedia
                  </span>
                  <span
                    className={`w-9 h-5 transition-colors relative inline-flex items-center ${
                      currentFilters.inStock ? "bg-slate-900" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 bg-white transform transition-transform ${
                        currentFilters.inStock
                          ? "translate-x-4"
                          : "translate-x-1"
                      }`}
                    />
                  </span>
                </button>

                {/* Promo / Collection Rectangular Cards */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      emitChange({ isSale: !currentFilters.isSale })
                    }
                    className={`px-2 py-2 text-xs font-semibold border transition text-center ${
                      currentFilters.isSale
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-800 border-slate-300 hover:border-slate-900"
                    }`}
                  >
                    Sedang Diskon
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      emitChange({
                        collection:
                          currentFilters.collection === "new-arrivals"
                            ? ""
                            : "new-arrivals",
                      })
                    }
                    className={`px-2 py-2 text-xs font-semibold border transition text-center ${
                      currentFilters.collection === "new-arrivals"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-800 border-slate-300 hover:border-slate-900"
                    }`}
                  >
                    Rilisan Baru
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      emitChange({
                        collection:
                          currentFilters.collection === "exclusive"
                            ? ""
                            : "exclusive",
                      })
                    }
                    className={`px-2 py-2 text-xs font-semibold border transition text-center ${
                      currentFilters.collection === "exclusive"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-800 border-slate-300 hover:border-slate-900"
                    }`}
                  >
                    Exclusive
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 7. Price Range — Sharp Rectangular Boxes */}
          <div className="py-4">
            <button
              type="button"
              onClick={() => toggleSection("price")}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Rentang Harga
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-500 transition-transform ${
                  openSections.price ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSections.price && (
              <div className="mt-3 space-y-3">
                {/* Quick Price Preset Rectangular Boxes */}
                <div className="grid grid-cols-3 gap-1.5">
                  {PRICE_PRESETS.map((preset) => {
                    const isPresetActive =
                      currentFilters.minPrice === preset.min &&
                      currentFilters.maxPrice === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (priceDebounceRef.current) {
                            clearTimeout(priceDebounceRef.current);
                          }
                          if (isPresetActive) {
                            setMinInput(0);
                            setMaxInput(DEFAULT_MAX_PRICE);
                            emitChange({
                              minPrice: 0,
                              maxPrice: DEFAULT_MAX_PRICE,
                            });
                          } else {
                            setMinInput(preset.min);
                            setMaxInput(preset.max);
                            emitChange({
                              minPrice: preset.min,
                              maxPrice: preset.max,
                            });
                          }
                        }}
                        className={`py-2 px-2 text-xs font-semibold border text-center transition ${
                          isPresetActive
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-800 border-slate-300 hover:border-slate-900"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Min / Max Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="filter-min-price"
                      className="block text-[11px] font-medium text-slate-600 mb-1"
                    >
                      Minimum (Rp)
                    </label>
                    <input
                      id="filter-min-price"
                      type="number"
                      value={minInput}
                      onChange={(e) =>
                        handlePriceInputChange(
                          Math.max(0, Number(e.target.value)),
                          maxInput
                        )
                      }
                      min="0"
                      step="100000"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-300 focus:outline-none focus:border-slate-900"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="filter-max-price"
                      className="block text-[11px] font-medium text-slate-600 mb-1"
                    >
                      Maksimum (Rp)
                    </label>
                    <input
                      id="filter-max-price"
                      type="number"
                      value={maxInput}
                      onChange={(e) =>
                        handlePriceInputChange(
                          minInput,
                          Math.max(0, Number(e.target.value))
                        )
                      }
                      min="0"
                      step="100000"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-300 focus:outline-none focus:border-slate-900"
                      placeholder="5000000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Close/Apply Button */}
        <div className="lg:hidden pt-4 border-t border-slate-200 mt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition"
          >
            Tampilkan Hasil
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductFilters);
