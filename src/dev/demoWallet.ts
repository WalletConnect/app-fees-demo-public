import type { WalletFee } from "@walletconnect/ethereum-provider";

/**
 * Dev-only: `?demoFee=referral|direct|none` fakes a connected wallet and its fee,
 * so the fee rows and the "Swap complete" state can be previewed without a real wallet.
 */
type DemoFeeMode = "referral" | "direct" | "none";

const mode = import.meta.env.DEV
  ? (new URLSearchParams(window.location.search).get("demoFee") as DemoFeeMode | null)
  : null;

/** One recipient per chain in the network selector, so a network switch shows that chain's recipient. */
const recipients: WalletFee["recipients"] = [
  { chainId: "eip155:10", address: "0x1234000000000000000000000000000000005eab" },
  { chainId: "eip155:42161", address: "0x1234000000000000000000000000000000a4b1" },
  { chainId: "eip155:8453", address: "0x1234000000000000000000000000000000002105" },
];

function demoFee(mode: DemoFeeMode): WalletFee | undefined {
  if (mode === "referral") return { referralCode: "rn-sample-ref", feeBps: 30, recipients };
  if (mode === "direct") return { feeBps: 50, recipients };
  return undefined;
}

export const demoWallet = mode
  ? {
      address: "0xD3m0000000000000000000000000000000000Ab",
      fee: demoFee(mode),
      async sendTransaction(tx: { to: string; value: bigint }): Promise<string> {
        console.log("[dev] demo eth_sendTransaction", tx);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return `0x${"d3m0".repeat(16)}`;
      },
    }
  : undefined;
