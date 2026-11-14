import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CouponInput from "../CouponInput";
import { api } from "@/services/api";
import toast from "react-hot-toast";

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
      discountAmount: 150000,
      minOrderAmount: 100000,
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
    expect(toast.error).not.toHaveBeenCalled();
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
          discountAmount: 50000,
          minOrderAmount: 200000,
        }}
        onApply={onApply}
      />
    );

    expect(screen.getByText("HEMAT50RB")).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: /Hapus voucher/i });
    expect(removeBtn.className).toContain("min-h-[44px]");
    expect(removeBtn.className).toContain("min-w-[44px]");
    await userEvent.click(removeBtn);

    expect(onApply).toHaveBeenCalledWith(null);
  });

  it("clarifies FREE_SHIPPING benefit text when shippingFee is 0 and ensures 44px quick-voucher targets", () => {
    render(
      <CouponInput
        subtotal={200000}
        appliedCoupon={{
          code: "GRATISONGKIR",
          description: "Gratis Ongkir hingga Rp 25.000",
          discountType: "FREE_SHIPPING",
          discountAmount: 25000,
          minOrderAmount: 150000,
        }}
        onApply={vi.fn()}
      />
    );

    expect(screen.getByText(/dihitung di checkout/i)).toBeInTheDocument();

    const { container } = render(
      <CouponInput subtotal={200000} appliedCoupon={null} onApply={vi.fn()} />
    );
    const chipButtons = Array.from(container.querySelectorAll("button")).filter(
      (btn) => btn.textContent !== "Pakai"
    );
    expect(chipButtons.length).toBeGreaterThanOrEqual(3);
    for (const chip of chipButtons) {
      expect(chip.className).toContain("min-h-[44px]");
    }
  });

  it("supports progressive disclosure via collapsible prop and disables vouchers below minimum spend", async () => {
    render(
      <CouponInput
        subtotal={120000}
        appliedCoupon={null}
        onApply={vi.fn()}
        collapsible
      />
    );

    const toggle = screen.getByRole("button", {
      name: /Punya kode voucher\? \(3 tersedia\)/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByPlaceholderText(/Masukkan kode/i)).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByPlaceholderText(/Masukkan kode/i)).toBeInTheDocument();

    // At Rp 120.000, DISKON10 (min Rp 100rb) is enabled; HEMAT50RB (min Rp 300rb) and GRATISONGKIR (min Rp 150rb) are disabled
    expect(screen.getByRole("button", { name: /DISKON10/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /HEMAT50RB/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /GRATISONGKIR/i })).toBeDisabled();
  });

  it("clears stale code input when appliedCoupon transitions from truthy to null", async () => {
    const applied = {
      code: "DISKON10",
      description: "Diskon 10%",
      discountType: "PERCENTAGE" as const,
      discountAmount: 20000,
      minOrderAmount: 100000,
    };

    const { rerender } = render(
      <CouponInput subtotal={200000} appliedCoupon={applied} onApply={vi.fn()} />
    );

    expect(screen.getByText("DISKON10")).toBeInTheDocument();

    rerender(
      <CouponInput subtotal={50000} appliedCoupon={null} onApply={vi.fn()} />
    );

    const input = screen.getByPlaceholderText(/Masukkan kode/i);
    expect(input).toHaveValue("");
  });
});

