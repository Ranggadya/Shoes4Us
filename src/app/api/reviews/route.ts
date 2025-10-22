import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reviews?productId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Parameter productId wajib disertakan" },
        { status: 400 }
      );
    }
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        summary: { total: totalReviews, averageRating },
      },
    });
  } catch (error) {
    console.error("❌ Gagal mengambil review:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat review" },
      { status: 500 }
    );
  }
}
