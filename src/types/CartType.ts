export interface AddToCartInput {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export type CartItem = {
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
};
