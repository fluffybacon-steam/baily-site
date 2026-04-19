import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Column — a single placeable column with an optional per-instance
 * mouse-hover effect.
 *
 * Unlike the old ColumnWorld (instanced grid + dance waves), each Column
 * is its own mesh that you position freely in the scene. This trades raw
 * instance count for creative control — place them sporadically, give
 * each one a unique hover behaviour, animate them independently with GSAP.
 *
 * ─── Quick start ──────────────────────────────────────────────
 *
 *   const col = new Column({
 *       width: 0.6, height: 3, depth: 0.6,
 *       color: '#4f46e5',
 *       camera, mountEl,
 *   });
 *   scene.add(col.root);
 *   col.root.position.set(5, 0, -2);
 *
 *   // call every frame:
 *   col.update(elapsedSeconds);
 *
 * ─── Mouse effect ─────────────────────────────────────────────
 *
 * Pass a callback that receives the hover intensity (0 → 1, quadratic
 * falloff) and a reference to the column. The callback fires every
 * frame while the mouse is tracked, so it can drive continuous
 * animations, GSAP tweens, colour shifts — anything.
 *
 *   const col = new Column({
 *       ...,
 *       mouse: {
 *           radius: 25,
 *           effect(intensity, column, time) {
 *               column.mesh.scale.y = column.baseHeight + intensity * 6;
 *           },
 *       },
 *   });
 *
 * Each column can have a completely different effect:
 *
 *   // Glow on hover
 *   effect(i, col) {
 *       col.material.emissiveIntensity = i * 0.8;
 *   }
 *
 *   // Wobble
 *   effect(i, col, t) {
 *       col.root.rotation.z = Math.sin(t * 4) * i * 0.15;
 *   }
 *
 *   // Color shift
 *   effect(i, col) {
 *       col.material.color.lerpColors(col._restColor, col._hoverColor, i);
 *   }
 *
 * Change the effect at runtime:
 *
 *   col.setMouseEffect((i, c) => { c.mesh.scale.y = c.baseHeight + i * 10; }, 40);
 *
 * ─── GSAP integration ────────────────────────────────────────
 *
 * Position, rotation, and scale live on col.root (THREE.Group) and
 * col.mesh, so GSAP can tween them directly:
 *
 *   gsap.to(col.root.position, { y: 5, duration: 1 });
 *   gsap.to(col.mesh.scale,    { y: 8, duration: 0.6 });
 *   gsap.to(col.material.color, { r: 1, g: 0, b: 0 });
 *
 * The `height`, `width`, `depth` setters update mesh.scale and the
 * stored base dimensions, so they're also GSAP-friendly via a proxy:
 *
 *   gsap.to(col, { height: 10, duration: 1 });
 */

// ─── Shared mouse state ──────────────────────────────────────────────────────
// All Column instances share a single mousemove listener. Each column
// converts the raw clientX/Y to its own NDC using its own mountEl.

const _sharedMouse = {
    clientX: 0,
    clientY: 0,
    active:  false,
    refCount: 0,
    moveHandler:  null,
    leaveHandler: null,
};

// Pre-allocated objects — avoids GC in the per-frame update loop
const _rayOrigin = new THREE.Vector3();
const _rayDir    = new THREE.Vector3();
const _hit       = new THREE.Vector3();
const _worldPos  = new THREE.Vector3();

// ─── Class ────────────────────────────────────────────────────────────────────

