import { useEffect, useState } from "react";
import type { WalletFee } from "@walletconnect/ethereum-provider";
import { getIntegratorAddress, type FeeResolution } from "../services/fee.service";

/** Re-resolves who gets the fee whenever the wallet's fee or the chain changes. */
export function useFeeResolution(walletFee: WalletFee | undefined, chainId: number) {
  const [resolution, setResolution] = useState<FeeResolution>();

  useEffect(() => {
    let cancelled = false;
    setResolution(undefined);
    getIntegratorAddress(walletFee, chainId).then((next) => {
      if (!cancelled) setResolution(next);
    });
    return () => {
      cancelled = true;
    };
  }, [walletFee, chainId]);

  return { resolution, resolving: resolution === undefined };
}
