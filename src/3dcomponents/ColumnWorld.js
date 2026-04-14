import * as THREE from 'three';

/**
 * ColumnWorld — a field of instanced columns that rise and fall
 * in harmonic wave patterns.
 *
 * Uses THREE.InstancedMesh for GPU-friendly rendering of thousands
 * of columns. Inspired by threejs.org/examples/webgl_instancing_dynamic.
 *
 * ─── Quick start ──────────────────────────────────────────────
 *
 *   const world = new ColumnWorld(scene, {
 *       gridX: 40, gridZ: 40,
 *       palette: ['#4f46e5', '#7c3aed', '#2563eb'],
 *   });
 *   // call every frame or on gsap ticker:
 *   world.update(elapsedSeconds);
 *
 * ─── Dance patterns ──────────────────────────────────────────
 *
 *   world.setDance({
 *       mode:       'radial',   // 'radial' | 'wave' | 'spiral' | 'ripple'
 *       frequency:  0.8,        // oscillation speed
 *       magnitude:  4.0,        // peak displacement
 *       wavelength: 12.0,       // spatial period of the wave
 *       phase:      0,          // initial phase offset
 *   });
 *
 * ─── Mutation helpers ────────────────────────────────────────
 *
 *   world.setPalette(['#f43f5e', '#8b5cf6', '--brand-accent']);
 *   world.setColumnSize({ baseWidth: 0.6, baseHeight: 1.0, heightVariance: 2.5 });
 *   world.setColorShift({ hue: 40, saturation: 0.1, lightness: 0.2 });
 *   world.rebuild();   // regenerates the grid after size/count changes
 *
 * ─── CSS variable palette ───────────────────────────────────
 *
 * Palette entries can reference CSS custom properties:
 *
 *   world.setPalette([
 *       '--brand-primary',
 *       'var(--brand-secondary)',
 *       'var(--accent, #ff6600)',    // with fallback
 *       '#4f46e5',                   // plain hex still works
 *   ]);
 *
 * After changing a CSS variable (e.g. toggling a theme), call:
 *
 *   world.syncPalette();
 *
 * ─── Color shift ────────────────────────────────────────────
 *
 * Each column's color is derived from its palette base color, then
 * shifted in HSL space proportionally to how "risen" it is (0 at
 * rest, 1 at full peak).
 *
 *   world.setColorShift({ hue: 40, saturation: 0.1, lightness: 0.25 });
 *
 * Or set it inline in the dance config:
 *
 *   world.setDance({
 *       colorShift: { hue: -30, saturation: -0.1, lightness: 0.05 },
 *   });
 *
 * ─── Mouse interaction ─────────────────────────────────────
 *
 * Columns near the cursor rise proportionally to distance, like
 * a gravity well. Uses a smooth quadratic falloff: (1 − d²/r²)².
 *
 *   const world = new ColumnWorld(scene, {
 *       mouse: { enabled: true, magnitude: 8, radius: 40 },
 *   });
 *
 * Or enable later:
 *
 *   world.enableMouse();
 *   world.setMouseEffect({ magnitude: 8, radius: 40 });
 *
 * GSAP-animate the effect away during scroll:
 *
 *   gsap.to(world._mouse, { magnitude: 0, duration: 1 });
 */

// ─── Dance-mode wave functions ────────────────────────────────────────────────

