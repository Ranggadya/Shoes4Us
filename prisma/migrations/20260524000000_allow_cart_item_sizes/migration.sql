-- Allow the same product to appear in the cart with different shoe sizes.
DROP INDEX IF EXISTS "public"."cart_items_cartId_productId_key";

CREATE INDEX IF NOT EXISTS "cart_items_cartId_productId_size_idx"
ON "public"."cart_items"("cartId", "productId", "size");
