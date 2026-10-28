export default function ProductCardSkeleton() {
  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm animate-pulse space-y-4">
      <div className="w-full h-56 bg-gray-200 rounded-xl" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-5 bg-gray-200 rounded w-1/2" />
      <div className="h-10 bg-gray-200 rounded-lg w-full" />
    </div>
  );
}
