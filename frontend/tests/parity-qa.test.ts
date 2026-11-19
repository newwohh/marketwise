// Regression checks derived from the old route contract and malformed provider/math inputs.
// These deliberately test acceptance boundaries, not a copy of the new implementation.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { projectInvestment } from "../src/lib/model";
import { getMarkets } from "../src/lib/markets";
import { legacyRedirects } from "../src/lib/navigation";
import { createHeroScene } from "../src/lib/hero-scene";

const gpu = vi.hoisted(() => ({
  resources: [] as { name: string; dispose: ReturnType<typeof vi.fn> }[],
  failEnvironment: false,
  failRender: false,
  renders: vi.fn(),
}));
vi.mock("three", () => {
  function track(name: string) { const resource = { name, dispose: vi.fn() }; gpu.resources.push(resource); return resource; }
  class Node {
    position = { set: vi.fn(), y: 0 };
    rotation = { set: vi.fn(), x: 0, y: 0, z: 0 };
    add = vi.fn();
  }
  return {
    WebGLRenderer: class {
      dispose = track("renderer").dispose;
      setPixelRatio = vi.fn(); setClearColor = vi.fn(); setSize = vi.fn();
      render = () => { gpu.renders(); if (gpu.failRender) throw new Error("GPU render failed"); };
    },
    PMREMGenerator: class {
      dispose = track("pmrem").dispose;
      fromScene() { if (gpu.failEnvironment) throw new Error("Environment failed"); return { ...track("environment"), texture: {} }; }
    },
    Scene: Node,
    Group: Node,
    Mesh: Node,
    HemisphereLight: Node,
    DirectionalLight: Node,
    PointLight: Node,
    PerspectiveCamera: class extends Node { updateProjectionMatrix = vi.fn(); },
    MeshPhysicalMaterial: class { dispose = track("material").dispose; },
    MeshStandardMaterial: class { dispose = track("orbitMaterial").dispose; },
    TorusKnotGeometry: class { dispose = track("geometry").dispose; },
    TorusGeometry: class { dispose = track("orbitGeometry").dispose; },
    SRGBColorSpace: "srgb", ACESFilmicToneMapping: 4,
  };
});
vi.mock("three/addons/environments/RoomEnvironment.js", () => ({ RoomEnvironment: class { dispose = (() => { const resource = { name: "room", dispose: vi.fn() }; gpu.resources.push(resource); return resource.dispose; })(); } }));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("legacy public route contract", () => {
  const originalRoutes = fileURLToPath(new URL("../../marketwise-original/src/routes/AppRoutes.jsx", import.meta.url));
  it("retains every original public path as a real route or explicit compatibility redirect", () => {
    // Keep the test useful in the new GitHub repository, where the old checkout is absent.
    const paths = existsSync(originalRoutes)
      ? [...readFileSync(originalRoutes, "utf8").matchAll(/<Route\s+(?:exact\s+)?path="([^"]+)"/g)].map(match => match[1])
      : ["/", "profile", "/sign-up", "login", "/subscription", "/education", "/grow", "/explore", "/user_protection", "/about", "/cryptocurrency", "chart/:id", "/stocks", "/heatmap/cryptocurrency", "/heatmap/stocks", "/blogs", "/investsimulator", "/faq", "/chat"];
    const missing = paths.filter(raw => {
      const path = raw.startsWith("/") ? raw : `/${raw}`;
      if (legacyRedirects.some(redirect => redirect.source === path)) return false;
      const appPath = path === "/chart/:id" ? "cryptocurrency/chart/[id]" : path.startsWith("/heatmap/") ? "heatmap/[market]" : path.replace(/^\//, "");
      return !existsSync(fileURLToPath(new URL(`../src/app/${appPath ? appPath + "/" : ""}page.tsx`, import.meta.url)));
    });
    expect(missing).toEqual([]);
  });
});

describe("simulator resilience", () => {
  it("rejects a finite input whose compounding would overflow instead of displaying infinity", () => {
    expect(() => projectInvestment(1e308, 0, 50, 100)).toThrow();
  });
  it("rejects contribution overflow instead of returning an infinite portfolio", () => {
    expect(() => projectInvestment(0, 1e308, 50, 0)).toThrow();
  });
  it("keeps a zero starting amount and zero contribution valid", () => {
    expect(projectInvestment(0, 0, 1, 0)).toEqual({ value: 0, contributed: 0, gain: 0, points: [0, 0] });
  });
  it("models negative returns with end-of-month additions rather than replacing them with a positive default", () => {
    const result = projectInvestment(1000, 100, 1, -10);
    const rate = .9 ** (1 / 12) - 1;
    expect(result.value).toBeCloseTo(1000 * .9 + 100 * (((1 + rate) ** 12 - 1) / rate), 6);
    expect(result.gain).toBeLessThan(0);
  });
});

describe("currency provider validation", () => {
  it("does not call an empty rates response live data", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ date: "2026-11-13", rates: {} })));
    expect((await getMarkets("forex", request)).mode).toBe("demo");
  });
  it.each(["2026-99-99", "2026-02-31", "2025-02-29"])("rejects the invalid calendar date %s", async date => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ date, rates: { EUR: .9 } })));
    expect((await getMarkets("forex", request)).mode).toBe("demo");
  });
  it("keeps leap-day reference data valid", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ date: "2024-02-29", rates: { EUR: .9 } })));
    const data = await getMarkets("forex", request);
    expect(data.mode).toBe("live");
    expect(data.asOf).toBe("2024-02-29T00:00:00Z");
    expect(data.quotes[0]).toMatchObject({ history: [], change: null, volume: null });
  });
});

