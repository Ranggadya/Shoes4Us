import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FlashSaleBanner, { calculateCountdown } from "../FlashSaleBanner";
import { buildWhatsAppSupportUrl } from "../WhatsAppSupportButton";

describe("FlashSaleBanner & WhatsAppSupportButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it("renders banner and cleans up interval timer on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = render(
      <MemoryRouter>
        <FlashSaleBanner targetTimeMs={Date.now() + 3600_000} />
      </MemoryRouter>
    );

    expect(screen.getByText(/LIMITED SNEAKER DROP/i)).toBeInTheDocument();
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("builds WhatsApp concierge URL with encoded greeting message", () => {
    const url = buildWhatsAppSupportUrl("Nike Dunk Low");
    expect(url).toContain("https://wa.me/");
    expect(url).toContain(encodeURIComponent("Nike Dunk Low"));
  });
});
