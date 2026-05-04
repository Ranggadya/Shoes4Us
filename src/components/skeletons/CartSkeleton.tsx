import Skeleton from "react-loading-skeleton";

export default function CartSkeleton() {
  return (
    <div className="bg-white p-4">
      <div className="flex justify-between items-center mb-6">
        <Skeleton width={200} height={32} />
        <Skeleton width={150} height={36} />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center border-b pb-4">
            {/* Image */}
            <Skeleton width={80} height={80} className="mr-4" />
            
            <div className="flex-grow">
              {/* Product name */}
              <Skeleton width={200} height={20} className="mb-2" />
              {/* Price */}
              <Skeleton width={120} height={24} />
            </div>
            
            {/* Quantity controls */}
            <div className="flex items-center gap-2">
              <Skeleton width={32} height={32} />
              <Skeleton width={40} height={32} />
              <Skeleton width={32} height={32} />
            </div>
            
            {/* Remove button */}
            <Skeleton width={80} height={32} className="ml-4" />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between mb-2">
          <Skeleton width={100} />
          <Skeleton width={120} />
        </div>
        <div className="flex justify-between mb-4">
          <Skeleton width={100} />
          <Skeleton width={80} />
        </div>
        <Skeleton width="100%" height={48} />
      </div>
    </div>
  );
}
