CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_name_trgm_idx"
ON "public"."products"
USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "products_description_trgm_idx"
ON "public"."products"
USING GIN ("description" gin_trgm_ops)
WHERE "description" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "products_brand_trgm_idx"
ON "public"."products"
USING GIN ("brand" gin_trgm_ops)
WHERE "brand" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "categories_name_trgm_idx"
ON "public"."categories"
USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "products_isActive_price_idx"
ON "public"."products"("isActive", "price");

CREATE INDEX IF NOT EXISTS "products_isActive_name_idx"
ON "public"."products"("isActive", "name");

CREATE INDEX IF NOT EXISTS "order_items_orderId_idx"
ON "public"."order_items"("orderId");

CREATE INDEX IF NOT EXISTS "order_items_productId_idx"
ON "public"."order_items"("productId");
