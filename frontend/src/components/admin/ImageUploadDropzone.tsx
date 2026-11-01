import React, { useState, useRef } from "react";
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
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Foto Produk <span className="text-xs text-gray-500">(Cloudflare R2 / URL)</span>
        </label>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              mode === "upload"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              mode === "url"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Input URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div>
          <input
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
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
              if (!disabled && !uploading) fileInputRef.current?.click();
            }}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50/50"
                : "border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50"
            } ${disabled || uploading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {uploading ? (
              <div className="py-4 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-medium text-gray-700">Mengunggah gambar ke cloud...</p>
                <p className="text-xs text-gray-500">Mohon tunggu beberapa saat</p>
              </div>
            ) : (
              <div className="py-2 flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-1">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-semibold text-blue-600 hover:text-blue-700">
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
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="url"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setPreviewError(false);
            }}
            placeholder="https://example.com/sepatu.jpg atau /sepatu1.jpeg"
            disabled={disabled}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      )}

      {/* Image Preview Card */}
      {value && (
        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {!previewError ? (
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
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
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title="Hapus gambar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
