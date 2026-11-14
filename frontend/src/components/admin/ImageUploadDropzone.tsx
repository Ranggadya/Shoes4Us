import React, { useId, useState, useRef } from "react";
import { UploadCloud, Link as LinkIcon, X, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { uploadImage } from "@/services/api";

interface ImageUploadDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const fileInputId = useId();
  const urlInputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (disabled || uploading) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar (JPG, PNG, WebP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file gambar maksimal 5MB");
      return;
    }

    try {
      setUploading(true);
      const res = await uploadImage(file);
      onChange(res.url);
      setPreviewError(false);
      toast.success("Gambar berhasil diunggah ke cloud!");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal mengunggah gambar";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="w-full space-y-3">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={mode === "upload" ? fileInputId : urlInputId}
          className="block text-sm font-medium text-gray-800"
        >
          Foto Produk{" "}
          <span className="text-xs text-gray-500">(Cloudflare R2 / URL)</span>
        </label>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`min-h-[36px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              mode === "upload"
                ? "bg-white text-gray-950 font-semibold shadow-sm"
                : "text-gray-600 hover:text-gray-950"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`min-h-[36px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              mode === "url"
                ? "bg-white text-gray-950 font-semibold shadow-sm"
                : "text-gray-600 hover:text-gray-950"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Input URL</span>
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            id={fileInputId}
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={disabled || uploading}
          />

          <div
            role="button"
            tabIndex={disabled || uploading ? -1 : 0}
            aria-label="Unggah gambar produk"
            aria-disabled={disabled || uploading}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
              if (!disabled && !uploading) fileInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (disabled || uploading) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${
              isDragging
                ? "border-gray-900 bg-gray-100/70"
                : "border-gray-300 hover:border-gray-500 bg-gray-50/50 hover:bg-gray-50"
            } ${disabled || uploading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {uploading ? (
              <div className="py-4 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-gray-900 animate-spin" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-700">
                  Mengunggah gambar ke cloud...
                </p>
                <p className="text-xs text-gray-500">Mohon tunggu beberapa saat</p>
              </div>
            ) : (
              <div className="py-2 flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 mb-1">
                  <UploadCloud className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-semibold text-gray-950 underline underline-offset-2">
                    Klik untuk memilih file
                  </span>{" "}
                  <span className="text-gray-600">atau drag and drop ke sini</span>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP, GIF hingga 5MB (otomatis disimpan di Cloudflare CDN)
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="relative">
            <LinkIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              aria-hidden="true"
            />
            <input
              id={urlInputId}
              type="text"
              inputMode="url"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setPreviewError(false);
              }}
              placeholder="https://example.com/sepatu.jpg atau /sepatu1.jpeg"
              disabled={disabled}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          <p className="text-xs text-gray-500">
            Mendukung URL penuh (https://...) atau path aset lokal (/sepatu1.jpeg).
          </p>
        </div>
      )}

      {/* Image Preview Card */}
      {value && (
        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {!previewError ? (
              <img
                src={value}
                alt="Preview produk"
                className="w-full h-full object-contain"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-500" aria-hidden="true" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Gambar Siap Digunakan</span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5" title={value}>
              {value}
            </p>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setPreviewError(false);
              }}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-gray-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700"
              aria-label="Hapus gambar"
              title="Hapus gambar"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
