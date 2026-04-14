import * as THREE from 'three';
import gsap from 'gsap';

const D2R = (d) => THREE.MathUtils.degToRad(d);

/**
 * A circular hoop (torus) that lives in a ChevronScene.
 *
 * ─── Pixel ↔ World Conversion ────────────────────────────────────────────────
 * Sizes are expressed as canvas-pixel values at a given world-space Z depth.
 * Pass the camera + mountEl from ChevronScene and the conversion is automatic.
 * Call setSize(widthPx, heightPx) whenever the hoop needs to match a DOM element.
 *
 * ─── Why not CSS clipPath? ───────────────────────────────────────────────────
 * CSS clipPath on the <canvas> element clips the *entire* canvas in 2D screen
 * space. It has no concept of which Three.js objects live inside the ring,
 * ignores 3D depth / perspective, and breaks transparent-background compositing.
 * It is not viable for per-object portal masking.
 *
 * ─── Portal Mode (Stencil Buffer) ────────────────────────────────────────────
 * The correct approach uses Three.js's stencil buffer:
 *
 *   Step 1 — enablePortal()
 *     An invisible CircleGeometry (the "stencil disc") is revealed. Its material
 *     writes stencilRef=N wherever the hole appears on screen while writing
 *     nothing to the colour or depth buffers (colorWrite: false, depthWrite: false).
 *     It renders at a lower renderOrder so it always stamps before the chevron.
 *
 *   Step 2 — clipChevron(chevron)
 *     Each arm material on the Chevron is patched:
 *       stencilFunc = THREE.EqualStencilFunc
 *       stencilRef  = N
 *     The mesh now only draws pixels where the disc already wrote N into the
 *     stencil buffer — i.e. inside the hole. The torus ring has no stencil test
 *     so it is always visible.
 *
 *   Step 3 — releaseChevron(chevron) / disablePortal()
 *     Materials are restored to their defaults (no stencil test).
 *
 * For this to work the WebGLRenderer must be created with { stencil: true }
 * (Three.js defaults to true; ChevronScene enforces it explicitly).
 *
 * ─── Hoop-through animation ───────────────────────────────────────────────────
 * For a simple "chevron flies through a hoop" animation you do NOT need portal
 * mode — just position and animate the Chevron past the Hoop's Z position with
 * GSAP. Portal mode is only needed when you want the chevron to *appear out of*
 * the hole (i.e. render inside the disc area before it physically clears the ring).
 */
