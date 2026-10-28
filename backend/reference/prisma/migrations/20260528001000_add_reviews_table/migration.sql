CREATE TABLE IF NOT EXISTS "public"."reviews" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "title" TEXT,
  "comment" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "helpful" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "reviews_productId_idx"
ON "public"."reviews"("productId");

CREATE INDEX IF NOT EXISTS "reviews_userId_idx"
ON "public"."reviews"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_productId_fkey'
  ) THEN
    ALTER TABLE "public"."reviews"
      ADD CONSTRAINT "reviews_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "public"."products"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_userId_fkey'
  ) THEN
    ALTER TABLE "public"."reviews"
      ADD CONSTRAINT "reviews_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
