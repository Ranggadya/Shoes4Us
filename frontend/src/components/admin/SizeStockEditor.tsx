import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { formatSizeLabel } from "@/constants/product";
import type { ProductSegment, ProductSizeStock } from "@/types";

interface SizeStockEditorProps {
  segment: ProductSegment | string;
  sizeStocks: ProductSizeStock[];
  onChange: (nextSizes: ProductSizeStock[]) => void;
  disabled?: boolean;
}

export default function SizeStockEditor({
  segment,
  sizeStocks,
  onChange,
  disabled = false,
}: SizeStockEditorProps) {
  const [customSizeInput, setCustomSizeInput] = useState("");
  const customSizeInputId = useId();
  const baseId = useId();

  const totalSizeStock = sizeStocks.reduce(
    (sum, item) => sum + Math.max(0, Number(item.stock) || 0),
    0
  );

  const handleStockInput = (targetSize: string, rawValue: string) => {
    const parsed = Math.max(0, parseInt(rawValue, 10) || 0);
    const nextSizes = sizeStocks.map((item) =>
      item.size === targetSize ? { ...item, stock: parsed } : item
    );
    onChange(nextSizes);
  };

  const handleAddCustomSize = () => {
    const cleaned = customSizeInput.trim();
    if (!cleaned || disabled) return;
    if (sizeStocks.some((entry) => entry.size.toLowerCase() === cleaned.toLowerCase())) {
      setCustomSizeInput("");
      return;
    }
    onChange([...sizeStocks, { size: cleaned, stock: 0 }]);
    setCustomSizeInput("");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-gray-200 p-3 bg-gray-50/40">
        {sizeStocks.map((item, idx) => {
          const inputId = `${baseId}-size-${idx}`;
          return (
            <div key={item.size}>
              <label
                htmlFor={inputId}
                className="block text-xs font-semibold text-gray-600 mb-1"
              >
                {formatSizeLabel(item.size, segment)}
              </label>
              <input
                id={inputId}
                type="number"
                min="0"
                value={item.stock}
                onChange={(e) => handleStockInput(item.size, e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold tabular-nums focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-xs text-gray-600 font-medium tabular-nums">
          Total stok per ukuran:{" "}
          <span className="font-bold text-gray-950">{totalSizeStock}</span> unit
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor={customSizeInputId} className="sr-only">
            Tambah ukuran kustom
          </label>
          <input
            id={customSizeInputId}
            type="text"
            value={customSizeInput}
            onChange={(e) => setCustomSizeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomSize();
              }
            }}
            placeholder="Ukuran lain (mis. 42.5 / XS)"
            disabled={disabled}
            className="px-3 py-1.5 min-h-[38px] text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            type="button"
            onClick={handleAddCustomSize}
            disabled={disabled || !customSizeInput.trim()}
            className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tambah Ukuran</span>
          </button>
        </div>
      </div>
    </div>
  );
}
