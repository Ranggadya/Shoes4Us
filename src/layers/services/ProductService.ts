import { ProductRepository } from "@/layers/repositories/ProductRepository";
import { ProductCreateInput, ProductUpdateInput, ProductFilterInput } from "@/types/ProductType";
import { NotFoundError } from "@/exceptions/NotFoundError";
import { ConflictError } from "@/exceptions/ConflictError";
import { Prisma } from "@prisma/client";
import { Product } from "@prisma/client";
import { uploadProductImage } from "@/lib/uploadSupabase";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedProducts {
  products: Product[];
  meta: PaginationMeta;
}

export class ProductService {
  private productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }

  // =============================
  // 🔹 Get All Products (with filter + pagination)
  // =============================
  async getAllProducts(
    filter?: ProductFilterInput & { page?: number; limit?: number }
  ): Promise<{ success: boolean; data: PaginatedProducts }> {
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 10;

    const result = await this.productRepository.findAll({ ...filter, page, limit });

    return {
      success: true,
      data: {
        products: result.products,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
    };
  }

  // =============================
  // 🔹 Get Product by ID
  // =============================
  async getProductById(id: string): Promise<{ success: boolean; data: Product }> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundError("Produk tidak ditemukan");

    return { success: true, data: product };
  }

  // =============================
  // 🔹 Get Product by Slug
  // =============================
  async getProductBySlug(slug: string): Promise<{ success: boolean; data: Product }> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) throw new NotFoundError("Produk tidak ditemukan");

    return { success: true, data: product };
  }

  // =============================
  // 🔹 Create Product (with optional image upload)
  // =============================
  async createProduct(
    data: ProductCreateInput,
    imageFile?: File
  ): Promise<{ success: boolean; message: string; data: Product }> {
    try {
      // Upload gambar jika ada file
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const product = await this.productRepository.create({
        ...data,
        ...(imageUrl ? { imageUrl } : {}),
      });

      return {
        success: true,
        message: "Produk berhasil ditambahkan",
        data: product,
      };
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        // Slug sudah ada (unique constraint)
        throw new ConflictError("Produk dengan slug ini sudah ada");
      }
      if (err instanceof Error) throw err;
      throw new Error("Terjadi kesalahan saat membuat produk");
    }
  }

  // =============================
  // 🔹 Update Product (with optional image upload)
  // =============================
  async updateProduct(
    id: string,
    data: ProductUpdateInput,
    imageFile?: File
  ): Promise<{ success: boolean; message: string; data: Product }> {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) throw new NotFoundError("Produk tidak ditemukan");

    try {
      // Upload gambar baru jika ada
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const updated = await this.productRepository.update(id, {
        ...data,
        ...(imageUrl ? { imageUrl } : {}),
      });

      return {
        success: true,
        message: "Produk berhasil diperbarui",
        data: updated,
      };
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictError("Produk dengan slug ini sudah ada");
      }
      if (err instanceof Error) throw err;
      throw new Error("Terjadi kesalahan saat memperbarui produk");
    }
  }

  // =============================
  // 🔹 Soft Delete Product
  // =============================
  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundError("Produk tidak ditemukan");

    await this.productRepository.delete(id);

    return {
      success: true,
      message: "Produk berhasil dihapus",
    };
  }
}
