// src/layers/repositories/product.repository.ts
import { prisma } from '@/lib/prisma';
import { ProductCreateInput, ProductUpdateInput, ProductFilterInput, ProductSizeStockInput } from '@/types/ProductType';
import { Prisma, ProductAudience } from '@prisma/client';

export class ProductRepository {
  private normalizeSizes(sizes?: ProductSizeStockInput[]) {
    return (sizes ?? [])
      .map((item) => ({
        size: item.size.trim(),
        stock: Math.max(0, Number(item.stock) || 0),
      }))
      .filter((item) => item.size.length > 0);
  }

  private totalSizeStock(sizes?: ProductSizeStockInput[]) {
    return this.normalizeSizes(sizes).reduce((sum, item) => sum + item.stock, 0);
  }

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
          sizes: {
            orderBy: { size: 'asc' },
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
        sizes: {
          orderBy: { size: 'asc' },
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
        sizes: {
          orderBy: { size: 'asc' },
        },
      },
    });
  }

  async create(data: ProductCreateInput) {
    const { sizes, ...productData } = data;
    const normalizedSizes = this.normalizeSizes(sizes);
    const stock = normalizedSizes.length > 0 ? this.totalSizeStock(sizes) : productData.stock;

    return prisma.product.create({
      data: {
        ...productData,
        stock,
        ...(normalizedSizes.length > 0
          ? {
              sizes: {
                create: normalizedSizes,
              },
            }
          : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        sizes: {
          orderBy: { size: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: ProductUpdateInput) {
    const { sizes, ...productData } = data;
    const normalizedSizes = this.normalizeSizes(sizes);
    const stock = sizes !== undefined ? this.totalSizeStock(sizes) : productData.stock;

    return prisma.$transaction(async (tx) => {
      if (sizes !== undefined) {
        await tx.productSize.deleteMany({ where: { productId: id } });
        if (normalizedSizes.length > 0) {
          await tx.productSize.createMany({
            data: normalizedSizes.map((item) => ({
              productId: id,
              size: item.size,
              stock: item.stock,
            })),
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          ...(stock !== undefined ? { stock } : {}),
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          sizes: {
            orderBy: { size: 'asc' },
          },
        },
      });
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

  async checkStockAvailability(productId: string, quantity: number, size?: string | null): Promise<boolean> {
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: {
        stock: true,
        sizes: size
          ? {
              where: { size },
              select: { stock: true },
            }
          : {
              select: { stock: true },
            },
      },
    });

    if (!product) return false;
    if (size && product.sizes.length > 0) {
      return product.sizes[0].stock >= quantity;
    }

    return product.stock >= quantity;
  }

  async adjustStock(productId: string, quantity: number, size?: string | null) {
    try {
      const updated = await prisma.$transaction(async (tx) => {
        if (size) {
          const productSize = await tx.productSize.findUnique({
            where: { productId_size: { productId, size } },
          });

          if (productSize) {
            await tx.productSize.update({
              where: { id: productSize.id },
              data: {
                stock: {
                  increment: quantity,
                },
              },
            });
          }
        }

        return tx.product.update({
          where: { id: productId },
          data: {
            stock: {
              increment: quantity,
            },
          },
        });
      });
      return updated;
    } catch (_err) {
      return null;
    }
  }

  async reduceStock(productId: string, quantity: number, size?: string | null) {
    return this.adjustStock(productId, -quantity, size);
  }
}
