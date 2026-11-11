import type { Category } from "@/types";

export const formatCurrency = (value: number, locale = "id-ID") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

export function getCategoryName(
  category: Category | string | null | undefined,
  fallback = "Uncategorized"
): string {
  if (!category) return fallback;
  if (typeof category === "string") return category;
  return category.name || fallback;
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

