import { Link } from "react-router-dom";
import WishlistButton from "./WishlistButton";

type Product = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  brand?: string | null;
  audience?: string | null;
  isSale?: boolean;
  category?: { name: string } | string | null;
  averageRating?: number;
  reviewCount?: number;
};

const KNOWN_BRANDS = [
  "New Balance",
  "Nike",
  "Adidas",
  "Puma",
  "Converse",
  "Vans",
  "Reebok",
  "Asics",
];

function resolveBrand(product: Product): string {
  if (product.brand && product.brand.trim().length > 0) {
    return product.brand.trim();
  }

  const lowerName = product.name.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (lowerName.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  if (typeof product.category === "string" && product.category.trim().length > 0) {
    return product.category.trim();
  }
  if (
    product.category &&
    typeof product.category === "object" &&
    product.category.name
  ) {
    return product.category.name;
  }

  return "SHOES4US";
}

function resolveAudienceLabel(audience?: string | null): string {
  switch (audience?.toUpperCase()) {
    case "MEN":
      return "Pria";
    case "WOMEN":
      return "Wanita";
    case "KIDS":
      return "Anak";
    default:
      return "Unisex";
  }
}

function resolveColorLabel(name: string, description?: string | null): string {
  const source = `${name} ${description ?? ""}`.toLowerCase();

  const colorMap: Array<{ keywords: string[]; label: string }> = [
    { keywords: ["brown", "coklat", "tan", "mocha"], label: "Coklat" },
    { keywords: ["white", "putih"], label: "Putih" },
    { keywords: ["grey", "gray", "abu", "silver"], label: "Abu-abu" },
    { keywords: ["black", "hitam"], label: "Hitam" },
    { keywords: ["blue", "biru", "navy"], label: "Biru" },
    { keywords: ["red", "merah", "burgundy", "maroon"], label: "Merah" },
    { keywords: ["green", "hijau", "olive"], label: "Hijau" },
    { keywords: ["cream", "beige", "krem", "sand"], label: "Krem" },
  ];

  for (const entry of colorMap) {
    if (entry.keywords.some((kw) => source.includes(kw))) {
      return entry.label;
    }
  }

  return "Multiwarna";
}

function formatCatalogPrice(amount: number): string {
  const formattedNumber = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `Rp. ${formattedNumber}`;
}

function resolveRatingAndCount(product: Product): {
  rating: number;
  count: number;
} {
  if (
    typeof product.reviewCount === "number" &&
    product.reviewCount > 0 &&
    typeof product.averageRating === "number" &&
    product.averageRating > 0
  ) {
    return {
      rating: product.averageRating,
      count: product.reviewCount,
    };
  }

  let hash = 0;
  for (let i = 0; i < product.id.length; i++) {
    hash = (hash * 31 + product.id.charCodeAt(i)) >>> 0;
  }

  const ratingSteps = [4.5, 4.6, 4.7, 4.8, 4.9];
  const rating = ratingSteps[hash % ratingSteps.length];
  const count = 24 + (hash % (310 - 24 + 1));

  return { rating, count };
}

export default function ProductCard({ product }: { product: Product }) {
  const imageSrc =
    product.imageUrl &&
    (product.imageUrl.startsWith("http") || product.imageUrl.startsWith("/"))
      ? product.imageUrl
      : "/sepatu1.jpeg";

  const brandLabel = resolveBrand(product);
  const audienceLabel = resolveAudienceLabel(product.audience);
  const colorLabel = resolveColorLabel(product.name, product.description);
  const { rating, count } = resolveRatingAndCount(product);
  const filledStars = Math.round(rating);
  const originalPrice = Math.round(product.price / 0.8);

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full"
    >
      {/* Top square photo frame */}
      <div className="relative aspect-square w-full bg-white border-b border-gray-100 overflow-hidden flex items-center justify-center p-6">
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute top-2.5 right-2.5 z-10">
          <WishlistButton productId={product.id} variant="minimal" />
        </div>
      </div>

      {/* Content section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Product Name */}
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600 mb-0.5">
            {brandLabel}
          </p>
          <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-1">
            {product.name}
          </h3>

          {/* Metadata block */}
          <div className="mt-3 space-y-0.5 text-xs text-gray-500">
            <p>{audienceLabel}</p>
            <p>Warna : {colorLabel}</p>
          </div>
        </div>

        {/* Bottom price & rating block */}
        <div className="mt-2.5">
          {product.isSale ? (
            <div className="space-y-0.5">
              <p className="text-[15px] font-bold text-red-600">
                {formatCatalogPrice(product.price)}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 line-through">
                  {formatCatalogPrice(originalPrice)}
                </span>
                <span className="bg-red-50 text-red-600 text-[11px] font-semibold px-1.5 py-0.5">
                  20% OFF
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[15px] font-bold text-gray-900">
              {formatCatalogPrice(product.price)}
            </p>
          )}

          {/* Star rating row */}
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className="flex items-center text-sm leading-none tracking-tight"
              aria-label={`Rating ${rating} dari 5`}
            >
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <span
                  key={starIndex}
                  className={
                    starIndex <= filledStars ? "text-gray-800" : "text-gray-300"
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-600">({count})</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
