import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WalletFee } from "@walletconnect/ethereum-provider";
import { getFeeAmount, getIntegratorAddress, readReferrerFromUrl, resolveReferral } from "./fee.service";
import { getIntegratorByReferrer } from "../mocks/referral-api";
import { parseEther } from "../lib/wei";

vi.mock("../mocks/referral-api", () => ({
  getIntegratorByReferrer: vi.fn(async (code: string) =>
    code === "known" ? { integratorAddress: "0xIntegrator", feeBps: 50 } : null,
  ),
}));

const OPTIMISM = 10;
const directFee: WalletFee = { chainId: "eip155:10", feeBps: 30, recipient: "0xWallet" };

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(getIntegratorByReferrer).mockClear();
});

describe("getIntegratorAddress", () => {
  it("prefers a known referral code over a direct fee", async () => {
    const resolution = await getIntegratorAddress({ ...directFee, referralCode: "known" }, OPTIMISM);
    expect(resolution).toEqual({ kind: "referral", code: "known", to: "0xIntegrator", feeBps: 50 });
  });

  it("falls back to the direct fee when the referral code is unknown", async () => {
    const resolution = await getIntegratorAddress({ ...directFee, referralCode: "unknown" }, OPTIMISM);
    expect(resolution).toEqual({ kind: "direct", to: "0xWallet", feeBps: 30 });
  });

  it("uses the direct fee when there is no referral code", async () => {
    await expect(getIntegratorAddress(directFee, OPTIMISM)).resolves.toEqual({
      kind: "direct",
      to: "0xWallet",
      feeBps: 30,
    });
    expect(getIntegratorByReferrer).not.toHaveBeenCalled();
  });

  it("returns no fee when the wallet sends nothing", async () => {
    await expect(getIntegratorAddress(undefined, OPTIMISM)).resolves.toEqual({ kind: "none" });
  });

  it("returns no fee for an unknown code without feeBps/recipient", async () => {
    await expect(
      getIntegratorAddress({ chainId: "eip155:10", referralCode: "unknown" }, OPTIMISM),
    ).resolves.toEqual({ kind: "none" });
  });

  it("returns no fee when only one of feeBps/recipient is set", async () => {
    await expect(getIntegratorAddress({ chainId: "eip155:10", feeBps: 30 }, OPTIMISM)).resolves.toEqual({
      kind: "none",
    });
  });

  it("ignores a fee for another chain", async () => {
    await expect(getIntegratorAddress(directFee, 8453)).resolves.toEqual({ kind: "none" });
  });

  describe("?referrer= URL param", () => {
    it("is used when the wallet sends no referral code", async () => {
      readReferrerFromUrl("?referrer=known");
      await expect(getIntegratorAddress(directFee, OPTIMISM)).resolves.toMatchObject({
        kind: "referral",
        code: "known",
      });
      await expect(getIntegratorAddress(undefined, OPTIMISM)).resolves.toMatchObject({
        kind: "referral",
        code: "known",
      });
    });

    it("is ignored when the wallet sends its own referral code", async () => {
      readReferrerFromUrl("?referrer=known");
      const resolution = await getIntegratorAddress({ ...directFee, referralCode: "unknown" }, OPTIMISM);
      expect(resolution).toEqual({ kind: "direct", to: "0xWallet", feeBps: 30 });
      expect(getIntegratorByReferrer).toHaveBeenCalledWith("unknown");
      expect(getIntegratorByReferrer).not.toHaveBeenCalledWith("known");
    });

    it("persists in sessionStorage across reads", () => {
      readReferrerFromUrl("?referrer=known");
      expect(readReferrerFromUrl("")).toBe("known");
    });
  });
});

describe("resolveReferral", () => {
  it("caches resolved and unknown codes in sessionStorage", async () => {
    await resolveReferral("known");
    await resolveReferral("known");
    await resolveReferral("unknown");
    await expect(resolveReferral("unknown")).resolves.toBeNull();
    expect(getIntegratorByReferrer).toHaveBeenCalledTimes(2);
  });
});

describe("getFeeAmount", () => {
  it("computes the fee in wei for the resolved mechanism", () => {
    const amount = parseEther("0.001")!;
    expect(getFeeAmount({ kind: "direct", to: "0x", feeBps: 50 }, amount)).toBe(5_000_000_000_000n);
    expect(getFeeAmount({ kind: "referral", code: "c", to: "0x", feeBps: 100 }, amount)).toBe(
      10_000_000_000_000n,
    );
    expect(getFeeAmount({ kind: "none" }, amount)).toBe(0n);
  });
});
