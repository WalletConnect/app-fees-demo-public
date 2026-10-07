import { describe, expect, it } from "vitest";
import { feeWei, formatEther, parseEther, toHex } from "./wei";

describe("parseEther", () => {
  it("parses decimal ETH into wei", () => {
    expect(parseEther("0.001")).toBe(1_000_000_000_000_000n);
    expect(parseEther("1")).toBe(10n ** 18n);
    expect(parseEther("1.5")).toBe(15n * 10n ** 17n);
    expect(parseEther(".5")).toBe(5n * 10n ** 17n);
    expect(parseEther("0.000000000000000001")).toBe(1n);
  });

  it("rejects invalid input", () => {
    expect(parseEther("")).toBeNull();
    expect(parseEther(".")).toBeNull();
    expect(parseEther("abc")).toBeNull();
    expect(parseEther("-1")).toBeNull();
    expect(parseEther("1.2.3")).toBeNull();
    expect(parseEther("0.0000000000000000001")).toBeNull();
  });
});

describe("formatEther", () => {
  it("formats wei without trailing zeros", () => {
    expect(formatEther(0n)).toBe("0");
    expect(formatEther(5_000_000_000_000n)).toBe("0.000005");
    expect(formatEther(15n * 10n ** 17n)).toBe("1.5");
  });

  it("round-trips with parseEther", () => {
    for (const value of ["0.001", "1.5", "123.000000000000000001"]) {
      expect(formatEther(parseEther(value)!)).toBe(value);
    }
  });
});

describe("feeWei", () => {
  it("applies basis points to the amount", () => {
    // 0.001 ETH at 50 bps (0.5%) = 0.000005 ETH
    expect(feeWei(parseEther("0.001")!, 50)).toBe(5_000_000_000_000n);
    expect(feeWei(parseEther("1")!, 10_000)).toBe(10n ** 18n);
    expect(feeWei(parseEther("1")!, 0)).toBe(0n);
  });

  it("rounds down to whole wei", () => {
    expect(feeWei(199n, 50)).toBe(0n);
    expect(feeWei(201n, 50)).toBe(1n);
  });

  it("rejects invalid bps", () => {
    expect(() => feeWei(1n, -1)).toThrow();
    expect(() => feeWei(1n, 1.5)).toThrow();
  });
});

describe("toHex", () => {
  it("encodes wei as a JSON-RPC quantity", () => {
    expect(toHex(0n)).toBe("0x0");
    expect(toHex(5_000_000_000_000n)).toBe("0x48c27395000");
  });
});
