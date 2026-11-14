"use client";
// Explicit account sync merges in one transaction and applies the authoritative
// capped snapshot to this device. Unconfigured/failed syncs never change local storage.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Cloud, RefreshCw } from "lucide-react";
type Status = "loading" | "signed-out" | "unavailable" | "available";
export async function removeCloudWatchlist(key: string) {
  const [market, symbol] = key.split(":");
  const response = await fetch(`/api/watchlist?${new URLSearchParams({ market, symbol })}`, { method: "DELETE" });
  if (response.status === 401 || response.status === 503) return;
  if (!response.ok) throw new Error("The asset was removed locally, but cloud removal couldn’t be confirmed.");
}
export function CloudWatchlist({ saved, onMerge }: { saved: string[]; onMerge: (keys: string[]) => void }) {
  const [status, setStatus] = useState<Status>("loading"), [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
  useEffect(() => { const controller = new AbortController(); fetch("/api/watchlist", { signal: controller.signal, cache: "no-store" }).then(async response => { if (response.status === 401) { setStatus("signed-out"); return; } if (!response.ok) { setStatus("unavailable"); return; } setStatus("available"); }).catch(() => { if (!controller.signal.aborted) setStatus("unavailable"); }); return () => controller.abort(); }, []);
  async function sync() { setBusy(true); setNotice(""); try { const response = await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: saved }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Cloud sync couldn’t complete."); if (Array.isArray(body.items)) onMerge(body.items.filter((x: unknown): x is string => typeof x === "string")); setNotice("Watchlist synced to this device and your account. The newest 100 distinct assets are retained."); } catch (error) { setNotice(error instanceof Error ? error.message : "Cloud sync couldn’t complete. Your device-local copy is preserved."); } finally { setBusy(false); } }
  return <div className="cloud-watchlist"><p className="muted small-text"><Cloud size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />{status === "available" ? "Sync merges this device with your account and keeps the newest 100 distinct assets." : status === "signed-out" ? <>Saved on this device. <Link href="/account">Sign in to sync ↗</Link></> : status === "loading" ? "Checking account sync…" : "Saved on this device. Account sync is currently unavailable."}</p>{status === "available" && <button className="button outline small" onClick={sync} disabled={busy}><RefreshCw size={14} className={busy ? "spinning" : ""} />{busy ? "Syncing" : "Sync account watchlist"}</button>}{notice && <p className="notice" role="status">{notice}</p>}</div>;
}
