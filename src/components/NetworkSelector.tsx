import { CHAINS } from "../config/chains";

type Props = {
  chainId: number;
  disabled?: boolean;
  onChange: (chainId: number) => void;
};

export function NetworkSelector({ chainId, disabled, onChange }: Props) {
  return (
    <div className="network-selector" role="radiogroup" aria-label="Network">
      {CHAINS.map((chain) => (
        <button
          key={chain.id}
          role="radio"
          aria-checked={chain.id === chainId}
          className="network-option"
          disabled={disabled}
          onClick={() => chain.id !== chainId && onChange(chain.id)}
        >
          <span className="chain-dot" style={{ background: chain.color }} aria-hidden="true" />
          {chain.name}
        </button>
      ))}
    </div>
  );
}
