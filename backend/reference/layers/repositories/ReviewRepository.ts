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
    const groupedRatings = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true }
    });

    const total = groupedRatings.reduce(
      (sum, item) => sum + item._count.rating,
      0
    );

    if (total === 0) {
      return {
        total: 0,
        averageRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const sum = groupedRatings.reduce(
      (acc, item) => acc + item.rating * item._count.rating,
      0
    );
    const averageRating = Number((sum / total).toFixed(1));

    const distribution = groupedRatings.reduce(
      (acc, item) => ({
        ...acc,
        [item.rating]: item._count.rating,
      }),
      { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    );

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
