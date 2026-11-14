import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import FlashSaleBanner, {
  calculateCountdown,
  FLASH_BANNER_DISMISS_KEY,
} from "../FlashSaleBanner";
import { buildWhatsAppSupportUrl } from "../WhatsAppSupportButton";

function renderBanner(targetTimeMs = Date.now() + 3600_000) {
  return render(
    <MemoryRouter>
      <FlashSaleBanner targetTimeMs={targetTimeMs} />
    </MemoryRouter>
  );
}

describe("FlashSaleBanner & WhatsAppSupportButton", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("calculates hours, minutes, and seconds accurately", () => {
    const now = 1000000;
    const target = now + (2 * 3600 + 15 * 60 + 42) * 1000;
    expect(calculateCountdown(target, now)).toEqual({
      hours: "02",
      minutes: "15",
      seconds: "42",
      expired: false,
    });
  });

  it("returns expired state when target time is in the past", () => {
    expect(calculateCountdown(500, 1000)).toEqual({
      hours: "00",
      minutes: "00",
      seconds: "00",
      expired: true,
    });
  });

  it("renders the flash drop link and cleans up interval timer on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderBanner();

    expect(
      screen.getByRole("link", { name: /Flash Drop/i })
    ).toHaveAttribute("href", "/product?sale=true");
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("stops interval timer automatically when countdown expires", () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    renderBanner(Date.now() + 1000);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("exposes a screen-reader friendly countdown label in words", () => {
    const now = Date.now();
    renderBanner(now + (1 * 3600 + 5 * 60 + 9) * 1000 + 500);

    const timer = screen.getByRole("timer");
    expect(timer).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/1 jam 5 menit \d+ detik/)
    );
  });

  it("copies the coupon code to clipboard and confirms inline", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    renderBanner();

    await user.click(
      screen.getByRole("button", { name: /Salin kode voucher DISKON10/i })
    );

    expect(writeText).toHaveBeenCalledWith("DISKON10");
    expect(await screen.findByText(/Tersalin/i)).toBeInTheDocument();
  });

  it("hides the banner on dismiss and remembers it for the session", async () => {
    const user = userEvent.setup();
    const { unmount } = renderBanner();

    await user.click(screen.getByRole("button", { name: /Tutup promo/i }));

    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(FLASH_BANNER_DISMISS_KEY)).toBe("1");

    unmount();
    renderBanner();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("builds WhatsApp concierge URL with encoded greeting message", () => {
    const url = buildWhatsAppSupportUrl("Nike Dunk Low");
    expect(url).toContain("https://wa.me/");
    expect(url).toContain(encodeURIComponent("Nike Dunk Low"));
  });
});
