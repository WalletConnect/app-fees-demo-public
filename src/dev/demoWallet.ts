import type { WalletFee } from "@walletconnect/ethereum-provider";

/**
 * Dev-only: `?demoFee=referral|direct|none` fakes a connected wallet and its fee,
 * so the fee rows and the "Swap complete" state can be previewed without a real wallet.
 */
type DemoFeeMode = "referral" | "direct" | "none";

const mode = import.meta.env.DEV
  ? (new URLSearchParams(window.location.search).get("demoFee") as DemoFeeMode | null)
  : null;

export const demoWallet = mode
  ? {
      address: "0xD3m0000000000000000000000000000000000Ab",
      fee(chainId: number): WalletFee | undefined {
        const caip = `eip155:${chainId}`;
        if (mode === "referral")
          return { chainId: caip, referralCode: "rn-sample-ref", feeBps: 30, recipient: "0x1234000000000000000000000000000000005eab" };
        if (mode === "direct")
          return { chainId: caip, feeBps: 50, recipient: "0x1234000000000000000000000000000000005eab" };
        return undefined;
      },
      async sendTransaction(tx: { to: string; value: bigint }): Promise<string> {
        console.log("[dev] demo eth_sendTransaction", tx);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return `0x${"d3m0".repeat(16)}`;
      },
    }
  : undefined;
