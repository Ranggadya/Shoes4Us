import { NextRequest, NextResponse } from "next/server";
import { ReviewService } from "../services/ReviewService";
import { successResponse } from "@/utils/api-response";
import { getUserFromSession } from "@/lib/auth";

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  async getByProduct(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const result = await this.reviewService.getReviewsByProduct(productId);
    return successResponse(result.data);
  }

  async create(req: NextRequest) {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, rating, title, comment } = body;

    if (!productId || !rating || !comment) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const result = await this.reviewService.addReview({
      productId,
      userId: user.userId,
      rating: Number(rating),
      title,
      comment
    });

    return successResponse(result.data, 201);
  }
}
