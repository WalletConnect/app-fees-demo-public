/** Mock token and fixed rate for the "You receive" side. Nothing is actually swapped. */
export const MOCK_TOKEN = { symbol: "DEMO", decimals: 18 };

/** DEMO per ETH. */
export const MOCK_RATE = 2_500n;

/** Amount of DEMO (in its smallest unit) for an ETH amount in wei. */
export function quote(amountWei: bigint): bigint {
  return amountWei * MOCK_RATE;
}
