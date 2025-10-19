import Skeleton from "react-loading-skeleton";

export default function OrderTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3 text-left"><Skeleton width={30} /></th>
            <th className="border p-3 text-left"><Skeleton width={80} /></th>
            <th className="border p-3 text-left"><Skeleton width={120} /></th>
            <th className="border p-3 text-left"><Skeleton width={100} /></th>
            <th className="border p-3 text-left"><Skeleton width={80} /></th>
            <th className="border p-3 text-left"><Skeleton width={100} /></th>
            <th className="border p-3 text-left"><Skeleton width={80} /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border p-3"><Skeleton width={30} /></td>
              <td className="border p-3"><Skeleton width={60} /></td>
              <td className="border p-3"><Skeleton width={150} /></td>
              <td className="border p-3"><Skeleton width={100} height={24} /></td>
              <td className="border p-3"><Skeleton width={80} /></td>
              <td className="border p-3"><Skeleton count={2} /></td>
              <td className="border p-3"><Skeleton width={100} height={32} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
