"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ─── Perlin Noise ─────────────────────────────────────────────────────────────
// Doubled permutation table (standard Perlin trick)
const _P = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  const t = new Uint8Array(512);
  for (let i = 0; i < 512; i++) t[i] = p[i & 255];
  return t;
})();

function _fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function _lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function _grad(h: number, x: number, y: number) {
  switch (h & 3) {
    case 0: return  x + y;
    case 1: return -x + y;
    case 2: return  x - y;
    default: return -x - y;
  }
}

// Returns value in [0, 1] to match p5.noise() behaviour
function noise(x: number, y: number): number {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = _fade(x), v = _fade(y);
  const aa = _P[_P[X]     + Y],     ab = _P[_P[X]     + Y + 1];
  const ba = _P[_P[X + 1] + Y],     bb = _P[_P[X + 1] + Y + 1];
  return (
    _lerp(
      _lerp(_grad(aa, x,     y    ), _grad(ba, x - 1, y    ), u),
      _lerp(_grad(ab, x,     y - 1), _grad(bb, x - 1, y - 1), u),
      v
    ) * 0.5 + 0.5 // → [0, 1]
  );
}

// ─── Flow Field ───────────────────────────────────────────────────────────────
// Samples noise on a circle to find the gradient direction (high → low)
// Faithful port of Kjetil Midtgarden Golid's calculate_flow()
function calcFlow(x: number, y: number, r: number): { x: number; y: number } {
  let hv = 0, lv = 1, hx = 0, hy = 0, lx = 0, ly = 0;
  for (let i = 0; i < 100; i++) {
    const a = (i / 100) * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    const val = noise(px, py);
    if (val > hv) { hv = val; hx = px; hy = py; }
    if (val < lv) { lv = val; lx = px; ly = py; }
  }
  const dx = lx - hx, dy = ly - hy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const mag = hv - lv;
  return { x: (dx / len) * mag, y: (dy / len) * mag };
}

function mod(x: number, n: number) { return ((x % n) + n) % n; }

// ─── Config ───────────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 450;
const FLOW_CELL      = 10;      // px per flow grid cell
const NOISE_SCALE    = 0.003;   // noise coordinate scale
const NOISE_RADIUS   = 0.2;     // circle radius for gradient sampling
const OFFSET         = 100;     // invisible border so particles wrap smoothly
const LINE_OPACITY   = 0.08;    // per-frame opacity; lines accumulate on canvas

