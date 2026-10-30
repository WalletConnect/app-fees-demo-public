import type { WalletFee } from "@walletconnect/ethereum-provider";
import { getIntegratorByReferrer, type Integrator } from "../mocks/referral-api";
import { feeWei } from "../lib/wei";

export type FeeResolution =
  /** The wallet's referral code resolved through the app's partner program. */
  | { kind: "referral"; code: string; to: string; feeBps: number }
  /** The wallet asked for a fee paid straight to its recipient. */
  | { kind: "direct"; to: string; feeBps: number }
  | { kind: "none" };

const URL_REFERRER_KEY = "fee:referrer";
const REFERRAL_CACHE_PREFIX = "fee:referral:";

/** Reads `?referrer=<code>` into sessionStorage, like a normal referral link. Returns the stored code. */
export function readReferrerFromUrl(search: string = window.location.search): string | undefined {
  const referrer = new URLSearchParams(search).get("referrer")?.trim();
  if (referrer) sessionStorage.setItem(URL_REFERRER_KEY, referrer);
  return getUrlReferrer();
}

export function getUrlReferrer(): string | undefined {
  return sessionStorage.getItem(URL_REFERRER_KEY) ?? undefined;
}

/** Resolves a referral code through the (mock) referral API, cached per session. */
export async function resolveReferral(code: string): Promise<Integrator | null> {
  const cacheKey = REFERRAL_CACHE_PREFIX + code;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached !== null) return JSON.parse(cached) as Integrator | null;

  const integrator = await getIntegratorByReferrer(code);
  sessionStorage.setItem(cacheKey, JSON.stringify(integrator));
  return integrator;
}

/** The wallet's fee recipient on `chainId`, from its whole fee config. */
function getRecipient(walletFee: WalletFee | undefined, chainId: number): string | undefined {
  return walletFee?.recipients.find((recipient) => recipient.chainId === `eip155:${chainId}`)?.address;
}

/**
 * Decides who gets the fee on the current chain:
 * 1. referral code (from the wallet, else from `?referrer=`) that the partner program knows → integrator, on any chain
 * 2. feeBps + the wallet's recipient for this chain → direct fee
 * 3. otherwise no fee
 */
export async function getIntegratorAddress(
  walletFee: WalletFee | undefined,
  chainId: number,
): Promise<FeeResolution> {
  const code = walletFee?.referralCode || getUrlReferrer();
  if (code) {
    const integrator = await resolveReferral(code);
    if (integrator) {
      return { kind: "referral", code, to: integrator.integratorAddress, feeBps: integrator.feeBps };
    }
  }

  const recipient = getRecipient(walletFee, chainId);
  if (walletFee?.feeBps && recipient) {
    return { kind: "direct", to: recipient, feeBps: walletFee.feeBps };
  }

  return { kind: "none" };
}

/** Fee amount in wei for a swap of `amountWei`. */
export function getFeeAmount(resolution: FeeResolution, amountWei: bigint): bigint {
  return resolution.kind === "none" ? 0n : feeWei(amountWei, resolution.feeBps);
}
