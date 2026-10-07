import { useState } from "react";
import type { WalletFee } from "@walletconnect/ethereum-provider";
import { NetworkSelector } from "./NetworkSelector";
import { TokenIcon } from "./TokenIcon";
import { FeeRow, describeFee } from "./FeeRow";
import { useFeeResolution } from "../hooks/useFeeResolution";
import { getFeeAmount, type FeeResolution } from "../services/fee.service";
import { getChain, txUrl } from "../config/chains";
import { MOCK_TOKEN, quote } from "../mocks/quote";
import { formatEther, parseEther } from "../lib/wei";
import { shortHash } from "../lib/format";
import { getErrorMessage } from "../lib/errors";

type SwapResult = {
  hash: string;
  chainId: number;
  resolution: FeeResolution;
  feeWei: bigint;
};

type Props = {
  address?: string;
  chainId: number;
  walletFee?: WalletFee;
  onConnectClick: () => void;
  switchChain: (chainId: number) => Promise<void>;
  sendTransaction: (tx: { to: string; value: bigint }) => Promise<string>;
};

export function SwapCard({ address, chainId, walletFee, onConnectClick, switchChain, sendTransaction }: Props) {
  const [amount, setAmount] = useState("0.001");
  const [switching, setSwitching] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<SwapResult>();
  const { resolution, resolving } = useFeeResolution(walletFee, chainId);

  const amountWei = parseEther(amount);
  const fee = resolution && amountWei !== null ? getFeeAmount(resolution, amountWei) : 0n;
  const receive = amountWei !== null ? quote(amountWei - fee) : undefined;

  const handleNetworkChange = async (nextChainId: number) => {
    setError(undefined);
    setSwitching(true);
    try {
      await switchChain(nextChainId);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSwitching(false);
    }
  };

  const handleSwap = async () => {
    if (!address || !resolution || amountWei === null) return;
    setError(undefined);
    setSwapping(true);
    try {
      // the demo's only real effect: one transaction that pays the fee (or 0 ETH to yourself if there's none)
      const tx =
        resolution.kind === "none" ? { to: address, value: 0n } : { to: resolution.to, value: fee };
      const hash = await sendTransaction(tx);
      setResult({ hash, chainId, resolution, feeWei: tx.value });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSwapping(false);
    }
  };

  if (result) {
    return <SwapComplete result={result} onDone={() => setResult(undefined)} />;
  }

  let buttonLabel = "Swap";
  if (!address) buttonLabel = "Connect wallet";
  else if (amountWei === null || amountWei === 0n) buttonLabel = "Enter an amount";
  else if (resolving) buttonLabel = "Checking wallet fee…";
  else if (swapping) buttonLabel = "Confirm in your wallet…";

  return (
    <section className="card swap-card" aria-label="Swap">
      <div className="card-tabs">
        <h1 className="tab tab-active">Swap</h1>
        <NetworkSelector chainId={chainId} disabled={switching || swapping} onChange={handleNetworkChange} />
      </div>

      <div className="swap-panel">
        <div className="swap-row">
          <span className="token-pill">
            <TokenIcon symbol="ETH" />
            ETH
          </span>
          <div className="swap-amount">
            <label htmlFor="pay-amount">You pay</label>
            <input
              id="pay-amount"
              className="amount-input"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Enter an amount"
              value={amount}
              aria-invalid={amountWei === null}
              onChange={(event) => setAmount(event.target.value.replace(",", "."))}
            />
          </div>
        </div>

        <div className="swap-divider" aria-hidden="true">
          <span className="swap-switch">
            <svg viewBox="0 0 16 16" width="14" height="14">
              <path
                d="M5 6.5L8 3.5l3 3M5 9.5l3 3 3-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <div className="swap-row">
          <span className="token-pill">
            <TokenIcon symbol={MOCK_TOKEN.symbol} />
            {MOCK_TOKEN.symbol}
          </span>
          <div className="swap-amount">
            <span className="swap-label">You receive</span>
            <span className="amount-output">{receive !== undefined ? trimAmount(formatEther(receive)) : "–"}</span>
          </div>
        </div>
      </div>

      <FeeRow resolution={resolution} feeWei={fee} />

      {error && (
        <p className="swap-error" role="alert">
          {error}
        </p>
      )}

      <button
        className="button-primary swap-button"
        disabled={!!address && (amountWei === null || amountWei === 0n || resolving || swapping || switching)}
        onClick={address ? handleSwap : onConnectClick}
      >
        {buttonLabel}
      </button>

      <p className="card-note">
        Demo: no real swap or quote. Swapping sends one transaction on {getChain(chainId)?.name ?? "this chain"}{" "}
        that only pays the wallet fee.
      </p>
    </section>
  );
}

function SwapComplete({ result, onDone }: { result: SwapResult; onDone: () => void }) {
  const url = txUrl(result.chainId, result.hash);
  const mechanism = describeFee(result.resolution) ?? "No wallet fee (0 ETH sent to yourself)";

  return (
    <section className="card swap-complete" aria-label="Swap complete">
      <div className="success-mark" aria-hidden="true">
        ✓
      </div>
      <h1>Swap complete</h1>
      <p className="muted">Mock swap. The fee transaction is real.</p>

      <dl className="result-list">
        <div>
          <dt>Transaction</dt>
          <dd className="mono">
            {url ? (
              <a href={url} target="_blank" rel="noreferrer">
                {shortHash(result.hash)} ↗
              </a>
            ) : (
              shortHash(result.hash)
            )}
          </dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>{getChain(result.chainId)?.name ?? result.chainId}</dd>
        </div>
        <div>
          <dt>Fee paid</dt>
          <dd className="mono">{formatEther(result.feeWei)} ETH</dd>
        </div>
        <div>
          <dt>Fee mechanism</dt>
          <dd>{mechanism}</dd>
        </div>
      </dl>

      <button className="button-primary swap-button" onClick={onDone}>
        New swap
      </button>
    </section>
  );
}

/** Keeps the mock output readable: at most 6 decimals. */
function trimAmount(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  const trimmed = fraction.slice(0, 6).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}
