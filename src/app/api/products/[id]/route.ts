import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductAudience, ProductSegment } from "@prisma/client";
import { getUserFromSession } from "@/lib/auth";
import { ProductController } from "@/layers/controllers/ProductController";
import { handleError } from "@/exceptions/handlerError";

const productController = new ProductController();
const PRODUCT_AUDIENCES = ["UNISEX", "MEN", "WOMEN", "KIDS"] as const;
const PRODUCT_SEGMENTS = ["SHOES", "APPAREL", "ACCESSORIES"] as const;

const parseBooleanField = (formData: FormData, key: string, fallback = false) => {
  const value = formData.get(key);
  if (value === null) return fallback;
  return value === "true" || value === "on" || value === "1";
};

const parseAudience = (value: FormDataEntryValue | null): ProductAudience => {
  const audience = typeof value === "string" ? value : "UNISEX";
  return PRODUCT_AUDIENCES.includes(audience as (typeof PRODUCT_AUDIENCES)[number])
    ? (audience as ProductAudience)
    : ProductAudience.UNISEX;
};

const parseSegment = (value: FormDataEntryValue | null): ProductSegment => {
  const segment = typeof value === "string" ? value : "SHOES";
  return PRODUCT_SEGMENTS.includes(segment as (typeof PRODUCT_SEGMENTS)[number])
    ? (segment as ProductSegment)
    : ProductSegment.SHOES;
};

const parseSizeStocks = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as Array<{ size?: unknown; stock?: unknown }>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        size: String(item.size ?? "").trim(),
        stock: Math.max(0, Number(item.stock) || 0),
      }))
      .filter((item) => item.size.length > 0);
  } catch {
    return [];
  }
};

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    return await productController.getById(id);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin yang dapat mengedit produk." },
        { status: 403 }
      );
    }

    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock")) || 0;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const brand = ((formData.get("brand") as string | null) || "").trim();
    const segment = parseSegment(formData.get("segment"));
    const audience = parseAudience(formData.get("audience"));
    const isNewArrival = parseBooleanField(formData, "isNewArrival");
    const isExclusive = parseBooleanField(formData, "isExclusive");
    const isComingSoon = parseBooleanField(formData, "isComingSoon");
    const isSale = parseBooleanField(formData, "isSale");
    const sizes = parseSizeStocks(formData.get("sizes"));
    const totalStock = sizes.length > 0
      ? sizes.reduce((sum, item) => sum + item.stock, 0)
      : stock;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Nama, kategori, dan harga wajib diisi" },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name: category },
    });

    let categoryId: string;
    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const newCategory = await prisma.category.create({
        data: {
          name: category,
          slug: category.toLowerCase().replace(/\s+/g, "-"),
        },
      });
      categoryId = newCategory.id;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const updatedProduct = await prisma.$transaction(async (tx) => {
      await tx.productSize.deleteMany({ where: { productId: id } });
      if (sizes.length > 0) {
        await tx.productSize.createMany({
          data: sizes.map((item) => ({
            productId: id,
            size: item.size,
            stock: item.stock,
          })),
        });
      }

      return tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          price,
          stock: totalStock,
          description,
          imageUrl,
          categoryId,
          brand: brand || null,
          segment,
          audience,
          isNewArrival,
          isExclusive,
          isComingSoon,
          isSale,
        },
        include: {
          category: true,
          sizes: { orderBy: { size: "asc" } },
        },
      });
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin yang dapat menghapus produk." },
        { status: 403 }
      );
    }

    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Produk dihapus" });
  } catch (error) {
    return handleError(error);
  }
}
