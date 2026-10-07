# Swap demo (app-fees-demo)

A small demo of WalletConnect's **wallet launch** flow and wallet fees. It's a swap page in the style of a DEX aggregator, and it shows the flow end to end:

1. A wallet opens the page in its in-app browser.
2. The page connects automatically, with no QR code.
3. A swap sends one real transaction that pays the wallet's fee. The wallet shows it when signing.

It supports both ways an app can charge a wallet's fee:

- **Referral program** (the app's own partner program): the wallet sends a `referralCode`. The app resolves it through its backend (mocked here) to an integrator address and fee.
- **Direct fee**: the wallet sends `feeBps` + `recipient`, and the app pays the wallet directly.

It's a demo for partners, not a product: there are no real swaps, quotes or backend.

## What's real vs mocked

| Real | Mocked |
| --- | --- |
| WalletConnect connection (`@walletconnect/ethereum-provider@2.25.1-canary-6`), QR modal or wallet launch | The swap itself: the quote and the "You receive" amount use a fixed rate (`src/mocks/quote.ts`) |
| `getWalletFee()` / `wallet_fee_changed` from the wallet fee API | The referral backend (`src/mocks/referral-api.ts`) |
| Network switching (`wallet_switchEthereumChain`) | Terms of Use / Privacy Policy links |
| One `eth_sendTransaction` that pays the fee on the current chain | MetaMask / Coinbase / Trust buttons (disabled placeholders) |

## Setup

```bash
cp .env.example .env.local   # then set VITE_PROJECT_ID
npm install
npm run dev                  # http://localhost:5173
```

| Env var | Required | Description |
| --- | --- | --- |
| `VITE_PROJECT_ID` | yes | WalletConnect projectId |
| `VITE_WALLET_FEE_API_URL` | no | Wallet fee API base URL, for local/staging. Defaults to `https://api.walletconnect.com` |

Every `@walletconnect/*` package is pinned to `2.25.1-canary-6`, in both `dependencies` and `overrides`. Check with `npm ls --all | grep @walletconnect/`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit tests (fee math, fee resolution order, mock referral API) |
| `npm run build` | Type-check and build the static site into `dist/` |
| `npm run deploy` | `build`, then `npx vercel deploy dist --prod --yes` |

### Deploy (GitHub Pages)

`.github/workflows/pages.yml` builds the site and publishes it to GitHub Pages on every push to `main`. It can also be run by hand from the Actions tab. One-time setup in the repo settings:

1. **Settings → Pages → Build and deployment → Source:** choose "GitHub Actions".
2. **Settings → Secrets and variables → Actions → Variables:** add `VITE_PROJECT_ID`. Add `VITE_WALLET_FEE_API_URL` too if you need a non-default fee API.

The workflow builds with `BASE_PATH=/<repo-name>/`, so the site works at `https://<owner>.github.io/<repo-name>/`. For a custom domain, set `BASE_PATH` to `/` in the workflow.

### Deploy (Vercel)

The deploy uploads the **prebuilt** `dist/` folder, so the project needs no Vercel env setup. Vite inlines `VITE_*` at build time from `.env.local`, and the projectId isn't secret.

- If the Vercel CLI isn't logged in, or asks for a scope/team, pick the team on purpose before you continue.
- Turn off **Vercel Authentication / deployment protection** for the project. If it's on, the wallet's in-app browser can't open the page.

## How the fee is charged

Everything is in `src/services/fee.service.ts`. `getIntegratorAddress(walletFee, chainId)` resolves the fee for the current chain in this order:

1. **Referral.** The code is the wallet's `referralCode`, or a `?referrer=<code>` from the URL when the wallet sends none. The code is resolved through the mock referral API, and results are cached in sessionStorage.
   - If the code is known: `to = integratorAddress`, `value = amount × feeBps / 10000`.
2. **Direct.** If the wallet sent `feeBps` and `recipient`: `to = recipient`, `value = amount × feeBps / 10000`.
3. **None.** Otherwise there's no fee, and the swap sends 0 ETH to your own address so the flow still completes.

The "Wallet fee" row under the quote shows which mechanism applied. It updates on `wallet_fee_changed`, after a network switch, and when a referral resolves.

### Editing the mock referral table

Edit `REFERRERS` in `src/mocks/referral-api.ts`:

```ts
export const REFERRERS: Record<string, Integrator> = {
  "rn-sample-ref": { integratorAddress: "0x704457b418E9Fb723e1Bc0cB98106a6B8Cf87689", feeBps: 50 },
  "my-partner": { integratorAddress: "0x…", feeBps: 25 },
};
```

`getIntegratorByReferrer(code)` mimics `GET /referrers/integrator?referrer=<code>`, with about 300 ms of latency. Resolved codes are cached per browser session. Open a new tab, or clear sessionStorage, after you edit the table.

## The connect flow

- **Normal browser.**
  1. "Connect wallet" opens a modal: a Terms of Use checkbox (remembered in localStorage) above a wallet list.
  2. The wallet buttons stay disabled until the box is ticked. Only WalletConnect works.
  3. WalletConnect opens the QR modal.
- **Wallet launch** (`EthereumProvider.isHostLaunch()` is true because the wallet injected `window.walletConnectHost`). The modal opens automatically, once per page load:
  - If the terms were already accepted, it connects right away through the wallet's bridge, with no wallet-list click and no QR. It shows "Connecting to your wallet…", then closes.
  - If not, the checkbox shows. Ticking it only enables the wallet list, and the user then taps WalletConnect, which still connects through the wallet's bridge with no QR.
  - After you disconnect, it never reconnects automatically.

### Showing the flow again ("Clear demo cache")

The **Clear demo cache** button under the swap card resets the demo:

1. It disconnects the wallet, if one is connected.
2. It clears the page's localStorage and sessionStorage, which hold the accepted terms and the referral cache.
3. It reloads with the same URL, so params such as `?terms=0` or `?referrer=` still apply.

On a wallet launch, the modal then opens again with the terms checkbox unticked.

### Skipping the terms step (`?terms=0`)

Add `?terms=0` (or `false` / `off`) to the URL to drop the Terms of Use step, so both variants can be demoed:

| URL | Wallet launch | Normal browser |
| --- | --- | --- |
| `/` (default) | Auto-connects right away if the terms were accepted before; otherwise tick the box, then tap WalletConnect | The checkbox gates the wallet list |
| `/?terms=0` | Auto-connects right away: the modal only shows "Connecting to your wallet…" | No checkbox; WalletConnect is enabled straight away |

The flag is read from the URL on each load and also works in production builds. The terms choice saved in localStorage is ignored while the flag is on.

## Opening it from the RN sample wallet

In [react-native-examples](https://github.com/reown-com/react-native-examples), `wallets/rn_cli_wallet`, add a tile to the Explore tab in `src/utils/ExploreUtil.ts`. Point it at the deployed URL, or at `http://localhost:5173` when running on the iOS simulator against `npm run dev`.

Add two tiles to compare both connect variants: the URL as is (terms step), and the URL with `?terms=0` (direct auto-connect).

Test with two wallet configs:
- one with `feeBps` + recipient (the direct fee)
- one with only a referral code (`rn-sample-ref`)

## Dev-only testing flags

These only work under `npm run dev` and are stripped from the production build.

| Flag | Effect |
| --- | --- |
| `?simulateHost=1` | Injects `window.walletConnectHost = { autoConnect: true, postMessage: m => console.log("host", m) }` before the app reads it, to simulate a wallet launch. The session offer is logged to the console. |
| `?demoFee=referral\|direct\|none` | Fakes a connected wallet and its fee, to preview each "Wallet fee" row and the "Swap complete" state without a wallet. No transaction is sent. |

`?referrer=<code>` (a normal referral link) and `?terms=0` (see above) work in production too.

## License

[MIT](LICENSE). Wallet logos in `src/assets/wallets/` are trademarks of their owners.
