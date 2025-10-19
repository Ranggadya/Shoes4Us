/*
  Warnings:

  - Added the required column `priceSnap` to the `cart_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."cart_items" ADD COLUMN     "priceSnap" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "public"."order_items" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."orders" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(65,30);
