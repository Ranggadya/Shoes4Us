export default function CartSkeleton() {
  return (
    <div className="bg-white p-4 space-y-4 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-9 bg-gray-200 rounded w-36" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center border-b pb-4 gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-1/2" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="w-24 h-8 bg-gray-200 rounded" />
            <div className="w-20 h-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
