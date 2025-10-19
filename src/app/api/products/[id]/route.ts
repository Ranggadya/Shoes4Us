import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { getUserFromSession } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin yang dapat mengedit produk." },
        { status: 403 }
      );
    }

    const id = params.id;
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock")) || 0;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;

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

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        price,
        stock,
        description,
        imageUrl,
        categoryId,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error("❌ Gagal update produk:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui produk" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin yang dapat menghapus produk." },
        { status: 403 }
      );
    }

    const id = params.id;
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Produk dihapus" });
  } catch (error) {
    console.error("❌ Gagal hapus produk:", error);
    return NextResponse.json(
      { error: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}
