import { useCallback, useEffect, useState } from "react";
import type { WalletFee } from "@walletconnect/ethereum-provider";
import {
  connectProvider,
  getProvider,
  type ProviderName,
  type WalletProvider,
} from "../services/provider.service";
import { DEFAULT_CHAIN } from "../config/chains";
import { toHex } from "../lib/wei";
import { getErrorMessage } from "../lib/errors";

export type WalletStatus = "initializing" | "idle" | "connecting" | "connected";

export type Wallet = {
  status: WalletStatus;
  address?: string;
  chainId: number;
  walletFee?: WalletFee;
  initError?: string;
  connect: (name: ProviderName) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  sendTransaction: (tx: { to: string; value: bigint }) => Promise<string>;
};

export function useWallet(): Wallet {
  const [provider, setProvider] = useState<WalletProvider>();
  const [status, setStatus] = useState<WalletStatus>("initializing");
  const [address, setAddress] = useState<string>();
  const [chainId, setChainId] = useState(DEFAULT_CHAIN.id);
  const [walletFee, setWalletFee] = useState<WalletFee>();
  const [initError, setInitError] = useState<string>();

  const syncFromProvider = useCallback(async (p: WalletProvider) => {
    setAddress(p.accounts[0]);
    setChainId(p.chainId);
    setStatus("connected");
    setWalletFee(await p.getWalletFee());
  }, []);

  useEffect(() => {
    let current: WalletProvider | undefined;
    const reset = () => {
      setStatus("idle");
      setAddress(undefined);
      setWalletFee(undefined);
    };
    const onAccountsChanged = (accounts: string[]) => setAddress(accounts[0]);
    const onChainChanged = (hexChainId: string) => {
      setChainId(Number.parseInt(hexChainId, 16));
      current?.getWalletFee().then(setWalletFee);
    };
    const onFeeChanged = (fee: WalletFee | undefined) => setWalletFee(fee);

    getProvider()
      .then(async (p) => {
        current = p;
        p.on("accountsChanged", onAccountsChanged);
        p.on("chainChanged", onChainChanged);
        p.on("disconnect", reset);
        p.on("wallet_fee_changed", onFeeChanged);
        setProvider(p);
        if (p.session && p.accounts.length) await syncFromProvider(p);
        else setStatus("idle");
      })
      .catch((error: unknown) => {
        setInitError(getErrorMessage(error));
        setStatus("idle");
      });

    return () => {
      current?.removeListener("accountsChanged", onAccountsChanged);
      current?.removeListener("chainChanged", onChainChanged);
      current?.removeListener("disconnect", reset);
      current?.removeListener("wallet_fee_changed", onFeeChanged);
    };
  }, [syncFromProvider]);

  const connect = useCallback(
    async (name: ProviderName) => {
      setStatus("connecting");
      try {
        await connectProvider(name);
        await syncFromProvider(await getProvider());
      } catch (error) {
        setStatus("idle");
        throw error;
      }
    },
    [syncFromProvider],
  );

  const disconnect = useCallback(async () => {
    await provider?.disconnect();
    setStatus("idle");
    setAddress(undefined);
    setWalletFee(undefined);
  }, [provider]);

  const switchChain = useCallback(
    async (nextChainId: number) => {
      if (!provider || status !== "connected") {
        setChainId(nextChainId);
        return;
      }
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHex(BigInt(nextChainId)) }],
      });
      setChainId(provider.chainId);
      setWalletFee(await provider.getWalletFee());
    },
    [provider, status],
  );

  const sendTransaction = useCallback(
    async ({ to, value }: { to: string; value: bigint }) => {
      if (!provider || !address) throw new Error("Wallet not connected");
      return provider.request<string>({
        method: "eth_sendTransaction",
        params: [{ from: address, to, value: toHex(value) }],
      });
    },
    [provider, address],
  );

  return {
    status,
    address,
    chainId,
    walletFee,
    initError,
    connect,
    disconnect,
    switchChain,
    sendTransaction,
  };
}
