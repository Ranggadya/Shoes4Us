import Skeleton from "react-loading-skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {/* Image skeleton */}
      <Skeleton height={200} className="mb-4" />
      
      {/* Category skeleton */}
      <Skeleton width={80} height={20} className="mb-2" />
      
      {/* Title skeleton */}
      <Skeleton height={24} className="mb-2" />
      
      {/* Price skeleton */}
      <Skeleton width={120} height={28} className="mb-3" />
      
      {/* Button skeleton */}
      <Skeleton height={40} />
    </div>
  );
}
