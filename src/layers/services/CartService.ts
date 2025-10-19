import { CartRepository } from "@/layers/repositories/CartRepostory";
import { ProductRepository } from "@/layers/repositories/ProductRepostory";
import { ValidationError } from "@/exceptions/ValidationError";
import { NotFoundError } from "@/exceptions/NotFoundError";

export class CartService {
    private cartRepo = new CartRepository();
    private productRepo = new ProductRepository();

    async getMyCart(userId: string) {
        const cart = await this.cartRepo.getOrCreateCart(userId);

        const items = cart.items.map((item) => ({
            id: item.id,
            product: {
                id: item.product.id,
                name: item.product.name,
                price: Number(item.priceSnap),
                imageUrl: item.product.imageUrl,
            },
            quantity: item.quantity,
            lineTotal: Number(item.priceSnap) * item.quantity,
        }));

        const totals = {
            subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
            totalItems: items.length,
        };

        return { id: cart.id, items, totals };
    }

    async addToCart(userId: string, productId: string, quantity: number) {
        const product = await this.productRepo.findById(productId);
        if (!product) throw new NotFoundError("Produk tidak ditemukan");
        if (!product.isActive) throw new ValidationError("Produk tidak aktif");
        if (product.stock < quantity)
            throw new ValidationError("Stok produk tidak mencukupi");

        const cart = await this.cartRepo.getOrCreateCart(userId);

        const item = await this.cartRepo.upsertItem(
            cart.id,
            productId,
            Number(product.price),
            quantity
        );

        return {
            message: "Produk berhasil ditambahkan ke keranjang",
            item: {
                id: item.id,
                productId: item.productId,
                name: item.product.name,
                quantity: item.quantity,
                price: Number(item.priceSnap),
            },
        };
    }

    async updateItemQuantity(userId: string, itemId: string, quantity: number) {
        if (quantity < 0)
            throw new ValidationError("Jumlah produk tidak boleh negatif");

        const cart = await this.cartRepo.getOrCreateCart(userId);
        const item = cart.items.find((i) => i.id === itemId);
        if (!item) throw new NotFoundError("Item tidak ditemukan di keranjang");

        const product = await this.productRepo.findById(item.productId);
        if (!product) throw new NotFoundError("Produk tidak ditemukan");
        if (product.stock < quantity)
            throw new ValidationError("Stok produk tidak mencukupi");

        const updatedItem = await this.cartRepo.setItemQuantity(
            cart.id,
            itemId,
            quantity
        );

        return {
            message:
                quantity === 0
                    ? "Item dihapus dari keranjang"
                    : "Jumlah item berhasil diperbarui",
            item: {
                id: updatedItem?.id,
                productId: updatedItem?.productId,
                quantity: updatedItem?.quantity,
            },
        };
    }

    /**
     * Kosongkan seluruh isi keranjang
     */
    async clearCart(userId: string) {
        const cart = await this.cartRepo.getOrCreateCart(userId);
        if (cart.items.length === 0)
            throw new ValidationError("Keranjang sudah kosong");

        await this.cartRepo.clear(cart.id);
        return { message: "Keranjang berhasil dikosongkan" };
    }

    /**
     * Hapus satu item dari keranjang
     */
    async removeItem(userId: string, itemId: string) {
        const cart = await this.cartRepo.getOrCreateCart(userId);
        const item = cart.items.find((i) => i.id === itemId);
        if (!item) throw new NotFoundError("Item tidak ditemukan");

        await this.cartRepo.setItemQuantity(cart.id, itemId, 0);
        return { message: "Item berhasil dihapus dari keranjang" };
    }
}