export class Hoop {
    /**
     * @param {object}             opts
     * @param {number}             [opts.radiusPx=100]      ring radius in canvas-px
     * @param {number}             [opts.tubePx]            tube thickness in canvas-px
     *                                                      (defaults to ~8 % of radiusPx, min 4 px)
     * @param {number}             [opts.segments=80]       radial segments on the torus
     * @param {number}             [opts.tubeSegments=20]
     * @param {string|THREE.Color} [opts.color='#00aeef']
     * @param {number}             [opts.opacity=1]
     * @param {THREE.Camera}       [opts.camera]            required for px→world conversion
     * @param {HTMLElement}        [opts.mountEl]           canvas container
     * @param {number}             [opts.z=0]               world-space Z the hoop sits at
     * @param {number}             [opts.stencilRef=1]      stencil buffer ref (1-255, unique per portal)
     */
    constructor({
        radiusPx     = 100,
        tubePx,
        segments     = 80,
        tubeSegments = 20,
        color        = '#00aeef',
        opacity      = 1,
        camera       = null,
        mountEl      = null,
        z            = 0,
        stencilRef   = 1,
    } = {}) {
        this.camera      = camera;
        this._mountEl    = mountEl;
        this._z          = z;
        this._stencilRef = stencilRef;

        // Raw px values — kept so setSize / _rebuildGeometry can reuse them
        this._color        = color;   // stored so the DOM ring div can match
        this._radiusPx     = radiusPx;
        this._tubePx       = tubePx ?? Math.max(4, radiusPx * 0.08);
        this._segments     = segments;
        this._tubeSegments = tubeSegments;

        // ── Torus ring ────────────────────────────────────────────────────────
        this.material = new THREE.MeshBasicMaterial({
            color:       new THREE.Color(color),
            transparent: opacity < 1,
            opacity,
            side:        THREE.DoubleSide,
        });

        this._torusMesh = new THREE.Mesh(
            this._buildTorusGeo(),
            this.material,
        );

        // ── Stencil disc (portal mask) ─────────────────────────────────────────
        // Invisible — stamps stencilRef into the framebuffer wherever the disc
        // covers the screen. colorWrite/depthWrite are both false so it is truly
        // invisible; it only affects the stencil buffer.
        //
        // depthTest: false is critical. Without it the disc defaults to testing
        // against the depth buffer and gets occluded by the inner curved surface
        // of the torus tube (which sits at z=0 in group space, coplanar with the
        // disc). That leaves a tessellated ring of un-stamped pixels right along
        // the torus inner rim — exactly the "segments inside the ring" artefact.
        // With depthTest: false the disc always stamps its full area regardless
        // of what Three.js geometry happens to be in front.
        this._stencilMat = new THREE.MeshBasicMaterial({
            colorWrite:   false,
            depthWrite:   false,
            depthTest:    false,       // ← fixes the segmented-ring portal artefact
            side:         THREE.DoubleSide,
            stencilWrite: true,
            stencilFunc:  THREE.AlwaysStencilFunc,
            stencilZPass: THREE.ReplaceStencilOp,
            stencilRef:   stencilRef,
        });
        this._discMesh = new THREE.Mesh(
            this._buildDiscGeo(),
            this._stencilMat,
        );

        // Render order contract:
        //  -1  stencil disc   — stamps before everything, invisible
        //   0  chevron arms   — default Three.js renderOrder
        //   1  torus ring     — must paint AFTER the chevron so the ring
        //                       always draws on top when they are coplanar
        this._discMesh.renderOrder  = -1;
        this._torusMesh.renderOrder = 1;

        // Hidden until enablePortal() is called
        this._discMesh.visible = false;

        // ── Root group ────────────────────────────────────────────────────────
        this.root = new THREE.Group();
        this.root.add(this._discMesh, this._torusMesh);

        // Track patched chevrons so we can restore them on release / dispose
        this._clippedChevrons = new Set();
    }

    // ── Size API ───────────────────────────────────────────────────────────────

    /**
     * Resize the hoop to fit a DOM element's bounding box (or any px dimensions).
     * The ring is fitted to the *tighter* axis so it always stays circular.
     * Rebuilds geometry in place.
     *
     * @param {number} widthPx
     * @param {number} heightPx
     * @param {object} [opts]
     * @param {number} [opts.tubePx]   explicit tube thickness in px;
     *                                 defaults to 8 % of the computed radius (min 4 px)
     *
     * @example
     * const rect = document.querySelector('.target').getBoundingClientRect();
     * hoop.setSize(rect.width, rect.height);
     */
    setSize(widthPx, heightPx, { tubePx } = {}) {
        const radius = Math.min(widthPx, heightPx) / 2;
        this._radiusPx = radius;
        // Only recalculate the default tube when an explicit value is given here.
        // If the caller omitted tubePx, we preserve whatever was set at construction
        // (or via setTubePx) so that setSize() never silently resets a user-chosen value.
        if (tubePx !== undefined) this._tubePx = tubePx;
        this._rebuildGeometry();
    }

    /**
     * Set the tube thickness in canvas-pixel units and rebuild the geometry.
     * This is independent of setSize() so you can freely change one without
     * affecting the other.
     *
     * @param {number} tubePx
     *
     * @example
     * // Thin wireframe-style ring
     * hoop.setTubePx(2);
     *
     * // Chunky ring that reads well at distance
     * hoop.setTubePx(14);
     */
    setTubePx(tubePx) {
        this._tubePx = tubePx;
        this._rebuildGeometry();
    }

    /**
     * Resize using an explicit pixel radius (and optionally a tube thickness).
     * @param {number} radiusPx
     * @param {number} [tubePx]
     */
    setRadiusPx(radiusPx, tubePx) {
        this._radiusPx = radiusPx;
        if (tubePx !== undefined) this._tubePx = tubePx;
        this._rebuildGeometry();
    }

    /**
     * Change the world-space Z this hoop sits at.
     * Also recalculates geometry because depth affects the px→world scale.
     * @param {number} z
     */
    setDepth(z) {
        this._z = z;
        this._rebuildGeometry();
        this.root.position.z = z;
    }

