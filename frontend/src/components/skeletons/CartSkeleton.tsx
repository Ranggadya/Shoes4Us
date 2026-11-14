export default function CartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat keranjang belanja"
      className="animate-pulse space-y-6"
    >
      <span className="sr-only">Memuat keranjang belanja...</span>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-neutral-200 divide-y divide-neutral-200">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-200 shrink-0" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-5 bg-neutral-200 w-3/4" />
                  <div className="h-4 bg-neutral-200 w-1/2" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 bg-neutral-200 w-24" />
                <div className="h-11 bg-neutral-200 w-28" />
                <div className="h-11 bg-neutral-200 w-16" />
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="border border-neutral-200 bg-neutral-50 p-5 sm:p-6 space-y-4">
            <div className="h-6 bg-neutral-200 w-44" />
            <div className="space-y-2.5">
              <div className="h-4 bg-neutral-200 w-full" />
              <div className="h-4 bg-neutral-200 w-full" />
            </div>
            <div className="h-28 bg-neutral-200 w-full" />
            <div className="h-6 bg-neutral-200 w-full" />
            <div className="h-11 bg-neutral-300 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
