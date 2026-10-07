type Props = { symbol: "ETH" | string };

/** Small token glyphs drawn for the demo (ETH diamond, generic mock token). */
export function TokenIcon({ symbol }: Props) {
  if (symbol === "ETH") {
    return (
      <svg className="token-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#627eea" />
        <path d="M12 4l-5 8.2 5 3 5-3z" fill="#fff" fillOpacity="0.9" />
        <path d="M12 16.2l-5-3 5 6.8 5-6.8z" fill="#fff" fillOpacity="0.7" />
      </svg>
    );
  }
  return (
    <svg className="token-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#00e28d" />
      <text x="12" y="16.2" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0b1a13">
        {symbol[0]}
      </text>
    </svg>
  );
}
