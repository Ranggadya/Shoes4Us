import ProductDetailClient from "./ProductDetailClient";
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  return <ProductDetailClient productId={productId} />;
}
