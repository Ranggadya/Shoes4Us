import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CouponInput from "../CouponInput";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CouponInput component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("applies valid coupon code and calls onApply with discount result", async () => {
    const onApply = vi.fn();
    const mockResult = {
      code: "DISKON10",
      description: "Diskon 10% semua produk",
      discountType: "PERCENTAGE" as const,
      discountValue: 10,
      discountAmount: 150000,
      finalTotal: 1350000,
    };
    vi.mocked(api.post).mockResolvedValueOnce({
      success: true,
      data: mockResult,
    });

    render(
      <CouponInput
        subtotal={1500000}
        shippingFee={20000}
        appliedCoupon={null}
        onApply={onApply}
      />
    );

    const input = screen.getByPlaceholderText(/Masukkan kode/i);
    await userEvent.type(input, "diskon10");
    expect(input).toHaveValue("DISKON10");

    const applyBtn = screen.getByRole("button", { name: /Pakai/i });
    await userEvent.click(applyBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/coupons/validate", {
        code: "DISKON10",
        subtotal: 1500000,
        shippingFee: 20000,
      });
      expect(onApply).toHaveBeenCalledWith(mockResult);
    });
  });

  it("shows error message when coupon validation fails", async () => {
    const onApply = vi.fn();
    vi.mocked(api.post).mockRejectedValueOnce(
      new Error("Kode voucher kadaluarsa")
    );

    render(
      <CouponInput
        subtotal={500000}
        appliedCoupon={null}
        onApply={onApply}
      />
    );

    const input = screen.getByPlaceholderText(/Masukkan kode/i);
    await userEvent.type(input, "EXPIRED");
    await userEvent.click(screen.getByRole("button", { name: /Pakai/i }));

    expect(
      await screen.findByText("Kode voucher kadaluarsa")
    ).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("renders applied coupon badge and allows removing it", async () => {
    const onApply = vi.fn();
    render(
      <CouponInput
        subtotal={1000000}
        appliedCoupon={{
          code: "HEMAT50RB",
          description: "Potongan Rp 50.000",
          discountType: "FIXED",
          discountValue: 50000,
          discountAmount: 50000,
          finalTotal: 950000,
        }}
        onApply={onApply}
      />
    );

    expect(screen.getByText("HEMAT50RB")).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: /Hapus voucher/i });
    await userEvent.click(removeBtn);

    expect(onApply).toHaveBeenCalledWith(null);
  });
});