export class Column {
    /**
     * @param {object}              opts
     * @param {number}              [opts.width=0.5]
     * @param {number}              [opts.height=2]
     * @param {number}              [opts.depth=0.5]
     * @param {string|THREE.Color}  [opts.color='#4f46e5']
     * @param {number}              [opts.roughness=0.55]
     * @param {number}              [opts.metalness=0.25]
     * @param {boolean}             [opts.flatShading=true]
     * @param {THREE.Camera}        opts.camera       required for mouse effect
     * @param {HTMLElement}         opts.mountEl      canvas container
     * @param {object}              [opts.mouse]
     * @param {number}              [opts.mouse.radius=30]    world-space radius
     * @param {Function}            [opts.mouse.effect]       (intensity, column, time) => void
     */
    constructor({
        width       = 0.5,
        height      = 2.0,
        depth       = 0.5,
        color       = '#4f46e5',
        roughness   = 0.55,
        metalness   = 0.25,
        flatShading = true,
        camera      = null,
        mountEl     = null,
        mouse       = null,
    } = {}) {
        this._camera  = camera;
        this._mountEl = mountEl;

        // ── Geometry — origin at base so Y-scaling grows upward ──
        const geo = new THREE.BoxGeometry(1, 1, 1);
        geo.translate(0, 0.5, 0);

        this.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness,
            metalness,
            flatShading,
        });

        this.mesh = new THREE.Mesh(geo, this.material);

        /** Root group — position / rotate the column in world space. */
        this.root = new THREE.Group();
        this.root.add(this.mesh);

        // Base dimensions — mouse effects read these to know "rest" size
        this._baseWidth  = width;
        this._baseHeight = height;
        this._baseDepth  = depth;
        this.mesh.scale.set(width, height, depth);

        // ── Mouse ──
        this._mouseRadius  = mouse?.radius ?? 30;
        this._mouseEffect  = mouse?.effect ?? null;
        this._mouseEnabled = false;
        this._lastIntensity = 0;

        if (this._mouseEffect) this._enableMouse();
    }

    // ── Per-frame update ──────────────────────────────────────────────────────

    /**
     * Advance the column's mouse-hover logic.
     * Call once per frame with elapsed seconds.
     *
     * @param {number} t  elapsed time in seconds
     */
    update(t) {
        if (!this._mouseEffect || !this._mouseEnabled) return;

        const cam = this._camera;
        if (!cam) return;

        // If mouse left the viewport, send one final intensity=0 then idle
        if (!_sharedMouse.active) {
            if (this._lastIntensity !== 0) {
                this._lastIntensity = 0;
                this._mouseEffect(0, this, t);
            }
            return;
        }

        // ── NDC from raw client coords, using this column's mountEl ──
        const rect = this._mountEl?.getBoundingClientRect();
        const w = rect?.width  ?? window.innerWidth;
        const h = rect?.height ?? window.innerHeight;
        const l = rect?.left   ?? 0;
        const top = rect?.top  ?? 0;

        const ndcX =  ((_sharedMouse.clientX - l) / w) * 2 - 1;
        const ndcY = -((_sharedMouse.clientY - top) / h) * 2 + 1;

        // ── Ray → XZ plane intersection ──
        cam.updateMatrixWorld();

        _rayOrigin.setFromMatrixPosition(cam.matrixWorld);
        _rayDir.set(ndcX, ndcY, 0.5)
            .unproject(cam)
            .sub(_rayOrigin)
            .normalize();

        this.root.getWorldPosition(_worldPos);
        const planeY = _worldPos.y + this._baseHeight * 0.5;

        const denom = _rayDir.y;
        if (Math.abs(denom) < 1e-6) {
            this._callEffect(0, t);
            return;
        }

        const tRay = (planeY - _rayOrigin.y) / denom;
        if (tRay <= 0) {
            this._callEffect(0, t);
            return;
        }

        _hit.copy(_rayOrigin).addScaledVector(_rayDir, tRay);

        // Distance from column center to hit point
        const dx   = _hit.x - _worldPos.x;
        const dz   = _hit.z - _worldPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const r    = this._mouseRadius;

        if (dist >= r) {
            this._callEffect(0, t);
            return;
        }

        // Smooth quadratic falloff: (1 − d²/r²)²
        const norm     = 1 - (dist * dist) / (r * r);
        const intensity = norm * norm;
        this._callEffect(intensity, t);
    }

    // ── Dimension accessors (GSAP-friendly) ───────────────────────────────────

    /** Base width — updating this changes mesh.scale.x */
    get baseWidth()  { return this._baseWidth; }
    set baseWidth(v) { this._baseWidth = v; this.mesh.scale.x = v; }

    /** Base height — updating this changes mesh.scale.y */
    get baseHeight()  { return this._baseHeight; }
    set baseHeight(v) { this._baseHeight = v; this.mesh.scale.y = v; }

    /** Base depth — updating this changes mesh.scale.z */
    get baseDepth()  { return this._baseDepth; }
    set baseDepth(v) { this._baseDepth = v; this.mesh.scale.z = v; }

    // ── Setters ───────────────────────────────────────────────────────────────

    /**
     * Set all three dimensions at once.
     * Pass `undefined` to leave a dimension unchanged.
     */
    setSize(width, height, depth) {
        if (width  !== undefined) { this._baseWidth  = width;  this.mesh.scale.x = width;  }
        if (height !== undefined) { this._baseHeight = height; this.mesh.scale.y = height; }
        if (depth  !== undefined) { this._baseDepth  = depth;  this.mesh.scale.z = depth;  }
    }

    /** Change the column's base colour. */
    setColor(color) {
        this.material.color.set(color);
    }

    /**
     * Replace or remove the mouse-hover effect at runtime.
     *
     * @param {Function|null} effect   (intensity, column, time) => void
     * @param {number}        [radius] world-space hover radius
     */
    setMouseEffect(effect, radius) {
        this._mouseEffect = effect;
        if (radius !== undefined) this._mouseRadius = radius;

        if (effect && !this._mouseEnabled)  this._enableMouse();
        if (!effect && this._mouseEnabled)  this._disableMouse();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    dispose() {
        this._disableMouse();
        gsap.killTweensOf([this.root.position, this.root.rotation, this.root.scale, this.mesh.scale]);
        this.mesh.geometry.dispose();
        this.material.dispose();
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    /** @private */
    _callEffect(intensity, t) {
        this._lastIntensity = intensity;
        this._mouseEffect(intensity, this, t);
    }

    /** @private */
    _enableMouse() {
        if (this._mouseEnabled) return;
        this._mouseEnabled = true;

        if (_sharedMouse.refCount === 0) {
            _sharedMouse.moveHandler = (e) => {
                _sharedMouse.clientX = e.clientX;
                _sharedMouse.clientY = e.clientY;
                _sharedMouse.active  = true;
            };
            _sharedMouse.leaveHandler = () => {
                _sharedMouse.active = false;
            };
            window.addEventListener('mousemove',  _sharedMouse.moveHandler);
            window.addEventListener('mouseleave', _sharedMouse.leaveHandler);
        }
        _sharedMouse.refCount++;
    }

    /** @private */
    _disableMouse() {
        if (!this._mouseEnabled) return;
        this._mouseEnabled = false;
        _sharedMouse.refCount--;

        if (_sharedMouse.refCount <= 0) {
            window.removeEventListener('mousemove',  _sharedMouse.moveHandler);
            window.removeEventListener('mouseleave', _sharedMouse.leaveHandler);
            _sharedMouse.refCount    = 0;
            _sharedMouse.active      = false;
            _sharedMouse.moveHandler  = null;
            _sharedMouse.leaveHandler = null;
        }
    }
}