    // ── Portal mode ────────────────────────────────────────────────────────────

    /**
     * Activate the invisible stencil disc, enabling this hoop to act as a portal.
     * After calling this, use clipChevron(chevron) to restrict a Chevron to the
     * hole area (i.e. it only appears to emerge from inside the ring).
     */
    enablePortal() {
        this._discMesh.visible = true;
    }

    /** Deactivate portal mode and release all patched chevrons. */
    disablePortal() {
        this._discMesh.visible = false;
        for (const chevron of this._clippedChevrons) {
            this._restoreChevronMaterials(chevron);
        }
        this._clippedChevrons.clear();
    }

    /**
     * Patch a Chevron's arm materials so it **only renders inside this portal**.
     * Requires enablePortal() to have been called.
     *
     * Each arm material gets:
     *   stencilFunc = THREE.EqualStencilFunc
     *   stencilRef  = this._stencilRef
     *
     * @param {import('./Chevron').Chevron} chevron
     *
     * @example
     * hoop.enablePortal();
     * hoop.clipChevron(chevron);
     * gsap.to(chevron.root.position, { z: 5, duration: 1.2, ease: 'power2.out' });
     * // chevron emerges from the portal hole
     */
    clipChevron(chevron) {
        if (!this._discMesh.visible) {
            console.warn('Hoop.clipChevron: call enablePortal() first — stencil disc is inactive.');
        }
        const ref = this._stencilRef;
        for (const mat of [chevron.material1, chevron.material2]) {
            mat.stencilWrite = true;               // ← must be true to enable the TEST
            mat.stencilFunc  = THREE.EqualStencilFunc;
            mat.stencilRef   = ref;
            mat.stencilFail  = THREE.KeepStencilOp;  // don't modify buffer on fail
            mat.stencilZFail = THREE.KeepStencilOp;  // don't modify buffer on z-fail
            mat.stencilZPass = THREE.KeepStencilOp;  // don't modify buffer on pass
            mat.needsUpdate  = true;
        }
        this._clippedChevrons.add(chevron);
    }

    getInnerRadiusPx() {
        const center = this._projectToCanvas();
        const innerWorldR = this._pxToWorld(this._radiusPx) - this._pxToWorld(this._tubePx);
        const pt = new THREE.Vector3(
            this.root.position.x + innerWorldR,
            this.root.position.y,
            this.root.position.z
        ).project(this.camera);
        const w = this._mountEl?.getBoundingClientRect().width ?? window.innerWidth;
        return Math.floor(Math.abs((pt.x + 1) / 2 * w - center.x));
    }

    /**
     * Restore a Chevron's materials to their default state (no stencil test).
     * @param {import('./Chevron').Chevron} chevron
     */
    releaseChevron(chevron) {
        this._restoreChevronMaterials(chevron);
        this._clippedChevrons.delete(chevron);
    }

    // ── Canvas clip mode ──────────────────────────────────────────────────────

