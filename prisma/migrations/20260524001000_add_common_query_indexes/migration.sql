-- Speed up storefront product lists and customer/admin order lists.
CREATE INDEX IF NOT EXISTS "products_isActive_createdAt_idx"
ON "public"."products"("isActive", "createdAt");

CREATE INDEX IF NOT EXISTS "products_isActive_categoryId_idx"
ON "public"."products"("isActive", "categoryId");

CREATE INDEX IF NOT EXISTS "orders_userId_createdAt_idx"
ON "public"."orders"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "orders_status_createdAt_idx"
ON "public"."orders"("status", "createdAt");