describe("hero resource lifecycle", () => {
  let frames: Map<number, FrameRequestCallback>;
  let id: number;
  let canvas: HTMLCanvasElement;
  let documentStub: EventTarget & { hidden: boolean };
  let intersection: IntersectionObserverCallback;
  let disconnects: ReturnType<typeof vi.fn>[];
  beforeEach(() => {
    gpu.resources.length = 0; gpu.failEnvironment = false; gpu.failRender = false; gpu.renders.mockClear();
    frames = new Map(); id = 0; disconnects = [];
    const hero = Object.assign(new EventTarget(), { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) });
    const parent = { closest: () => hero, clientWidth: 800, clientHeight: 600 };
    canvas = Object.assign(new EventTarget(), { parentElement: parent }) as unknown as HTMLCanvasElement;
    documentStub = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal("window", { devicePixelRatio: 2 });
    vi.stubGlobal("document", documentStub);
    vi.stubGlobal("performance", { now: () => 0 });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
    vi.stubGlobal("cancelAnimationFrame", (frame: number) => { frames.delete(frame); });
    vi.stubGlobal("IntersectionObserver", class {
      disconnect = vi.fn(); observe = vi.fn();
      constructor(callback: IntersectionObserverCallback) { intersection = callback; disconnects.push(this.disconnect); }
    });
    vi.stubGlobal("ResizeObserver", class {
      disconnect = vi.fn(); observe = vi.fn();
      constructor() { disconnects.push(this.disconnect); }
    });
  });
  function step(time: number) { const next = frames.entries().next().value; if (!next) return; const [frame, callback] = next; frames.delete(frame); callback(time); }
  it("disposes partially allocated resources when environment generation fails", () => {
    gpu.failEnvironment = true;
    expect(() => createHeroScene(canvas, vi.fn(), vi.fn())).toThrow("Environment failed");
    expect(gpu.resources.map(r => r.name)).toEqual(["renderer", "pmrem", "room"]);
    for (const resource of gpu.resources) expect(resource.dispose, resource.name).toHaveBeenCalledTimes(1);
  });
  it("releases listeners, observers, queued frames and GPU objects exactly once", () => {
    const scene = createHeroScene(canvas, vi.fn(), vi.fn());
    expect(frames.size).toBe(1);
    scene.dispose(); scene.dispose();
    expect(frames.size).toBe(0);
    disconnects.forEach(disconnect => expect(disconnect).toHaveBeenCalledOnce());
    gpu.resources.forEach(resource => expect(resource.dispose, resource.name).toHaveBeenCalledOnce());
    documentStub.dispatchEvent(new Event("visibilitychange"));
    expect(frames.size).toBe(0);
  });
  it("suspends offscreen and paused work without duplicating the render loop", () => {
    const first = vi.fn();
    const scene = createHeroScene(canvas, first, vi.fn());
    step(100); step(200);
    expect(first).toHaveBeenCalledOnce();
    scene.setPaused(true); expect(frames.size).toBe(0);
    scene.setPaused(false); expect(frames.size).toBe(1);
    intersection([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(frames.size).toBe(0);
    intersection([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(frames.size).toBe(1);
    scene.dispose();
  });
  it("stops and signals the static fallback when a render fails", () => {
    const failure = vi.fn(), scene = createHeroScene(canvas, vi.fn(), failure);
    gpu.failRender = true; step(100);
    expect(failure).toHaveBeenCalledOnce(); expect(frames.size).toBe(0);
    gpu.resources.forEach(resource => expect(resource.dispose, resource.name).toHaveBeenCalledOnce());
    scene.dispose();
  });
});
