export type Chain = {
  id: number;
  name: string;
  explorerUrl: string;
  color: string;
};

export const CHAINS: Chain[] = [
  { id: 10, name: "Optimism", explorerUrl: "https://optimistic.etherscan.io", color: "#ff0420" },
  { id: 42161, name: "Arbitrum", explorerUrl: "https://arbiscan.io", color: "#28a0f0" },
  { id: 8453, name: "Base", explorerUrl: "https://basescan.org", color: "#0052ff" },
];

export const DEFAULT_CHAIN = CHAINS[0];

export function getChain(chainId: number): Chain | undefined {
  return CHAINS.find((chain) => chain.id === chainId);
}

export function txUrl(chainId: number, hash: string): string | undefined {
  const chain = getChain(chainId);
  return chain && `${chain.explorerUrl}/tx/${hash}`;
}
