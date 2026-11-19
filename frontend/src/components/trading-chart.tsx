"use client";
// Restore the old app's TradingView technical chart using its public embed.
// Third-party script loading is explicit, isolated to this route, and has a fallback link.
import { useEffect, useRef, useState } from "react";
export function TradingChart({ symbol }: { symbol: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const slot = document.createElement("div");
    slot.className = "tradingview-widget-container__widget";
    slot.style.height = "100%";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify({ autosize: true, symbol, interval: "D", timezone: "Asia/Kolkata", theme: "dark", style: "1", locale: "en", allow_symbol_change: true, hide_side_toolbar: false, withdateranges: true, support_host: "https://www.tradingview.com" });
    script.onerror = () => setFailed(true);
    root.replaceChildren(slot, script);
    return () => { script.onerror = null; root.replaceChildren(); };
  }, [symbol]);
  return <><div className="trading-chart tradingview-widget-container" ref={host} aria-label={`${symbol} interactive TradingView chart`} />{failed && <p className="notice" role="status">The chart provider couldn’t load in this browser.</p>}<p className="provider-caption">Chart and market data by <a href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`} target="_blank" rel="noopener noreferrer">TradingView ↗</a>. Availability and delays depend on the exchange. Use this link if the embedded chart is blocked.</p></>;
}