    /**
     * Clip the renderer canvas to a circle at this hoop's screen position so
     * the chevron appears to emerge from the hole as it slides through.
     *
     * The clip stays active until disableCanvasClip() is called — wire that to
     * onStart of the exit tween (when the chevron crosses the hoop center).
     *
     * @param {HTMLCanvasElement}                    canvas     scene.renderer.domElement
     * @param {'left'|'right'|'top'|'bottom'}       [direction='left']
     *   Which side the chevron enters FROM. Does not change the clip shape —
     *   it's always a circle — but is stored so getEntryWorldPosition /
     *   getExitWorldPosition can return the correct offset positions.
     *
     * @example — left-to-right
     * const canvas = scene.renderer.domElement;
     * hoop.enableCanvasClip(canvas, 'left');
     *
     * const tl = gsap.timeline();
     * tl.set(chevron.root.position, hoop.getEntryWorldPosition('left', 15));
     * tl.to(chevron.root.position, { ...hoop.getHoopWorldPosition(), duration: 0.8, ease: 'power2.in' });
     * tl.to(chevron.root.position, {
     *     ...hoop.getExitWorldPosition('left', 15),
     *     duration: 0.8,
     *     ease: 'power2.out',
     *     onStart: () => hoop.disableCanvasClip(),
     * });
     *
     * @example — bottom-to-top
     * hoop.enableCanvasClip(canvas, 'bottom');
     * tl.set(chevron.root.position, hoop.getEntryWorldPosition('bottom', 15));
     * // ... same pattern, axis flips automatically
     */
    enableCanvasClip(canvas, direction = 'left') {
        const center = this._projectToCanvas();
        const cam    = this.camera;

        // ── Compute inner and outer hole radii in screen px ───────────────────
        // Inner edge = centre-line radius - tube radius  (the clear hole)
        // Outer edge = centre-line radius + tube radius  (the ring's outer rim)
        const innerWorldR = this._pxToWorld(this._radiusPx) - this._pxToWorld(this._tubePx);
        const outerWorldR = this._pxToWorld(this._radiusPx) + this._pxToWorld(this._tubePx);

        const project = (worldR) => {
            const pt = new THREE.Vector3(
                this.root.position.x + worldR,
                this.root.position.y,
                this.root.position.z,
            ).project(cam);
            const mountRect = this._mountEl?.getBoundingClientRect();
            const w         = mountRect?.width ?? window.innerWidth;
            return (pt.x + 1) / 2 * w;
        };

        const innerPx = Math.floor(Math.abs(project(innerWorldR) - center.x)); // floor = no bleed into tube
        const outerPx = Math.ceil( Math.abs(project(outerWorldR) - center.x)); // ceil  = no bleed outside

        // ── Clip canvas to the inner hole only ───────────────────────────────
        // The chevron now only shows through the clear hole, not on top of the
        // ring tube. The Three.js torus is hidden for the duration and replaced
        // by a DOM div ring that sits above the canvas in the browser layer order,
        // so the ring is always visible and always on top.
        this._torusMesh.visible = false;
        canvas.style.clipPath   = `circle(${innerPx}px at ${center.x}px ${center.y}px)`;

        // ── DOM ring — mirrors the torus exactly ─────────────────────────────
        const diameter  = outerPx * 2;
        const ring      = document.createElement('div');
        const tubePx    = outerPx - innerPx;

        Object.assign(ring.style, {
            position:      'absolute',
            width:         `${diameter}px`,
            height:        `${diameter}px`,
            borderRadius:  '50%',
            border:        `${tubePx}px solid ${this._color}`,
            boxSizing:     'border-box',
            left:          `${center.x - outerPx}px`,
            top:           `${center.y - outerPx}px`,
            pointerEvents: 'none',
            zIndex:        '1',
        });

        // The ring must be a sibling of the canvas, inside the same mountEl, so
        // its absolute positioning is relative to the same origin.
        const container = canvas.parentElement;
        container.style.position = container.style.position || 'relative';
        container.appendChild(ring);

        this._clippedCanvas  = canvas;
        this._clipDirection  = direction;
        this._domRing        = ring;

        return `circle(${innerPx}px at ${center.x}px ${center.y}px)`;
    }
    getClipPathValue() {
        const center = this._projectToCanvas();
        const cam = this.camera;

        const getPxFromWorld = (worldRadius) => {
            const pt = new THREE.Vector3(
                this.root.position.x + worldRadius,
                this.root.position.y,
                this.root.position.z
            ).project(cam);
            const w = this._mountEl?.getBoundingClientRect().width ?? window.innerWidth;
            return (pt.x + 1) / 2 * w;
        };

        // Use the compensated radius to match the scaled hoop geometry
        const rotY = this.root.rotation.y;
        const cosY = Math.abs(Math.cos(rotY)) > 0.001 ? Math.cos(rotY) : 1;
        const innerWorldR = (this._pxToWorld(this._radiusPx) - this._pxToWorld(this._tubePx)) / cosY;
        const innerPx = Math.floor(Math.abs(getPxFromWorld(innerWorldR) - center.x));

        return `circle(${innerPx}px at ${center.x}px ${center.y}px)`;
    }

    /**
     * Remove the canvas clip applied by enableCanvasClip().
     * Safe to call even if no clip is active.
     */
    disableCanvasClip() {
        if (!this._clippedCanvas) return;
        this._clippedCanvas.style.clipPath = 'none';
        this._clippedCanvas  = null;
        this._clipDirection  = null;
        // Restore the Three.js torus and remove the temporary DOM ring
        this._torusMesh.visible = true;
        this._domRing?.remove();
        this._domRing = null;
    }

