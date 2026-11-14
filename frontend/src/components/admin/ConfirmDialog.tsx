import { useId, useRef } from "react";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  tone = "danger",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useDialogFocusTrap({
    isOpen,
    onClose: onCancel,
    containerRef: dialogRef,
    initialFocusRef: cancelBtnRef,
    canClose: !isPending,
  });

  if (!isOpen) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-rose-700 hover:bg-rose-800 text-white"
      : "bg-gray-950 hover:bg-gray-800 text-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
      onClick={() => {
        if (!isPending) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-bold tracking-tight text-gray-950"
        >
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm text-gray-600 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => void onConfirm()}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${confirmClasses}`}
          >
            {isPending ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
