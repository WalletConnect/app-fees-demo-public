import { useCallback, useEffect, useRef, useState } from "react";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { ClearCacheButton } from "./components/ClearCacheButton";
import { ConnectWalletModal } from "./components/ConnectWalletModal";
import { Header } from "./components/Header";
import { SwapCard } from "./components/SwapCard";
import { demoWallet } from "./dev/demoWallet";
import { useTermsAccepted } from "./hooks/useTermsAccepted";
import { useWallet } from "./hooks/useWallet";
import { TERMS_STEP_ENABLED } from "./config/flags";
import { getErrorMessage } from "./lib/errors";
import type { ProviderName } from "./services/provider.service";
import { readReferrerFromUrl } from "./services/fee.service";

// a `?referrer=<code>` link is remembered for the session, like a normal referral link
readReferrerFromUrl();

export default function App() {
  const wallet = useWallet();
  const [termsAccepted, setTermsAccepted] = useTermsAccepted();
  const canConnect = !TERMS_STEP_ENABLED || termsAccepted;
  const [modalOpen, setModalOpen] = useState(false);
  const [connectError, setConnectError] = useState<string>();
  // true from a wallet launch until the one auto-connect attempt; never set again on this page load
  const [hostLaunchPending, setHostLaunchPending] = useState(false);
  const hostLaunchChecked = useRef(false);

  useEffect(() => {
    if (hostLaunchChecked.current) return;
    hostLaunchChecked.current = true;
    if (EthereumProvider.isHostLaunch()) {
      setModalOpen(true);
      setHostLaunchPending(true);
    }
  }, []);

  const { connect, status } = wallet;
  const handleConnect = useCallback(
    async (name: ProviderName) => {
      setConnectError(undefined);
      try {
        await connect(name);
        setModalOpen(false);
      } catch (error) {
        setConnectError(getErrorMessage(error));
      }
    },
    [connect],
  );

  // wallet launch: try once, when the modal opens. If the terms are already accepted (or the terms
  // step is off) connect right away, with no wallet-list click or QR. Otherwise ticking the box only
  // enables the wallet list and the user taps WalletConnect, which also goes through the wallet's bridge.
  useEffect(() => {
    if (!hostLaunchPending || status === "initializing") return;
    setHostLaunchPending(false);
    if (status === "connected") {
      setModalOpen(false);
      return;
    }
    if (status === "idle" && canConnect) void handleConnect("walletconnect");
  }, [hostLaunchPending, status, canConnect, handleConnect]);

  const closeModal = () => {
    setModalOpen(false);
    setHostLaunchPending(false);
    setConnectError(undefined);
  };

  const address = demoWallet?.address ?? wallet.address;
  const walletFee = demoWallet ? demoWallet.fee(wallet.chainId) : wallet.walletFee;

  return (
    <>
      <Header
        address={address}
        chainId={wallet.chainId}
        onConnectClick={() => setModalOpen(true)}
        onDisconnect={() => void wallet.disconnect()}
      />

      <main className="main">
        {wallet.initError && (
          <p className="banner" role="alert">
            {wallet.initError}
          </p>
        )}
        <SwapCard
          address={address}
          chainId={wallet.chainId}
          walletFee={walletFee}
          onConnectClick={() => setModalOpen(true)}
          switchChain={wallet.switchChain}
          sendTransaction={demoWallet?.sendTransaction ?? wallet.sendTransaction}
        />
        <ClearCacheButton
          disconnect={async () => {
            if (status === "connected") await wallet.disconnect();
          }}
        />
      </main>

      <ConnectWalletModal
        open={modalOpen}
        connecting={status === "connecting"}
        error={connectError}
        requireTerms={TERMS_STEP_ENABLED}
        termsAccepted={termsAccepted}
        onTermsChange={setTermsAccepted}
        onSelect={(name) => void handleConnect(name)}
        onClose={closeModal}
      />
    </>
  );
}