const DANCE_MODES = {
    /**
     * Concentric circles emanating from center.
     */
    radial(col, _row, cx, cz, x, z, t, freq, wl) {
        const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
        return Math.sin(dist / wl * Math.PI * 2 - t * freq * Math.PI * 2);
    },

    /**
     * Plane wave sweeping along X.
     */
    wave(_col, _row, _cx, _cz, x, _z, t, freq, wl) {
        return Math.sin(x / wl * Math.PI * 2 - t * freq * Math.PI * 2);
    },

    /**
     * Rotating wave — the crest spirals around the center.
     */
    spiral(_col, _row, cx, cz, x, z, t, freq, wl) {
        const dist  = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
        const angle = Math.atan2(z - cz, x - cx);
        return Math.sin(dist / wl * Math.PI * 2 + angle - t * freq * Math.PI * 2);
    },

    /**
     * Multiple concentric ripples with decay.
     */
    ripple(_col, _row, cx, cz, x, z, t, freq, wl) {
        const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
        const decay = 1 / (1 + dist * 0.08);
        return Math.sin(dist / wl * Math.PI * 2 - t * freq * Math.PI * 2) * decay
             + Math.sin(dist / (wl * 0.5) * Math.PI * 2 + t * freq * 1.3 * Math.PI * 2) * decay * 0.4;
    },
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

// Pre-allocated objects for the mouse raycast — avoids GC in the hot loop
const _rayOrigin = new THREE.Vector3();
const _rayDir    = new THREE.Vector3();
const _mouseHit  = new THREE.Vector3();

const DEFAULT_OPTS = {
    // Grid
    gridX:    40,
    gridZ:    40,
    spacing:  1.4,
    rowShift: 0,        // X offset applied to odd rows   (brick-wall stagger)
    colShift: 0,        // Z offset applied to odd columns

    // Column geometry
    baseWidth:      0.5,
    widthVariance:  0,       // random per-column width added to baseWidth
    baseHeight:     1.0,
    heightVariance: 2.0,     // random per-column height added to baseHeight

    // Colors — any CSS-parseable string
    palette: ['#4f46e5', '#7c3aed', '#2563eb', '#0ea5e9'],

    // Dance defaults
    dance: {
        mode:       'radial',
        frequency:  0.5,
        magnitude:  3.0,
        wavelength: 10.0,
        phase:      0,

        // HSLA shift applied proportionally to wave intensity (0 → 1).
        // Each value is the *delta* added at full rise.
        //   hue:        degrees (-360 … 360)
        //   saturation: absolute shift (-1 … 1)
        //   lightness:  absolute shift (-1 … 1)
        colorShift: { hue: 0, saturation: 0, lightness: 0 },
    },

    // World positioning
    position: { x: 0, y: -8, z: -10 },
    rotation: { x: 0, y: 0, z: 0 },

    // Mouse interaction — gravity-like column rise near cursor
    mouse: {
        enabled:   false,
        magnitude: 5.0,       // max additional height at cursor position
        radius:    30.0,      // world-space radius of influence
    },
};

// ─── Class ────────────────────────────────────────────────────────────────────

export class ColumnWorld {
    /**
     * @param {THREE.Scene}  scene
     * @param {object}       [opts]  see DEFAULT_OPTS
     */
    constructor(scene, opts = {}) {
        // Accept either a raw THREE.Scene or a ChevronScene wrapper
        this._scene = scene.scene instanceof THREE.Scene ? scene.scene : scene;

        // Store camera + mount element for mouse → world projection
        this._camera  = scene.camera   ?? null;
        this._mountEl = scene._mountEl ?? null;

        this._topLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this._topLight.position.set(0, 100, 50);
        this._scene.add(this._topLight);

        this._opts  = _deepMerge(structuredClone(DEFAULT_OPTS), opts);
        this._dance = { ...this._opts.dance };

        /** Root group so the whole world can be moved / rotated easily. */
        this.root = new THREE.Group();
        this.root.position.set(this._opts.position.x, this._opts.position.y, this._opts.position.z);
        this.root.rotation.set(this._opts.rotation.x, this._opts.rotation.y, this._opts.rotation.z);
        this._scene.add(this.root);

        // Per-instance data populated during build
        this._baseHeights   = null;  // Float32Array
        this._worldPositions = null; // { x, z }[]
        this._colorIndices  = null;  // Uint8Array

        this._mesh     = null;
        this._count    = 0;     // set by _build(); used by update() to avoid race with debounced rebuild
        this._dummy    = new THREE.Object3D();

        // ── Mouse interaction state ──
        this._mouse       = { ...this._opts.mouse };
        this._mouseNDC    = new THREE.Vector2();
        this._mouseActive = false;

        /** Multiplier for column positions (1 = normal, 0 = collapsed). Tween with GSAP. */
        this.spacingMult = 1.0;

        this._onMouseMove = (e) => {
            const rect = this._mountEl?.getBoundingClientRect();
            const w = rect?.width  ?? window.innerWidth;
            const h = rect?.height ?? window.innerHeight;
            const l = rect?.left   ?? 0;
            const t = rect?.top    ?? 0;
            this._mouseNDC.x =  ((e.clientX - l) / w) * 2 - 1;
            this._mouseNDC.y = -((e.clientY - t) / h) * 2 + 1;
            this._mouseActive = true;
        };
        this._onMouseLeave = () => { this._mouseActive = false; };

        if (this._mouse.enabled) this.enableMouse();

        // Palette entries may be hex, CSS color names, or CSS variable refs
        // like '--brand-1' or 'var(--brand-1)'. Store originals for re-sync.
        this._paletteRaw = this._opts.palette.slice();
        this._colors   = this._paletteRaw.map(c => new THREE.Color(_resolveCSSColor(c)));
        this._baseHSLs = this._colors.map(c => { const hsl = {}; c.getHSL(hsl); return hsl; });
        this._tmpColor = new THREE.Color();
        this._tmpHSL   = { h: 0, s: 0, l: 0 };

        this._build();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Advance the dance animation.
     * Call once per frame with the elapsed time in **seconds**.
     * @param {number} t  elapsed seconds (e.g. from a clock or gsap ticker)
     */
    update(t) {
        if (!this._mesh) return;

        const { mode, frequency, magnitude, wavelength, phase, colorShift } = this._dance;
        const waveFn = DANCE_MODES[mode] ?? DANCE_MODES.radial;

        // Use build-time snapshots — opts may already reflect a pending
        // (debounced) rebuild whose arrays haven't been allocated yet.
        const count   = this._count;
        const gridX   = this._builtGridX;
        const centerX = this._builtCenterX;
        const centerZ = this._builtCenterZ;
        const tShifted = t + phase;

        const hasColorShift = colorShift
            && (colorShift.hue !== 0 || colorShift.saturation !== 0 || colorShift.lightness !== 0);

        // ── Mouse → grid-local raycast (once per frame, before the loop) ──
        let hasMouse = false;
        let mouseLocalX = 0, mouseLocalZ = 0, mouseR2 = 0, mouseMag = 0;

        if (this._mouse.enabled && this._mouseActive
            && this._mouse.magnitude > 0 && this._camera) {

            const cam = this._camera;
            cam.updateMatrixWorld();

            // Ray origin + direction through mouse NDC
            _rayOrigin.setFromMatrixPosition(cam.matrixWorld);
            _rayDir.set(this._mouseNDC.x, this._mouseNDC.y, 0.5)
                .unproject(cam)
                .sub(_rayOrigin)
                .normalize();

            // Intersect with the XZ plane at the column tops.
            // Using root Y + average base height so the mouse "lands" on
            // the visible surface rather than the hidden base.
            const avgH = (this._opts.baseHeight + this._opts.heightVariance * 0.5);
            const planeY = this.root.position.y + avgH;
            const denom  = _rayDir.y;
            if (Math.abs(denom) > 1e-6) {
                const tRay = (planeY - _rayOrigin.y) / denom;
                if (tRay > 0) {
                    // World-space hit point
                    _mouseHit.copy(_rayOrigin).addScaledVector(_rayDir, tRay);

                    // Transform to mesh-local space so we can compare
                    // directly against _worldPositions[i]
                    this._mesh.updateWorldMatrix(true, false);
                    this._mesh.worldToLocal(_mouseHit);

                    mouseLocalX = _mouseHit.x;
                    mouseLocalZ = _mouseHit.z;
                    mouseR2     = this._mouse.radius * this._mouse.radius;
                    mouseMag    = this._mouse.magnitude;
                    hasMouse    = true;
                }
            }
        }

        // ── Per-column loop ───────────────────────────────────────────────
        const sm = this.spacingMult;
        if (sm < 0.99) console.log('spacingMult:', sm);

        for (let i = 0; i < count; i++) {
            const col = i % gridX;
            const row = Math.floor(i / gridX);
            const { x, z } = this._worldPositions[i];
            const baseH = this._baseHeights[i];

            // Dance wave
            const wave = waveFn(col, row, centerX, centerZ, x, z, tShifted, frequency, wavelength);
            const rise = Math.max(0, wave);

            // Mouse gravity — smooth quadratic falloff: (1 - d²/r²)²
            let mouseBoost =  0;
            if (hasMouse) {
                const dx = x - mouseLocalX;
                const dz = z - mouseLocalZ;
                const d2 = dx * dx + dz * dz;
                if (d2 < mouseR2) {
                    const falloff = 1 - d2 / mouseR2;
                    mouseBoost = mouseMag * falloff * falloff;
                }
            }

            const heightY = baseH + magnitude * rise + mouseBoost;
            const w       = this._baseWidths[i];

            // Scale position toward grid center (sm=1: normal, sm=0: all stacked)
            const px = centerX + (x - centerX) * sm;
            const pz = centerZ + (z - centerZ) * sm;

            // ── Transform ──
            this._dummy.position.set(px, heightY * 0.5, pz);
            this._dummy.scale.set(w, heightY, w);
            this._dummy.updateMatrix();
            this._mesh.setMatrixAt(i, this._dummy.matrix);

            // ── Color shift ──
            if (hasColorShift) {
                const ci  = this._colorIndices[i];
                const base = this._baseHSLs[ci];

                const totalRise = Math.min(1, rise + (hasMouse ? mouseBoost / (mouseMag || 1) : 0));
                const h = (base.h + (colorShift.hue / 360) * totalRise) % 1;
                const s = _clamp01(base.s + colorShift.saturation * totalRise);
                const l = _clamp01(base.l + colorShift.lightness  * totalRise);

                this._tmpColor.setHSL(h < 0 ? h + 1 : h, s, l);
                this._mesh.setColorAt(i, this._tmpColor);
            }
        }

        this._mesh.instanceMatrix.needsUpdate = true;
        if (hasColorShift) {
            this._mesh.instanceColor.needsUpdate = true;
        }

        
    }

    // ── Mutation: dance ───────────────────────────────────────────────────────

    /**
     * Merge new dance parameters.
     * @param {object} params  any subset of { mode, frequency, magnitude, wavelength, phase }
     */
    setDance(params) {
        Object.assign(this._dance, params);
    }

    /** Get the current dance configuration (read-only copy). */
    getDance() { return { ...this._dance, colorShift: { ...this._dance.colorShift } }; }

    /**
     * Shorthand for updating just the color-shift portion of the dance.
     *
     * @param {object} shift
     * @param {number} [shift.hue]         degrees to rotate at peak rise (-360 … 360)
     * @param {number} [shift.saturation]  absolute delta at peak rise   (-1 … 1)
     * @param {number} [shift.lightness]   absolute delta at peak rise   (-1 … 1)
     *
     * @example
     * // Columns glow brighter and shift 40° toward warm tones at peak
     * world.setColorShift({ hue: 40, saturation: 0.1, lightness: 0.2 });
     *
     * // Cool, desaturated peaks
     * world.setColorShift({ hue: -30, saturation: -0.15, lightness: 0.05 });
     *
     * // Reset to no shift
     * world.setColorShift({ hue: 0, saturation: 0, lightness: 0 });
     */
    setColorShift(shift) {
        this._dance.colorShift = { ...this._dance.colorShift, ...shift };
    }

    // ── Mutation: mouse ───────────────────────────────────────────────────────

    /**
     * Merge new mouse-interaction parameters (live, no rebuild).
     *
     * @param {object} params
     * @param {number} [params.magnitude]  max height boost at cursor
     * @param {number} [params.radius]     world-space radius of influence
     *
     * @example
     * world.setMouseEffect({ magnitude: 8, radius: 50 });
     *
     * // Tween it down during scroll-out:
     * gsap.to(world._mouse, { magnitude: 0, radius: 0, duration: 1 });
     */
    setMouseEffect(params) {
        Object.assign(this._mouse, params);
    }

    /** Current mouse config (read-only copy). */
    getMouseEffect() { return { ...this._mouse }; }

    /** Start listening for mouse events. */
    enableMouse() {
        if (this._mouseListening) return;
        this._mouse.enabled = true;
        this._mouseListening = true;
        window.addEventListener('mousemove',  this._onMouseMove);
        window.addEventListener('mouseleave', this._onMouseLeave);
    }

    /** Stop listening and clear mouse state. */
    disableMouse() {
        this._mouse.enabled = false;
        this._mouseActive   = false;
        this._mouseListening = false;
        window.removeEventListener('mousemove',  this._onMouseMove);
        window.removeEventListener('mouseleave', this._onMouseLeave);
    }

    // ── Viewport helpers ──────────────────────────────────────────────────────

    /**
     * Calculate the world-space Y position of the viewport's bottom edge
     * at a given Z depth. Useful for positioning the column grid so its
     * front row is just barely visible.
     *
     * @param {number} [z]  world Z depth (defaults to root.position.z)
     * @returns {number}    world Y at the bottom of the viewport
     *
     * @example
     * const bottomY = columns.getViewportBottomY();
     * columns.root.position.y = bottomY - columnTopHeight;
     */
    getViewportBottomY(z) {
        const cam = this._camera;
        if (!cam) return 0;
        cam.updateMatrixWorld();
        cam.updateProjectionMatrix();
        const depth = cam.position.z - (z ?? this.root.position.z);
        const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * depth;
        return cam.position.y - halfH;
    }

    // ── Mutation: colors ──────────────────────────────────────────────────────

    /**
     * Replace the colour palette and re-paint all columns.
     *
     * Entries can be any CSS colour **or** a CSS custom property reference:
     *   - '#ff6600'
     *   - 'rebeccapurple'
     *   - '--brand-primary'          (shorthand)
     *   - 'var(--brand-primary)'     (standard CSS syntax)
     *
     * Call syncPalette() later to re-read the CSS variables (e.g. after
     * toggling a theme class on <html>).
     *
     * @param {string[]} palette
     */
    setPalette(palette) {
        this._paletteRaw = palette.slice();
        this._opts.palette = palette;
        this._colors  = palette.map(c => new THREE.Color(_resolveCSSColor(c)));
        this._baseHSLs = this._colors.map(c => { const hsl = {}; c.getHSL(hsl); return hsl; });
        this._applyColors();
    }

    /**
     * Re-read CSS variables in the palette and repaint.
     * Call this after changing a CSS custom property that the palette references.
     *
     * @example
     * document.documentElement.style.setProperty('--brand-1', '#ff0000');
     * columns.syncPalette();
     */
    syncPalette() {
        this._colors  = this._paletteRaw.map(c => new THREE.Color(_resolveCSSColor(c)));
        this._baseHSLs = this._colors.map(c => { const hsl = {}; c.getHSL(hsl); return hsl; });
        this._applyColors();
    }

    /** Return current palette as hex strings. */
    getPalette() { return this._opts.palette.slice(); }

    // ── Mutation: geometry ────────────────────────────────────────────────────

    /**
     * Change column sizing.  Call rebuild() afterwards.
     * @param {object} params  { baseWidth, baseHeight, heightVariance }
     */
    setColumnSize(params) {
        Object.assign(this._opts, params);
    }

    /**
     * Change grid dimensions.  Call rebuild() afterwards.
     * @param {number} gridX
     * @param {number} gridZ
     * @param {number} [spacing]
     */
    setGrid(gridX, gridZ, spacing) {
        this._opts.gridX = gridX;
        this._opts.gridZ = gridZ;
        if (spacing !== undefined) this._opts.spacing = spacing;
    }

    /**
     * Tear down the current mesh and rebuild from scratch.
     * Needed after setColumnSize() or setGrid().
     */
    rebuild() {
        this._dispose();
        this._build();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    dispose() {
        this.disableMouse();
        this._dispose();
        this._scene.remove(this.root);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    /** @private */
    _build() {
        const { gridX, gridZ, spacing, rowShift, colShift, baseWidth, widthVariance, baseHeight, heightVariance } = this._opts;
        const count = gridX * gridZ;
        this._count       = count;
        this._builtGridX  = gridX;
        this._builtCenterX = (gridX - 1) * spacing * 0.5;
        this._builtCenterZ = (gridZ - 1) * spacing * 0.5;

        // — Geometry: unit box, scaled per-instance for width + height variance
        const geo = new THREE.BoxGeometry(1, 1, 1);
        // shift origin so Y-scaling goes upward from Y=0
        geo.translate(0, 0.5, 0);

        // — Material
        const mat = new THREE.MeshStandardMaterial({
            roughness: 0.55,
            metalness: 0.25,
            flatShading: true,
        });

        // — InstancedMesh
        this._mesh = new THREE.InstancedMesh(geo, mat, count);
        this._mesh.castShadow    = true;
        this._mesh.receiveShadow = true;

        // — Per-instance data
        this._baseHeights    = new Float32Array(count);
        this._baseWidths     = new Float32Array(count);
        this._worldPositions = new Array(count);
        this._colorIndices   = new Uint8Array(count);

        for (let i = 0; i < count; i++) {
            const col = i % gridX;
            const row = Math.floor(i / gridX);

            const x = col * spacing + (row % 2) * rowShift;
            const z = row * spacing + (col % 2) * colShift;

            this._worldPositions[i] = { x, z };
            this._baseHeights[i]    = baseHeight + Math.random() * heightVariance;
            this._baseWidths[i]     = baseWidth  + Math.random() * widthVariance;
            this._colorIndices[i]   = Math.floor(Math.random() * this._colors.length);

            // Initial matrix (will be overwritten on first update)
            const h = this._baseHeights[i];
            const w = this._baseWidths[i];
            this._dummy.position.set(x, h * 0.5, z);
            this._dummy.scale.set(w, h, w);
            this._dummy.updateMatrix();
            this._mesh.setMatrixAt(i, this._dummy.matrix);
        }

        // Center the grid on the root's origin
        const offsetX = (gridX - 1) * spacing * 0.5;
        const offsetZ = (gridZ - 1) * spacing * 0.5;
        this._mesh.position.set(-offsetX, 0, -offsetZ);

        this._applyColors();
        this.root.add(this._mesh);
    }

    /** @private */
    _applyColors() {
        if (!this._mesh) return;
        const count = this._count;
        for (let i = 0; i < count; i++) {
            // Re-roll index if palette shrank
            if (this._colorIndices[i] >= this._colors.length) {
                this._colorIndices[i] = Math.floor(Math.random() * this._colors.length);
            }
            this._mesh.setColorAt(i, this._colors[this._colorIndices[i]]);
        }
        this._mesh.instanceColor.needsUpdate = true;
    }

    /** @private */
    _dispose() {
        if (!this._mesh) return;
        this._mesh.geometry.dispose();
        this._mesh.material.dispose();
        this.root.remove(this._mesh);
        this._mesh = null;
    }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function _clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

/**
 * Resolve a palette entry to a concrete CSS colour string.
 *
 * Accepted formats:
 *   '#4f46e5'               → returned as-is
 *   'rebeccapurple'         → returned as-is
 *   '--brand-primary'       → reads getComputedStyle(documentElement)
 *   'var(--brand-primary)'  → strips var() wrapper, then reads
 *
 * Falls back to '#ff00ff' (magenta) if the variable is empty/missing,
 * so broken references are easy to spot.
 */
function _resolveCSSColor(entry) {
    if (typeof entry !== 'string') return '#ff00ff';

    let varName = null;

    // 'var(--foo)' or 'var(--foo, fallback)'
    const varMatch = entry.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\s*\)$/);
    if (varMatch) {
        varName = varMatch[1];
    }
    // bare '--foo'
    else if (entry.startsWith('--')) {
        varName = entry;
    }

    if (!varName) return entry;   // plain colour — pass through

    const computed = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();

    if (computed) return computed;

    // Try fallback from var(--x, fallback)
    if (varMatch && varMatch[2]) return varMatch[2].trim();

    return '#ff00ff';   // magenta = missing variable
}

function _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (
            source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
            && target[key] && typeof target[key] === 'object'
        ) {
            _deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}