    /**
     * World-space position the chevron should start at, offset from the hoop
     * center in the entry direction by `distance` world units.
     *
     * @param {'left'|'right'|'top'|'bottom'} direction
     * @param {number} [distance=15]
     * @returns {{ x: number, y: number, z: number }}
     */
    getEntryWorldPosition(direction, distance = 15) {
        const { x, y, z } = this.root.position;
        return {
            x: x + (direction === 'right'  ?  distance : direction === 'left'   ? -distance : 0),
            y: y + (direction === 'top'    ?  distance : direction === 'bottom' ? -distance : 0),
            z,
        };
    }

    /**
     * World-space position the chevron should end at — always the opposite side
     * from the entry direction.
     *
     * @param {'left'|'right'|'top'|'bottom'} direction
     * @param {number} [distance=15]
     * @returns {{ x: number, y: number, z: number }}
     */
    getExitWorldPosition(direction, distance = 15) {
        const opposite = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
        return this.getEntryWorldPosition(opposite[direction], distance);
    }

    /**
     * The hoop's center as a plain { x, y, z } — pass directly to gsap.to():
     *   gsap.to(chevron.root.position, { ...hoop.getHoopWorldPosition(), duration: 0.8 })
     *
     * @returns {{ x: number, y: number, z: number }}
     */
    getHoopWorldPosition() {
        const { x, y, z } = this.root.position;
        return { x, y, z };
    }

    // ── Animation helpers (mirrors Chevron API) ────────────────────────────────

    /**
     * Animate to a world-space position.
     * @param {number}         x
     * @param {number}         y
     * @param {number}         z
     * @param {gsap.TweenVars} [vars]
     * @returns {gsap.core.Timeline}
     */
    moveTo(x, y, z, vars = {}) {
        return gsap.timeline().to(this.root.position, { x, y, z, ...vars }, 0);
    }

    /**
     * Animate rotation (degrees).
     * @param {number}         x
     * @param {number}         y
     * @param {number}         z
     * @param {gsap.TweenVars} [vars]
     * @returns {gsap.core.Tween}
     */
    rotateTo(x, y, z, vars = {}) {
        return gsap.to(this.root.rotation, {
            x: D2R(x), y: D2R(y), z: D2R(z), ...vars,
        });
    }

    /** Snap position without animation. */
    setPosition(x, y, z) { this.root.position.set(x, y, z); }

    /** Snap rotation (degrees) without animation. */
    setRotation(x, y, z) {
        this.root.rotation.set(D2R(x), D2R(y), D2R(z));
    }

    /** Change the visible ring color. */
    setColor(color) { this.material.color.set(new THREE.Color(color)); }

    /** Change the visible ring opacity. */
    setOpacity(opacity) {
        this.material.transparent = opacity < 1;
        this.material.opacity     = opacity;
    }

    /**
     * Align the hoop's world position to a DOM element.
     * Accepts the same anchor / offset / animate options as Chevron.alignToElement.
     *
     * @param {string|HTMLElement} target    CSS selector or element ref
     * @param {object}   [opts]
     * @param {'center'|'top-left'|'top-right'|'bottom-left'|'bottom-right'} [opts.anchor='center']
     * @param {number}   [opts.z=0]
     * @param {string|number} [opts.offsetX=0]
     * @param {string|number} [opts.offsetY=0]
     * @param {gsap.TweenVars} [opts.animate]  when set, animates instead of snapping
     */
    alignToElement(target, { anchor = 'center', z = 0, offsetX = 0, offsetY = 0, animate } = {}) {
        const cam = this.camera;
        if (!cam) { console.warn('Hoop.alignToElement: no camera provided.'); return; }

        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) { console.warn(`Hoop.alignToElement: element not found — "${target}"`); return; }

        cam.updateMatrixWorld();
        cam.updateProjectionMatrix();

        const mountRect = this._mountEl?.getBoundingClientRect();
        const rect      = el.getBoundingClientRect();

        const resolvedOffsetX = _resolveOffset(offsetX, rect.width);
        const resolvedOffsetY = _resolveOffset(offsetY, rect.height);

