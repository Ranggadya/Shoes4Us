import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { ImageUploadDropzone } from "../ImageUploadDropzone";
import { uploadImage } from "@/services/api";

vi.mock("@/services/api", () => ({
  uploadImage: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("ImageUploadDropzone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-image files and files larger than 5MB", () => {
    const onChange = vi.fn();
    render(<ImageUploadDropzone value="" onChange={onChange} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const textFile = new File(["hello"], "note.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [textFile] } });
    expect(toast.error).toHaveBeenCalledWith(
      "Format file harus berupa gambar (JPG, PNG, WebP, GIF)"
    );
    expect(uploadImage).not.toHaveBeenCalled();

    const hugeFile = new File(["x"], "huge.png", { type: "image/png" });
    Object.defineProperty(hugeFile, "size", { value: 6 * 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [hugeFile] } });
    expect(toast.error).toHaveBeenCalledWith("Ukuran file gambar maksimal 5MB");
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("uploads valid image file via keyboard Enter/click and reports uploaded URL", async () => {
    vi.mocked(uploadImage).mockResolvedValue({
      url: "https://cdn.example.com/shoe.webp",
      filename: "shoe.webp",
      size: 1024,
    });
    const onChange = vi.fn();

    render(<ImageUploadDropzone value="" onChange={onChange} />);

    const dropzone = screen.getByRole("button", { name: /Unggah gambar produk/i });
    dropzone.focus();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    await userEvent.keyboard("{Enter}");
    expect(clickSpy).toHaveBeenCalled();

    const imageFile = new File(["img"], "shoe.webp", { type: "image/webp" });
    fireEvent.change(fileInput, { target: { files: [imageFile] } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("https://cdn.example.com/shoe.webp");
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("accepts relative asset URL paths in Input URL mode and provides accessible remove label", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ImageUploadDropzone value="" onChange={onChange} />
    );

    await userEvent.click(screen.getByRole("button", { name: /Input URL/i }));
    const urlInput = screen.getByPlaceholderText(/https:\/\/example\.com\/sepatu\.jpg/i);
    expect(urlInput).toHaveAttribute("type", "text");

    await userEvent.type(urlInput, "/sepatu1.jpeg");
    expect(onChange).toHaveBeenCalled();

    rerender(<ImageUploadDropzone value="/sepatu1.jpeg" onChange={onChange} />);
    const removeBtn = screen.getByRole("button", { name: /Hapus gambar/i });
    await userEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith("");
  });
});
