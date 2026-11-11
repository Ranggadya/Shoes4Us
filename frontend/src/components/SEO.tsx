import { ReactNode, useEffect } from "react";

export type SEOProps = {
  title: string;
  description?: string | null;
  image?: string | null;
  url?: string;
  type?: "website" | "product";
  priceAmount?: number;
};

export function HelmetProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function upsertMetaTag(
  attrName: "name" | "property",
  attrValue: string,
  content: string
) {
  let meta = document.head.querySelector(
    `meta[${attrName}="${attrValue}"]`
  ) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attrName, attrValue);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  priceAmount,
}: SEOProps) {
  const fullTitle = title.includes("Shoes4Us") ? title : `${title} | Shoes4Us`;
  const cleanDescription =
    description?.trim() ||
    "Temukan koleksi sepatu olahraga, kasual, dan sneakers orisinal terbaik di Shoes4Us.";
  const resolvedImage =
    image && (image.startsWith("http") || image.startsWith("/"))
      ? image
      : "/logo.jpg";
  const resolvedUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    document.title = fullTitle;
    upsertMetaTag("name", "description", cleanDescription);
    upsertMetaTag("property", "og:site_name", "Shoes4Us");
    upsertMetaTag("property", "og:title", fullTitle);
    upsertMetaTag("property", "og:description", cleanDescription);
    upsertMetaTag("property", "og:type", type);
    upsertMetaTag("property", "og:image", resolvedImage);
    if (resolvedUrl) {
      upsertMetaTag("property", "og:url", resolvedUrl);
    }
    upsertMetaTag("name", "twitter:card", "summary_large_image");
    upsertMetaTag("name", "twitter:title", fullTitle);
    upsertMetaTag("name", "twitter:description", cleanDescription);
    upsertMetaTag("name", "twitter:image", resolvedImage);
    if (typeof priceAmount === "number" && Number.isFinite(priceAmount)) {
      upsertMetaTag("property", "product:price:amount", String(priceAmount));
      upsertMetaTag("property", "product:price:currency", "IDR");
    }
  }, [
    fullTitle,
    cleanDescription,
    resolvedImage,
    resolvedUrl,
    type,
    priceAmount,
  ]);

  return null;
}
