"use client";
// Browser-native read-aloud restores the old academy's speech feature without a third-party service.
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";
export function ReadAloud({ text }: { text: string }) {
  const [supported, setSupported] = useState(false), [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const utterances = useRef<SpeechSynthesisUtterance[]>([]);
  useEffect(() => { setSupported("speechSynthesis" in window); return () => { if (utterances.current.length) { utterances.current.forEach(u => { u.onend = null; u.onerror = null; }); window.speechSynthesis?.cancel(); } }; }, []);
  function start() {
    const synth = window.speechSynthesis;
    if (status === "paused") { synth.resume(); setStatus("playing"); return; }
    synth.cancel();
    const chunks = text.match(/[^.!?]+[.!?]*/g)?.flatMap(sentence => sentence.match(/.{1,250}(?:\s|$)|.{1,250}/g) ?? []) ?? [text];
    utterances.current = chunks.map(chunk => { const u = new SpeechSynthesisUtterance(chunk); u.lang = "en-US"; u.rate = .95; u.onerror = () => setStatus("idle"); return u; });
    const last = utterances.current.at(-1); if (last) last.onend = () => setStatus("idle");
    setStatus("playing"); utterances.current.forEach(u => synth.speak(u));
  }
  if (!supported) return null;
  return <div className="read-aloud"><button className="button outline small" onClick={() => { if (status === "playing") { window.speechSynthesis.pause(); setStatus("paused"); } else start(); }}>{status === "playing" ? <Pause size={15} /> : status === "paused" ? <Play size={15} /> : <Volume2 size={15} />}{status === "playing" ? "Pause reading" : status === "paused" ? "Resume reading" : "Listen to this field note"}</button>{status !== "idle" && <button className="icon-button" aria-label="Stop reading" onClick={() => { window.speechSynthesis.cancel(); setStatus("idle"); }}><Square size={13} /></button>}<span className="sr-only" role="status">{status === "playing" ? "Reading aloud" : status === "paused" ? "Reading paused" : ""}</span></div>;
}
