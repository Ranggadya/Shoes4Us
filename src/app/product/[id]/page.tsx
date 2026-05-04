import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const productId = resolvedParams.id; // String instead of Number since Prisma schema uses UUID
  return <ProductDetailClient productId={productId} />;
}
