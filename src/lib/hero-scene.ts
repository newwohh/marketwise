// Original reflective lilac sculpture. GPU resources, observers, and listeners
// are owned by this instance and released on navigation or WebGL context loss.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type HeroScene = { dispose: () => void; setPaused: (value: boolean) => void };

export function createHeroScene(canvas: HTMLCanvasElement, firstFrame: () => void, failure: () => void): HeroScene {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x121314, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 50);
  camera.position.set(0, 0, 9.5);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .035);
  room.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.2;

  const sculpture = new THREE.Group();
  sculpture.rotation.set(.3, -.55, -.42);
  scene.add(sculpture);
  const material = new THREE.MeshPhysicalMaterial({ color: 0xcba0eb, metalness: 1, roughness: .2, clearcoat: 1, clearcoatRoughness: .12, iridescence: .25, iridescenceIOR: 1.35, envMapIntensity: 1.5 });
  const geometry = new THREE.TorusKnotGeometry(1.5, .39, 200, 24, 2, 3);
  const knot = new THREE.Mesh(geometry, material);
  sculpture.add(knot);
  const orbitGeometry = new THREE.TorusGeometry(2.42, .022, 8, 150);
  const orbitMaterial = new THREE.MeshStandardMaterial({ color: 0xc498e1, metalness: .8, roughness: .32, transparent: true, opacity: .36 });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbit.rotation.set(1.1, -.35, .15);
  sculpture.add(orbit);
  scene.add(new THREE.HemisphereLight(0xe7d5ff, 0x24192e, 2.2));
  const key = new THREE.DirectionalLight(0xf6eaff, 5);
  key.position.set(-3, 5, 4); scene.add(key);
  const lilac = new THREE.PointLight(0xc378ff, 50, 20);
  lilac.position.set(4, -2, 3); scene.add(lilac);
  const rim = new THREE.DirectionalLight(0xa2f2e3, 1.2);
  rim.position.set(-4, -2, -3); scene.add(rim);

  const parent = canvas.parentElement!;
  const hero = parent.closest(".hero") as HTMLElement;
  let disposed = false, paused = false, visible = true, frame = 0, last = 0, elapsed = 0;
  let pointerX = 0, pointerY = 0, rendered = false;
  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, parent.clientWidth), height = Math.max(1, parent.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const point = (event: PointerEvent) => {
    const rect = hero.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - .5) * .22;
    pointerY = ((event.clientY - rect.top) / rect.height - .5) * .18;
  };
  const leave = () => { pointerX = 0; pointerY = 0; };
  const tick = (timestamp: number) => {
    if (disposed || paused || !visible || document.hidden) return;
    frame = requestAnimationFrame(tick);
    const delta = Math.min((timestamp - last) / 1000, .05);
    if (timestamp - last < 1000 / 30) return;
    last = timestamp; elapsed += delta;
    knot.rotation.y = elapsed * .13;
    knot.rotation.x = Math.sin(elapsed * .17) * .12;
    sculpture.position.y = Math.sin(elapsed * .5) * .09;
    sculpture.rotation.y += (-.55 + pointerX - sculpture.rotation.y) * .035;
    sculpture.rotation.x += (.3 + pointerY - sculpture.rotation.x) * .035;
    orbit.rotation.z = elapsed * -.05;
    renderer.render(scene, camera);
    if (!rendered) { rendered = true; firstFrame(); }
  };
  const restart = () => {
    cancelAnimationFrame(frame);
    if (!disposed && !paused && visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(tick); }
  };
  const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; restart(); }, { threshold: .02 });
  const sizing = new ResizeObserver(resize);
  const lost = (event: Event) => { event.preventDefault(); failure(); };
  hero.addEventListener("pointermove", point, { passive: true });
  hero.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", restart);
  canvas.addEventListener("webglcontextlost", lost);
  observer.observe(hero); sizing.observe(parent); resize(); restart();
  return {
    setPaused(value) { paused = value; restart(); },
    dispose() {
      if (disposed) return;
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); sizing.disconnect();
      hero.removeEventListener("pointermove", point); hero.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", restart); canvas.removeEventListener("webglcontextlost", lost);
      geometry.dispose(); material.dispose(); orbitGeometry.dispose(); orbitMaterial.dispose(); environment.dispose(); renderer.dispose();
    },
  };
}
