import ProductDetailClient from "./ProductDetailClient";

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const productId = Number(params.id);
  return <ProductDetailClient productId={productId} />;
}
