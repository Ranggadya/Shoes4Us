import { ReviewRepository } from "../repositories/ReviewRepository";
import { NotFoundError } from "@/exceptions/NotFoundError";

export class ReviewService {
  private reviewRepository: ReviewRepository;

  constructor() {
    this.reviewRepository = new ReviewRepository();
  }

  async getReviewsByProduct(productId: string) {
    const [reviews, summary] = await Promise.all([
      this.reviewRepository.findByProductId(productId),
      this.reviewRepository.getSummary(productId)
    ]);

    return {
      success: true,
      data: {
        reviews,
        summary
      }
    };
  }

  async addReview(data: {
    productId: string;
    userId: string;
    rating: number;
    title?: string | null;
    comment: string;
  }) {
    // Check if user has bought the product (optional enhancement)
    // For now, just mark as verified if we want
    
    const review = await this.reviewRepository.create({
      ...data,
      verified: false // You could implement purchase check here
    });

    return {
      success: true,
      message: "Review berhasil ditambahkan",
      data: { review }
    };
  }
}
