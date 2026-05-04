import { NextResponse } from "next/server";
import { CategoryRepository } from "@/layers/repositories/CategoryRepository";

const categoryRepo = new CategoryRepository();

export async function GET() {
  try {
    const categories = await categoryRepo.findAll();
    return NextResponse.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat kategori" },
      { status: 500 }
    );
  }
}