        const pixelX = _anchorX(rect, anchor) + resolvedOffsetX - (mountRect?.left ?? 0);
        const pixelY = _anchorY(rect, anchor) + resolvedOffsetY - (mountRect?.top  ?? 0);
        const canvasW = mountRect?.width  ?? window.innerWidth;
        const canvasH = mountRect?.height ?? window.innerHeight;

        const ndcX =  (pixelX / canvasW) * 2 - 1;
        const ndcY = -(pixelY / canvasH) * 2 + 1;
        const world = _ndcToWorld(ndcX, ndcY, z, cam);

        if (animate) return this.moveTo(world.x, world.y, world.z, animate);
        this.root.position.set(world.x, world.y, world.z);
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    dispose() {
        gsap.killTweensOf([this.root.position, this.root.rotation]);
        this.disableCanvasClip();
        for (const chevron of this._clippedChevrons) {
            this._restoreChevronMaterials(chevron);
        }
        this._clippedChevrons.clear();
        this._torusMesh.geometry.dispose();
        this._discMesh.geometry.dispose();
        this.material.dispose();
        this._stencilMat.dispose();
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    /**
     * Convert canvas-pixel dimensions to Three.js world units at this._z.
     * Uses the camera's FOV and position to compute the visible world height
     * at the target depth, then scales accordingly.
     */
    _pxToWorld(px) {
        const cam    = this.camera;
        const mountH = this._mountEl?.clientHeight ?? window.innerHeight;
        const dist   = (cam?.position.z ?? 30) - this._z;
        const fovRad = THREE.MathUtils.degToRad(cam?.fov ?? 100);
        const visH   = 2 * Math.tan(fovRad / 2) * dist;
        return (px / mountH) * visH;
    }

    _buildTorusGeo() {
        const radius = this._pxToWorld(this._radiusPx);
        const tube   = this._pxToWorld(this._tubePx);
        return new THREE.TorusGeometry(radius, tube, this._tubeSegments, this._segments);
    }

    _buildDiscGeo() {
        const radius = this._pxToWorld(this._radiusPx);
        return new THREE.CircleGeometry(radius, this._segments);
    }

    _rebuildGeometry() {
        this._torusMesh.geometry.dispose();
        this._torusMesh.geometry = this._buildTorusGeo();

        this._discMesh.geometry.dispose();
        this._discMesh.geometry = this._buildDiscGeo();
    }

    _restoreChevronMaterials(chevron) {
        for (const mat of [chevron.material1, chevron.material2]) {
            mat.stencilWrite = false;
            mat.stencilFunc  = THREE.AlwaysStencilFunc;
            mat.stencilRef   = 0;
            mat.needsUpdate  = true;
        }
    }

    /**
     * Project the hoop's world position to canvas-relative pixel coordinates.
     * Used by enableCanvasClip to place the CSS circle() at the right screen spot.
     * @returns {{ x: number, y: number }}
     */
    _projectToCanvas() {
        const cam       = this.camera;
        const mountRect = this._mountEl?.getBoundingClientRect();
        const w         = mountRect?.width  ?? window.innerWidth;
        const h         = mountRect?.height ?? window.innerHeight;

        cam.updateMatrixWorld();
        const projected = this.root.position.clone().project(cam);

        return {
            x:  (projected.x  + 1) / 2 * w,
            y: (-projected.y  + 1) / 2 * h,
        };
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _resolveOffset(value, referenceSize) {
    if (typeof value === 'string' && value.endsWith('%')) {
        return (parseFloat(value) / 100) * referenceSize;
    }
    return parseFloat(value) || 0;
}

function _anchorX(rect, anchor) {
    if (anchor.includes('right')) return rect.right;
    if (anchor.includes('left'))  return rect.left;
    return rect.left + rect.width / 2;
}

function _anchorY(rect, anchor) {
    if (anchor.includes('bottom')) return rect.bottom;
    if (anchor.includes('top'))    return rect.top;
    return rect.top + rect.height / 2;
}

function _ndcToWorld(ndcX, ndcY, worldZ, camera) {
    if (camera.isOrthographicCamera) {
        return new THREE.Vector3(ndcX, ndcY, 0).unproject(camera);
    }
    const origin    = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    const direction = new THREE.Vector3(ndcX, ndcY, 0.5)
        .unproject(camera)
        .sub(origin)
        .normalize();
    const t = (worldZ - origin.z) / direction.z;
    return origin.clone().addScaledVector(direction, t);
}