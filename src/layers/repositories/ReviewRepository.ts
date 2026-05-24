import { prisma } from '@/lib/prisma';

export class ReviewRepository {
  async findByProductId(productId: string) {
    return prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSummary(productId: string) {
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true }
    });

    const total = reviews.length;
    if (total === 0) {
      return {
        total: 0,
        averageRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = Number((sum / total).toFixed(1));

    const distribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return { total, averageRating, distribution };
  }

  async create(data: {
    productId: string;
    userId: string;
    rating: number;
    title?: string | null;
    comment: string;
    verified?: boolean;
  }) {
    return prisma.review.create({
      data,
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async delete(id: string) {
    return prisma.review.delete({
      where: { id }
    });
  }
}
