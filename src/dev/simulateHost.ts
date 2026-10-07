/**
 * Dev-only: `?simulateHost=1` pretends a wallet's in-app browser opened the page
 * by injecting the bridge the SDK looks for. Must run before the app reads it.
 */
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("simulateHost") === "1") {
  window.walletConnectHost = {
    autoConnect: true,
    postMessage: (message) => console.log("host", message),
  };
  console.info("[dev] simulating a wallet launch (window.walletConnectHost injected)");
}

export {};
