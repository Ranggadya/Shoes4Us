export type UserRole = "CUSTOMER" | "ADMIN" | "USER";

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  imageUrl?: string | null;
}

export interface RegisterInput {
  email: string;
  password?: string | null;
  name?: string;
  role?: UserRole;
  imageUrl?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type ProductAudience = "UNISEX" | "MEN" | "WOMEN" | "KIDS";
export type ProductSegment = "SHOES" | "APPAREL" | "ACCESSORIES";
export type ProductCollection = "new-arrivals" | "exclusive" | "coming-soon" | "sale";

export interface ProductSizeStock {
  id?: string;
  size: string;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  categoryId?: string;
  category?: Category | string | null;
  brand?: string | null;
  segment?: ProductSegment;
  audience?: ProductAudience;
  isNewArrival?: boolean;
  isExclusive?: boolean;
  isComingSoon?: boolean;
  isSale?: boolean;
  isActive?: boolean;
  sizes?: ProductSizeStock[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  priceSnap: number;
  size?: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
  };
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id: string | number;
  productId?: string;
  quantity: number;
  price: number;
  size?: string;
  product: {
    id?: string;
    name: string;
    imageUrl?: string | null;
    price?: number;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingPhone?: string;
  paymentMethod?: string;
  paymentUrl?: string | null;
  totalAmount: number;
  status: OrderStatus;
  snapToken?: string | null;
  note?: string;
  items: OrderItem[];
  user?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product?: Product;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
