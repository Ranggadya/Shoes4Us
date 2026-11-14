import type { Category } from "@/types";

const KNOWN_SHOE_BRANDS = [
  "Onitsuka Tiger",
  "New Balance",
  "Under Armour",
  "Air Jordan",
  "Jordan",
  "Converse",
  "Salomon",
  "Skechers",
  "Reebok",
  "Adidas",
  "Asics",
  "Hoka",
  "Nike",
  "Puma",
  "Vans",
];

export const formatCurrency = (value: number, locale = "id-ID") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

export function getCategoryName(
  category: Category | { name?: string } | string | null | undefined,
  fallback = "Uncategorized"
): string {
  if (!category) return fallback;
  if (typeof category === "string") return category;
  return category.name || fallback;
}

export function resolveProductBrand(
  name: string,
  brand?: string | null,
  category?: Category | { name?: string } | string | null,
  fallback = "Shoes4Us"
): string {
  if (brand && brand.trim().length > 0) {
    return brand.trim();
  }

  const lowerName = (name || "").toLowerCase();
  for (const known of KNOWN_SHOE_BRANDS) {
    if (lowerName.includes(known.toLowerCase())) {
      return known;
    }
  }

  const resolvedCategory = getCategoryName(category, "");
  if (resolvedCategory.trim().length > 0) {
    return resolvedCategory.trim();
  }

  return fallback;
}

export function formatDate(
  dateStr: string | null | undefined,
  locale = "id-ID"
): string {
  if (!dateStr) return "-";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

