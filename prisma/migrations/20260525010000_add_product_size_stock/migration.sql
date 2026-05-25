CREATE TABLE "public"."product_sizes" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_sizes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_sizes_productId_size_key" ON "public"."product_sizes"("productId", "size");
CREATE INDEX "product_sizes_productId_idx" ON "public"."product_sizes"("productId");

ALTER TABLE "public"."product_sizes"
  ADD CONSTRAINT "product_sizes_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "public"."products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
