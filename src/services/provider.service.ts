import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { CHAINS } from "../config/chains";

export type ProviderName = "walletconnect";

/** The package exports `EthereumProvider` as a value only, so derive the instance type. */
export type WalletProvider = Awaited<ReturnType<typeof EthereumProvider.init>>;

const projectId = import.meta.env.VITE_PROJECT_ID as string | undefined;
const walletFeeApiUrl = import.meta.env.VITE_WALLET_FEE_API_URL as string | undefined;

/**
 * PNG, not SVG: wallets built with React Native can't render SVG icons. Served raw from the repo so it
 * stays the same wherever the app is deployed. A github.com/.../blob/... URL returns an HTML page, not the image.
 */
const APP_ICON_URL =
  "https://raw.githubusercontent.com/WalletConnect/app-fees-demo-public/main/public/icon-512.png";

let providerPromise: Promise<WalletProvider> | undefined;

/** Lazily creates the single WalletConnect EthereumProvider for the page. */
export function getProvider(): Promise<WalletProvider> {
  if (!projectId) return Promise.reject(new Error("VITE_PROJECT_ID is not set (see .env.example)"));

  providerPromise ??= EthereumProvider.init({
    projectId,
    showQrModal: true,
    optionalChains: [CHAINS[0].id, ...CHAINS.slice(1).map((chain) => chain.id)],
    metadata: {
      name: "Swap demo",
      description: "Wallet fee demo for in-wallet launches",
      url: new URL(import.meta.env.BASE_URL, window.location.origin).href,
      icons: [APP_ICON_URL],
    },
    ...(walletFeeApiUrl ? { walletFeeApiUrl } : {}),
  });
  return providerPromise;
}

/**
 * Connects with the chosen wallet. Only WalletConnect is wired up.
 * On a wallet launch `enable()` goes through the wallet's bridge and never opens the QR modal.
 */
export async function connectProvider(name: ProviderName): Promise<string[]> {
  if (name !== "walletconnect") throw new Error(`Unsupported provider: ${name}`);
  const provider = await getProvider();
  return provider.enable();
}
