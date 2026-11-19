// Validate old chart identifiers before sending a symbol to the third-party widget.
const aliases: Record<string, string> = { bitcoin: "BTC", "btc-bitcoin": "BTC", ethereum: "ETH", "eth-ethereum": "ETH", solana: "SOL", "sol-solana": "SOL", binancecoin: "BNB", "bnb-binance-coin": "BNB", ripple: "XRP", "xrp-xrp": "XRP", dogecoin: "DOGE", "doge-dogecoin": "DOGE", "avalanche-2": "AVAX", chainlink: "LINK" };
export function chartSymbol(raw: string): string | null {
  const value = (aliases[raw.toLowerCase()] ?? raw).toUpperCase();
  if (value.includes("://") || !/^(?:[A-Z][A-Z0-9_]{0,15}:)?[A-Z0-9][A-Z0-9._/-]{0,23}$/.test(value)) return null;
  if (value.includes(":")) return value;
  return `BINANCE:${value.endsWith("USDT") ? value : `${value}USDT`}`;
}
