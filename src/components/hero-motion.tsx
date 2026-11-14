"use client";
// Decorative, lazy-loaded WebGL hero. The static sculpture remains visible until
// the first rendered frame and whenever reduced motion or WebGL failure applies.
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { HeroScene } from "@/lib/hero-scene";

export function HeroMotion() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<HeroScene | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const node = canvas.current;
    if (!node) return;
    setReady(false);
    const fail = () => { scene.current?.dispose(); scene.current = null; setReady(false); };
    import("@/lib/hero-scene").then(({ createHeroScene }) => {
      if (cancelled) return;
      try {
        scene.current = createHeroScene(node, () => { if (!cancelled) setReady(true); }, fail);
      } catch { setReady(false); }
    }).catch(() => { if (!cancelled) setReady(false); });
    return () => { cancelled = true; scene.current?.dispose(); scene.current = null; };
  }, [reduced]);

  useEffect(() => { scene.current?.setPaused(paused); }, [paused, ready]);

  return <>
    <div className={`hero-motion ${ready && !reduced ? "is-ready" : ""}`} aria-hidden="true">
      <div className="hero-motion-glow" />
      <div className="hero-motion-fallback"><div className="orbit-art"><div className="orbit-halo" /><div className="orbit-core" /><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-ring ring-three" /></div></div>
      <canvas ref={canvas} className="hero-canvas" />
      <span className="sculpture-cross sculpture-cross-one">+</span><span className="sculpture-cross sculpture-cross-two">+</span>
    </div>
    {ready && !reduced && <button className="hero-motion-toggle" onClick={() => setPaused(p => !p)} aria-label={paused ? "Play hero animation" : "Pause hero animation"} aria-pressed={paused}>{paused ? <Play size={12} /> : <Pause size={12} />}<span>{paused ? "PLAY MOTION" : "PAUSE MOTION"}</span></button>}
  </>;
}
