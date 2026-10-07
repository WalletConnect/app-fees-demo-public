import type { FeeResolution } from "../services/fee.service";
import { formatBps, shortAddress } from "../lib/format";
import { formatEther } from "../lib/wei";

export function describeFee(resolution: FeeResolution): string | undefined {
  switch (resolution.kind) {
    case "referral":
      return `Referral program: ${resolution.code} → integrator ${shortAddress(resolution.to)} (mocked), ${formatBps(resolution.feeBps)}`;
    case "direct":
      return `Direct fee: ${formatBps(resolution.feeBps)} → ${shortAddress(resolution.to)}`;
    case "none":
      return undefined;
  }
}

type Props = {
  resolution?: FeeResolution;
  feeWei: bigint;
};

export function FeeRow({ resolution, feeWei }: Props) {
  if (!resolution) {
    return (
      <div className="fee-row fee-row-loading" role="status">
        <span>Wallet fee</span>
        <span>Checking…</span>
      </div>
    );
  }

  const description = describeFee(resolution);
  if (!description) return null;

  return (
    <div className="fee-row" data-kind={resolution.kind}>
      <div className="fee-row-top">
        <span>Wallet fee</span>
        <span className="mono">{formatEther(feeWei)} ETH</span>
      </div>
      <p className="fee-row-detail" title={"to" in resolution ? resolution.to : undefined}>
        {description}
      </p>
    </div>
  );
}
