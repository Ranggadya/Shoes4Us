import { describe, it, expect } from "vitest";
import { convertFootLengthToSize } from "../size-converter";

describe("convertFootLengthToSize", () => {
  it("converts 26.0 cm foot length to EU 41 / US Men 8 / US Women 9.5 / UK 7.5", () => {
    expect(convertFootLengthToSize(26.0)).toEqual({
      eu: 41,
      usMen: 8,
      usWomen: 9.5,
      uk: 7.5,
    });
  });

  it("handles fractional centimeters by rounding up to the nearest comfortable size", () => {
    const result = convertFootLengthToSize(25.3);
    expect(result.eu).toBe(40);
  });

  it("clamps extreme bounds (< 20cm and > 32cm) safely without throwing", () => {
    expect(convertFootLengthToSize(15.0).eu).toBe(36);
    expect(convertFootLengthToSize(35.0).eu).toBe(46);
  });

  it("steps up one EU size when WIDE foot fit is selected", () => {
    expect(convertFootLengthToSize(26.0, "WIDE").eu).toBe(42);
  });
});
