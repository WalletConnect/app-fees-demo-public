import type { ProviderName } from "../services/provider.service";
// Official brand artwork: WalletConnect (WalletConnect/walletconnect-assets),
// MetaMask (MetaMask/metamask-extension), Coinbase Wallet (coinbase/coinbase-wallet-sdk),
// Trust Wallet (trustwallet.com). Logos are trademarks of their owners.
import walletConnectLogo from "../assets/wallets/walletconnect.svg";
import metaMaskLogo from "../assets/wallets/metamask.svg";
import coinbaseWalletLogo from "../assets/wallets/coinbase-wallet.svg";
import trustWalletLogo from "../assets/wallets/trust-wallet.svg";

type WalletOption = {
  id: ProviderName | "metamask" | "coinbase" | "trust";
  name: string;
  logo: string;
  enabled: boolean;
};

const WALLETS: WalletOption[] = [
  { id: "walletconnect", name: "WalletConnect", logo: walletConnectLogo, enabled: true },
  { id: "metamask", name: "MetaMask", logo: metaMaskLogo, enabled: false },
  { id: "coinbase", name: "Coinbase Wallet", logo: coinbaseWalletLogo, enabled: false },
  { id: "trust", name: "Trust Wallet", logo: trustWalletLogo, enabled: false },
];

type Props = {
  open: boolean;
  connecting: boolean;
  error?: string;
  /** Show the Terms of Use checkbox and gate the wallet list on it. */
  requireTerms: boolean;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onSelect: (provider: ProviderName) => void;
  onClose: () => void;
};

export function ConnectWalletModal({
  open,
  connecting,
  error,
  requireTerms,
  termsAccepted,
  onTermsChange,
  onSelect,
  onClose,
}: Props) {
  if (!open) return null;
  const canConnect = !requireTerms || termsAccepted;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-wallet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="connect-wallet-title">Connect wallet</h2>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {connecting ? (
          <div className="modal-connecting" role="status">
            <span className="spinner" aria-hidden="true" />
            <p>Connecting to your wallet…</p>
          </div>
        ) : (
          <>
            {requireTerms && (
              <label className="rules-checkbox">
                <input
                  type="checkbox"
                  name="rulesCheckbox"
                  checked={termsAccepted}
                  onChange={(event) => onTermsChange(event.target.checked)}
                />
                <span>
                  I read and accept <a href="#terms">Terms of Use</a> and <a href="#privacy">Privacy Policy</a>.
                </span>
              </label>
            )}

            <ul className="wallet-grid" aria-disabled={!canConnect}>
              {WALLETS.map((wallet) => (
                <li key={wallet.id}>
                  <button
                    className="wallet-option"
                    disabled={!canConnect || !wallet.enabled}
                    title={wallet.enabled ? undefined : "Not available in this demo"}
                    onClick={() => wallet.enabled && onSelect(wallet.id as ProviderName)}
                  >
                    <span className="wallet-tile">
                      <img className={`wallet-icon wallet-icon-${wallet.id}`} src={wallet.logo} alt="" />
                    </span>
                    <span className="wallet-name">{wallet.name}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="modal-note">Only WalletConnect works in this demo.</p>

            {error && (
              <p className="modal-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
