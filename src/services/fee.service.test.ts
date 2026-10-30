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
const ARBITRUM = 42161;
const BASE = 8453;
const directFee: WalletFee = { feeBps: 30, recipients: [{ chainId: "eip155:10", address: "0xWallet" }] };

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

  it("uses the direct fee on a chain with a recipient", async () => {
    await expect(getIntegratorAddress(directFee, OPTIMISM)).resolves.toEqual({
      kind: "direct",
      to: "0xWallet",
      feeBps: 30,
    });
    expect(getIntegratorByReferrer).not.toHaveBeenCalled();
  });

  it("returns no direct fee on a chain without a recipient", async () => {
    await expect(getIntegratorAddress(directFee, BASE)).resolves.toEqual({ kind: "none" });
  });

  it("returns no fee when the wallet sends nothing", async () => {
    await expect(getIntegratorAddress(undefined, OPTIMISM)).resolves.toEqual({ kind: "none" });
  });

  it("returns no fee for an unknown code without feeBps/recipients", async () => {
    await expect(
      getIntegratorAddress({ referralCode: "unknown", recipients: [] }, OPTIMISM),
    ).resolves.toEqual({ kind: "none" });
  });

  it("returns no fee when recipients are set without feeBps", async () => {
    await expect(getIntegratorAddress({ ...directFee, feeBps: undefined }, OPTIMISM)).resolves.toEqual({
      kind: "none",
    });
  });

  it("applies the wallet's referral code on any chain", async () => {
    const referralOnly: WalletFee = { referralCode: "known", recipients: [] };
    for (const chainId of [OPTIMISM, ARBITRUM, BASE]) {
      await expect(getIntegratorAddress(referralOnly, chainId)).resolves.toEqual({
        kind: "referral",
        code: "known",
        to: "0xIntegrator",
        feeBps: 50,
      });
    }
    await expect(getIntegratorAddress({ ...directFee, referralCode: "known" }, BASE)).resolves.toMatchObject({
      kind: "referral",
    });
  });

  it("picks the recipient for the current chain from a multi-chain config", async () => {
    const multiChain: WalletFee = {
      feeBps: 25,
      recipients: [
        { chainId: "eip155:10", address: "0xOptimism" },
        { chainId: "eip155:42161", address: "0xArbitrum" },
      ],
    };
    await expect(getIntegratorAddress(multiChain, OPTIMISM)).resolves.toEqual({
      kind: "direct",
      to: "0xOptimism",
      feeBps: 25,
    });
    await expect(getIntegratorAddress(multiChain, ARBITRUM)).resolves.toEqual({
      kind: "direct",
      to: "0xArbitrum",
      feeBps: 25,
    });
    await expect(getIntegratorAddress(multiChain, BASE)).resolves.toEqual({ kind: "none" });
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
