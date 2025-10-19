import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { getUserFromSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 🔐 Validasi admin
    const user = await getUserFromSession();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin yang dapat menambahkan produk." },
        { status: 403 }
      );
    }

    // 🧩 Ambil data form
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string;
    const image = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;

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
    } else if (imageUrl && imageUrl.startsWith("http")) {
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
        imageUrl: finalImageUrl,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        categoryId,
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

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: { items: products },
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat produk" },
      { status: 500 }
    );
  }
}
