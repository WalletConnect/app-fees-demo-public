import { useState } from "react";

type Props = {
  /** Disconnects the wallet, if connected, before the cache is cleared. */
  disconnect: () => Promise<void>;
};

const DISCONNECT_TIMEOUT_MS = 3_000;

/**
 * Demo helper: disconnects, clears localStorage + sessionStorage (accepted terms, referral cache)
 * and reloads with the same URL, so the connect flow, terms step included, can be shown again.
 */
export function ClearCacheButton({ disconnect }: Props) {
  const [clearing, setClearing] = useState(false);

  const clearCache = async () => {
    setClearing(true);
    try {
      // don't let an unreachable wallet block the reset
      await Promise.race([
        disconnect(),
        new Promise((resolve) => setTimeout(resolve, DISCONNECT_TIMEOUT_MS)),
      ]);
    } catch (error) {
      console.warn("Disconnect failed while clearing the demo cache", error);
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="clear-cache">
      <button className="button-link" disabled={clearing} onClick={() => void clearCache()}>
        {clearing ? "Clearing…" : "Clear demo cache"}
      </button>
      <p className="card-note">Disconnects and forgets the accepted terms, then reloads.</p>
    </div>
  );
}
