import { AlertCircle, X } from "lucide-react";

type CartSyncWarningsBannerProps = {
  warnings: string[];
  onDismiss: () => void;
};

/**
 * Dismissible alert banner surfacing guest-to-backend cart sync failures
 * (e.g., insufficient stock or unavailable items after login).
 */
export default function CartSyncWarningsBanner({
  warnings,
  onDismiss,
}: CartSyncWarningsBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div
      role="alert"
      className="border border-amber-700 bg-amber-50 p-4 mb-6 flex items-start justify-between gap-3 text-amber-950"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertCircle
          className="w-5 h-5 text-amber-800 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="text-sm space-y-1">
          <p className="font-bold">
            Sebagian item keranjang tamu tidak dapat disinkronkan:
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-xs sm:text-sm">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup peringatan sinkronisasi"
        className="min-w-[44px] min-h-[44px] -my-1.5 -mr-1.5 inline-flex items-center justify-center text-amber-900 hover:text-black shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