// ─── CSS var → Three.js Color ─────────────────────────────────────────────────
// Reads a CSS custom property from :root and parses it into a THREE.Color.
// Supports any format getComputedStyle returns: "#rrggbb", "rgb(...)", "hsl(...)".
function cssVarToColor(varName: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return new THREE.Color(raw || "#ffffff");
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TopologyBackgroundProps {
  /** CSS custom property name for the line/particle color, e.g. "--topology-line" */
  lineColorVar?: string;
  /** CSS custom property name for the background color, e.g. "--topology-bg" */
  bgColorVar?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TopologyBackground({
  lineColorVar = "--topology-line",
  bgColorVar   = "--topology-bg",
}: TopologyBackgroundProps = {}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current!;
    const W = el.clientWidth;
    const H = el.clientHeight;

    // ── Renderer
    // preserveDrawingBuffer keeps WebGL's back-buffer between frames, which lets
    // us accumulate particle trails without render targets.
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(1); // intentionally 1× for perf — trails hide aliasing anyway
    renderer.setSize(W, H);
    renderer.autoClear = false; // we manage clearing ourselves

    // Read initial colors from CSS vars
    const bgColor   = cssVarToColor(bgColorVar);
    const lineColor = cssVarToColor(lineColorVar);
    renderer.setClearColor(bgColor, 1);
    el.appendChild(renderer.domElement);

    // ── Orthographic camera (pixel space, y increases upward in Three.js → OK)
    // left=0, right=W, top=H, bottom=0  →  (0,0) is bottom-left of viewport
    const camera = new THREE.OrthographicCamera(0, W, H, 0, -1, 1);
    const scene  = new THREE.Scene();

    // ── Build flow grid (one-time cost, ~50–100 ms)
    const TW = W + OFFSET * 2;
    const TH = H + OFFSET * 2;
    const fW = Math.ceil(TW / FLOW_CELL);
    const fH = Math.ceil(TH / FLOW_CELL);
    const flowGrid: { x: number; y: number }[][] = [];

    for (let row = 0; row < fH; row++) {
      const r: { x: number; y: number }[] = [];
      for (let col = 0; col < fW; col++) {
        r.push(calcFlow(col * NOISE_SCALE, row * NOISE_SCALE, NOISE_RADIUS));
      }
      flowGrid.push(r);
    }

    function getFlow(px: number, py: number) {
      const cx = Math.min(Math.floor(Math.max(px, 0) / FLOW_CELL), fW - 1);
      const cy = Math.min(Math.floor(Math.max(py, 0) / FLOW_CELL), fH - 1);
      return flowGrid[cy][cx];
    }

    // ── Particle state (typed arrays for speed)
    const px  = new Float32Array(PARTICLE_COUNT);
    const py  = new Float32Array(PARTICLE_COUNT);
    const ppx = new Float32Array(PARTICLE_COUNT); // previous position
    const ppy = new Float32Array(PARTICLE_COUNT);
    const vx  = new Float32Array(PARTICLE_COUNT);
    const vy  = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      px[i] = ppx[i] = Math.random() * TW;
      py[i] = ppy[i] = Math.random() * TH;
    }

    // ── Line geometry: 2 vertices per particle (prev → current)
    const posBuf = new Float32Array(PARTICLE_COUNT * 6);
    const geo    = new THREE.BufferGeometry();
    const attr   = new THREE.BufferAttribute(posBuf, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", attr);
    // Bypass frustum culling — we update positions manually
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);

    const mat = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: LINE_OPACITY,
      depthTest: false,
    });

    const lineSegments = new THREE.LineSegments(geo, mat);
    lineSegments.frustumCulled = false;
    scene.add(lineSegments);

    // ── Clear canvas to background once before accumulation starts
    renderer.clear();

    // ── Main loop
    let rafId: number;

    function animate() {
      rafId = requestAnimationFrame(animate);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const f = getFlow(px[i], py[i]);

        // Store previous position
        ppx[i] = px[i];
        ppy[i] = py[i];

        // acc = flow * 3;  vel = normalize(vel + acc) * 2.2
        let nvx = vx[i] + f.x * 3;
        let nvy = vy[i] + f.y * 3;
        const spd = Math.sqrt(nvx * nvx + nvy * nvy) || 1;
        vx[i] = (nvx / spd) * 2.2;
        vy[i] = (nvy / spd) * 2.2;

        // Wrap position within the padded world
        px[i] = mod(px[i] + vx[i], TW);
        py[i] = mod(py[i] + vy[i], TH);

        // Write line segment (skip if wrap-around jump)
        const base = i * 6;
        const ddx  = px[i] - ppx[i];
        const ddy  = py[i] - ppy[i];

        if (ddx * ddx + ddy * ddy < 100) {
          // Translate from padded world-space to screen-space
          posBuf[base]     = ppx[i] - OFFSET;
          posBuf[base + 1] = ppy[i] - OFFSET;
          posBuf[base + 2] = 0;
          posBuf[base + 3] = px[i]  - OFFSET;
          posBuf[base + 4] = py[i]  - OFFSET;
          posBuf[base + 5] = 0;
        } else {
          // Degenerate off-screen segment — effectively invisible
          posBuf[base] = posBuf[base + 3] = -1e6;
          posBuf[base + 1] = posBuf[base + 4] = -1e6;
          posBuf[base + 2] = posBuf[base + 5] = 0;
        }
      }

      attr.needsUpdate = true;
      renderer.render(scene, camera);
    }

    animate();

    // ── Theme change watcher
    // Covers both class-based themes (Tailwind dark:, Next-Themes, etc.)
    // and OS-level prefers-color-scheme changes.
    function applyThemeColors() {
      const newBg   = cssVarToColor(bgColorVar);
      const newLine = cssVarToColor(lineColorVar);
      renderer.setClearColor(newBg, 1);
      mat.color.copy(newLine);
      // Clear the accumulated buffer so old-color trails don't persist
      renderer.clear();
    }

    // Watch for class/attribute changes on <html> (Next-Themes writes data-theme / class)
    const observer = new MutationObserver(applyThemeColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });

    // Watch for OS-level preference flip
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", applyThemeColors);

    // ── Resize — accumulated buffer is lost but effect restarts cleanly
    const onResize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.right  = el.clientWidth;
      camera.top    = el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.clear();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      mq.removeEventListener("change", applyThemeColors);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [lineColorVar, bgColorVar]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        overflow: "hidden",
      }}
    />
  );
}