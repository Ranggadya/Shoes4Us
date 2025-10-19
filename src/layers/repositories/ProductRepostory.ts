// src/layers/repositories/product.repository.ts
import { prisma } from '@/lib/prisma';
import { ProductCreateInput, ProductUpdateInput, ProductFilterInput } from '@/types/ProductType';
import { Prisma } from '@prisma/client';

export class ProductRepository {
  async findAll(filter?: ProductFilterInput & { page?: number; limit?: number }) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter?.minPrice !== undefined || filter?.maxPrice !== undefined) {
      where.price = {
        ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
        ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
      };
    }

    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async create(data: ProductCreateInput) {
    return prisma.product.create({
      data,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async update(id: string, data: ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false }, 
    });
  }

  async hardDelete(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }

  async checkStockAvailability(productId: string, quantity: number): Promise<boolean> {
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: { stock: true },
    });
    return product ? product.stock >= quantity : false;
  }

  async adjustStock(productId: string, quantity: number) {
    try {
      const updated = await prisma.product.update({
        where: { id: productId },
        data: {
          stock: {
            increment: quantity, // gunakan negatif untuk mengurangi stock
          },
        },
      });
      return updated;
    } catch (err) {
      return null;
    }
  }

  async reduceStock(productId: string, quantity: number) {
    return this.adjustStock(productId, -quantity);
  }
}