CREATE TYPE "public"."ProductAudience" AS ENUM ('UNISEX', 'MEN', 'WOMEN', 'KIDS');
CREATE TYPE "public"."ProductSegment" AS ENUM ('SHOES', 'APPAREL', 'ACCESSORIES');

ALTER TABLE "public"."products"
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "segment" "public"."ProductSegment" NOT NULL DEFAULT 'SHOES',
  ADD COLUMN "audience" "public"."ProductAudience" NOT NULL DEFAULT 'UNISEX',
  ADD COLUMN "isNewArrival" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "isExclusive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isComingSoon" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isSale" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "products_audience_isActive_idx" ON "public"."products"("audience", "isActive");
CREATE INDEX "products_segment_isActive_idx" ON "public"."products"("segment", "isActive");
CREATE INDEX "products_brand_idx" ON "public"."products"("brand");
CREATE INDEX "products_isNewArrival_createdAt_idx" ON "public"."products"("isNewArrival", "createdAt");
CREATE INDEX "products_isExclusive_createdAt_idx" ON "public"."products"("isExclusive", "createdAt");
CREATE INDEX "products_isComingSoon_createdAt_idx" ON "public"."products"("isComingSoon", "createdAt");
CREATE INDEX "products_isSale_createdAt_idx" ON "public"."products"("isSale", "createdAt");
