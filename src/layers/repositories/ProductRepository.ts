// src/layers/repositories/product.repository.ts
import { prisma } from '@/lib/prisma';
import { ProductCreateInput, ProductUpdateInput, ProductFilterInput } from '@/types/ProductType';
import { Prisma, ProductAudience } from '@prisma/client';

export class ProductRepository {
  async findAll(filter?: ProductFilterInput & { page?: number; limit?: number }) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { brand: { contains: filter.search, mode: 'insensitive' } },
        { category: { name: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter?.categorySlug) {
      const categorySlugs =
        filter.categorySlug === 'sport'
          ? ['sport', 'sports']
          : [filter.categorySlug];
      where.category = { slug: { in: categorySlugs } };
    }

    if (filter?.segment) {
      where.segment = filter.segment;
    }

    if (filter?.audience) {
      where.audience =
        filter.audience === 'UNISEX'
          ? ProductAudience.UNISEX
          : { in: [filter.audience, ProductAudience.UNISEX] };
    }

    if (filter?.brand) {
      where.brand = { contains: filter.brand, mode: 'insensitive' };
    }

    if (filter?.collection) {
      switch (filter.collection) {
        case 'exclusive':
          where.isExclusive = true;
          break;
        case 'coming-soon':
          where.isComingSoon = true;
          break;
        case 'sale':
          where.isSale = true;
          break;
        case 'new-arrivals':
        default:
          where.isNewArrival = true;
          break;
      }
    }

    if (filter?.isNewArrival !== undefined) {
      where.isNewArrival = filter.isNewArrival;
    }

    if (filter?.isExclusive !== undefined) {
      where.isExclusive = filter.isExclusive;
    }

    if (filter?.isComingSoon !== undefined) {
      where.isComingSoon = filter.isComingSoon;
    }

    if (filter?.isSale !== undefined) {
      where.isSale = filter.isSale;
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

    // Define Sort Order
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    
    if (filter?.sortBy) {
      switch (filter.sortBy) {
        case 'price-low':
        case 'price-asc':
          orderBy = { price: 'asc' };
          break;
        case 'price-high':
        case 'price-desc':
          orderBy = { price: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'name-asc':
          orderBy = { name: 'asc' };
          break;
        case 'name-desc':
          orderBy = { name: 'desc' };
          break;
        case 'newest':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy,
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
    } catch (_err) {
      return null;
    }
  }

  async reduceStock(productId: string, quantity: number) {
    return this.adjustStock(productId, -quantity);
  }
}
