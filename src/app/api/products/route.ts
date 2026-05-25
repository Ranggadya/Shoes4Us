import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductAudience, ProductSegment } from "@prisma/client";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
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

export async function POST(req: Request) {
  try {
    // Validasi admin
    const user = await getUserFromSession();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin yang dapat menambahkan produk." },
        { status: 403 }
      );
    }

    // Ambil data form
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string;
    const stock = Number(formData.get("stock")) || 0;
    const image = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const brand = ((formData.get("brand") as string | null) || "").trim();
    const segment = parseSegment(formData.get("segment"));
    const audience = parseAudience(formData.get("audience"));
    const isNewArrival = parseBooleanField(formData, "isNewArrival", true);
    const isExclusive = parseBooleanField(formData, "isExclusive");
    const isComingSoon = parseBooleanField(formData, "isComingSoon");
    const isSale = parseBooleanField(formData, "isSale");
    const sizes = parseSizeStocks(formData.get("sizes"));
    const totalStock = sizes.length > 0
      ? sizes.reduce((sum, item) => sum + item.stock, 0)
      : stock;

    // 🧠 Validasi field
    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Nama, kategori, dan harga wajib diisi" },
        { status: 400 }
      );
    }

    // 📸 Proses gambar (boleh file atau URL)
    let finalImageUrl: string | null = null;

    if (image) {
      const fileName = `${uuidv4()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, image, { upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(fileName);

      finalImageUrl = publicUrl;
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    } else {
      return NextResponse.json(
        { error: "Gambar wajib diisi, baik file atau URL Supabase." },
        { status: 400 }
      );
    }

    // 🏷️ Cari atau buat kategori baru
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

    // 💾 Simpan produk
    const product = await prisma.product.create({
      data: {
        name,
        price,
        description,
        stock: totalStock,
        imageUrl: finalImageUrl,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        categoryId,
        brand: brand || null,
        segment,
        audience,
        isNewArrival,
        isExclusive,
        isComingSoon,
        isSale,
        ...(sizes.length > 0
          ? {
              sizes: {
                create: sizes,
              },
            }
          : {}),
      },
      include: {
        sizes: { orderBy: { size: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("❌ Error uploading product:", error);
    return NextResponse.json(
      { error: "Gagal upload produk" },
      { status: 500 }
    );
  }
} 

export async function GET(req: NextRequest) {
  try {
    return await productController.getAll(req);
  } catch (error) {
    return handleError(error);
  }
}
