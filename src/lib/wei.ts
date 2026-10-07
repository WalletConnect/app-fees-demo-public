const WEI_PER_ETH = 10n ** 18n;

/** Parses a decimal ETH string ("0.001") into wei. Returns null for invalid input. */
export function parseEther(value: string): bigint | null {
  const trimmed = value.trim();
  const match = /^(\d*)(?:\.(\d*))?$/.exec(trimmed);
  if (!match || trimmed === "" || trimmed === ".") return null;
  const [, whole = "", fraction = ""] = match;
  if (fraction.length > 18) return null;
  return BigInt(whole || "0") * WEI_PER_ETH + BigInt(fraction.padEnd(18, "0") || "0");
}

/** Formats wei as a decimal ETH string without trailing zeros. */
export function formatEther(wei: bigint): string {
  const negative = wei < 0n;
  const abs = negative ? -wei : wei;
  const whole = abs / WEI_PER_ETH;
  const fraction = (abs % WEI_PER_ETH).toString().padStart(18, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

/** Fee in wei for an amount and a fee in basis points (rounds down). */
export function feeWei(amountWei: bigint, feeBps: number): bigint {
  if (!Number.isInteger(feeBps) || feeBps < 0) throw new Error(`Invalid feeBps: ${feeBps}`);
  return (amountWei * BigInt(feeBps)) / 10_000n;
}

export function toHex(value: bigint): string {
  return `0x${value.toString(16)}`;
}
