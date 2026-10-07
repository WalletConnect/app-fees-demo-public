import { getChain } from "../config/chains";
import { shortAddress } from "../lib/format";

type Props = {
  address?: string;
  chainId: number;
  onConnectClick: () => void;
  onDisconnect: () => void;
};

export function Header({ address, chainId, onConnectClick, onDisconnect }: Props) {
  const chain = getChain(chainId);

  return (
    <header className="header">
      <div className="brand">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={28} height={28} />
        <span>Swap demo</span>
      </div>

      {address ? (
        <div className="account">
          <span className="pill">
            <span className="chain-dot" style={{ background: chain?.color }} aria-hidden="true" />
            {chain?.name ?? `Chain ${chainId}`}
          </span>
          <span className="pill mono" title={address}>
            {shortAddress(address)}
          </span>
          <button className="button-secondary" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button className="button-primary" onClick={onConnectClick}>
          Connect wallet
        </button>
      )}
    </header>
  );
}
