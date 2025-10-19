import { NextRequest } from "next/server";
import { ProductService } from "../services/ProductService";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
} from "../validators/ProductValidator";
import {
  successResponse,
  createdResponse,
} from "@/utils/api-response";

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async getAll(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const filterData = {
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : 20,
    };

    const validated = productFilterSchema.parse(filterData);
    const result = await this.productService.getAllProducts(validated);

    return successResponse(result.data.products, 200, result.data.meta);
  }
  async getById(id: string) {
    const result = await this.productService.getProductById(id);
    return successResponse(result.data);
  }

  async create(request: NextRequest) {
    const body = await request.json();
    const validated = createProductSchema.parse(body);

    const result = await this.productService.createProduct(validated);
    return createdResponse(result.data);
  }

  async update(id: string, request: NextRequest) {
    const body = await request.json();
    const validated = updateProductSchema.parse(body);

    const result = await this.productService.updateProduct(id, validated);
    return successResponse(result.data);
  }
  async delete(id: string) {
    const result = await this.productService.deleteProduct(id);
    return successResponse({ message: result.message }, 200);
  }
}
