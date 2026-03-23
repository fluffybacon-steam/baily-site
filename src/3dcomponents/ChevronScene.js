import * as THREE from 'three';
import gsap from 'gsap';
import { Chevron } from '@/3dcomponents/Chrevon.js';
import { Hoop }    from '@/3dcomponents/Hoop.js';

export class ChevronScene {
    /**
     * @param {HTMLElement} mountEl
     * @param {object}      opts
     * @param {number}      opts.width
     * @param {number}      opts.height
     */
    constructor(mountEl, { width, height } = {}) {
        console.log('mountEl', mountEl);
        const w = width  ?? mountEl.clientWidth;
        const h = height ?? mountEl.clientHeight;

        this._chevrons = new Map();
        this._hoops    = new Map();
        this._mountEl  = mountEl;

        this.scene = new THREE.Scene();
        this.scene.background = null;

        this.camera = new THREE.PerspectiveCamera(100, w / h, 0.1, 2000);
        this.camera.position.set(0, 0, 30);
        this.scene.add(this.camera);

        const light = new THREE.DirectionalLight('white');
        light.position.set(0, 0, 100);
        this.scene.add(light);

        // stencil: true is Three.js's default but we make it explicit because
        // Hoop's portal mode depends on it being present in the framebuffer.
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, stencil: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(w, h);
        mountEl.appendChild(this.renderer.domElement);

        this._renderFn = () => this.renderer.render(this.scene, this.camera);
        gsap.ticker.add(this._renderFn);
        gsap.ticker.lagSmoothing(0);

        // Auto-resize when mountEl changes size
        this._resizeObserver = new ResizeObserver(() => {
            const w = mountEl.clientWidth;
            const h = mountEl.clientHeight;
            this.setSize(w, h);
        });
        this._resizeObserver.observe(mountEl);

        window.scene         = this.scene;
        window.sceneCamera   = this.camera;
        window.sceneRenderer = this.renderer;
    }

    // ── Chevron registry ──────────────────────────────────────────────────────

    /**
     * @param {string} id
     * @param {object} opts  forwarded to Chevron constructor
     * @returns {Chevron}
     */
    addChevron(id, opts = {}) {
        const chevron = new Chevron({ camera: this.camera, mountEl: this._mountEl, ...opts });
        this._chevrons.set(id, chevron);
        this.scene.add(chevron.root);
        return chevron;
    }

    getChevron(id)    { return this._chevrons.get(id) ?? null; }

    removeChevron(id) {
        const chevron = this._chevrons.get(id);
        if (!chevron) return;
        chevron.dispose();
        this.scene.remove(chevron.root);
        this._chevrons.delete(id);
    }

    // ── Hoop registry ─────────────────────────────────────────────────────────

    /**
     * Add a circular hoop to the scene.
     *
     * The hoop can be used in two ways:
     *
     *   1. "Jump-through" — a Chevron flies through the ring. No special setup
     *      needed; just position the hoop and animate the Chevron past its Z.
     *
     *   2. "Portal emergence" — a Chevron appears to come out of the hole.
     *      Call hoop.enablePortal() then hoop.clipChevron(chevron). The stencil
     *      buffer restricts the Chevron's pixels to the disc area while the ring
     *      itself is always fully visible.
     *
     * Pixel sizing
     * ─────────────
     * Pass radiusPx / tubePx in canvas-pixel units and the Hoop converts them
     * to world space automatically using the shared camera + mountEl.
     * After construction you can also call:
     *
     *   hoop.setSize(widthPx, heightPx)   — fit to element dimensions
     *   hoop.setRadiusPx(px)              — set by explicit radius
     *   hoop.setDepth(z)                  — change Z and recalculate
     *
     * Multiple portals
     * ─────────────────
     * Each hoop uses a unique stencilRef (1-255). If you add more than one
     * portal hoop, pass distinct stencilRef values to avoid overlap:
     *
     *   scene.addHoop('a', { stencilRef: 1, ... })
     *   scene.addHoop('b', { stencilRef: 2, ... })
     *
     * @param {string} id
     * @param {object} opts  forwarded to Hoop constructor
     * @returns {Hoop}
     *
     * @example — basic hoop
     * const hoop = scene.addHoop('ring1', { radiusPx: 120, z: 0 });
     * hoop.alignToElement('#target');
     *
     * @example — portal emergence
     * const hoop = scene.addHoop('portal', { radiusPx: 160, z: 0, stencilRef: 1 });
     * const chevron = scene.addChevron('hero', { angle: 0 });
     * hoop.enablePortal();
     * hoop.clipChevron(chevron);
     * chevron.root.position.set(0, 0, -10);   // start behind the portal
     * gsap.to(chevron.root.position, { z: 10, duration: 1.5, ease: 'power2.out',
     *     onComplete: () => hoop.releaseChevron(chevron),
     * });
     */
    addHoop(id, opts = {}) {
        const hoop = new Hoop({ camera: this.camera, mountEl: this._mountEl, ...opts });
        this._hoops.set(id, hoop);
        this.scene.add(hoop.root);
        return hoop;
    }

    /** @returns {Hoop|null} */
    getHoop(id) { return this._hoops.get(id) ?? null; }

    /**
     * Dispose and remove a hoop from the scene.
     * Also releases any chevrons that were portal-clipped to it.
     */
    removeHoop(id) {
        const hoop = this._hoops.get(id);
        if (!hoop) return;
        hoop.dispose();
        this.scene.remove(hoop.root);
        this._hoops.delete(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    setBackground(color) {
        this.scene.background = new THREE.Color(color);
    }

    setSize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    get canvasWidth()  { return this._mountEl.clientWidth;  }
    get canvasHeight() { return this._mountEl.clientHeight; }

    // ── Coordinate utilities ──────────────────────────────────────────────────

    /**
     * Resolve a DOM element's position to world-space coordinates.
     * Does not move anything — use the result to drive GSAP tweens manually.
     *
     * @param {string|HTMLElement} target   CSS selector or element ref
     * @param {object}   [opts]
     * @param {'center'|'top-left'|'top-right'|'bottom-left'|'bottom-right'} [opts.anchor='center']
     * @param {number}   [opts.z=0]              world-space Z depth
     * @param {string|number} [opts.offsetX=0]   px number or '50%' of element width
     * @param {string|number} [opts.offsetY=0]   px number or '50%' of element height
     * @returns {{ x: number, y: number, z: number } | null}
     */
    getElementWorldPosition(target, { anchor = 'center', z = 0, offsetX = 0, offsetY = 0 } = {}) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) {
            console.warn(`ChevronScene.getElementWorldPosition: element not found — "${target}"`);
            return null;
        }

        this.camera.updateMatrixWorld();
        this.camera.updateProjectionMatrix();

        const mountRect       = this._mountEl.getBoundingClientRect();
        const rect            = el.getBoundingClientRect();
        const resolvedOffsetX = _resolveOffset(offsetX, rect.width);
        const resolvedOffsetY = _resolveOffset(offsetY, rect.height);

        const pixelX = _anchorPixelX(rect, anchor) + resolvedOffsetX - mountRect.left;
        const pixelY = _anchorPixelY(rect, anchor) + resolvedOffsetY - mountRect.top;

        const ndcX =  (pixelX / mountRect.width)  * 2 - 1;
        const ndcY = -(pixelY / mountRect.height) * 2 + 1;

        return _ndcToWorld(ndcX, ndcY, z, this.camera);
    }

    // ── Debug ─────────────────────────────────────────────────────────────────

    /**
     * Place a magenta crosshair in the scene at the world position that
     * corresponds to a given pixel coordinate.
     *
     * @param {number} pixelX   canvas-relative X in pixels
     * @param {number} pixelY   canvas-relative Y in pixels
     * @param {number} [z=0]    world-space Z to place the marker at
     * @returns {{ dot, hLine, vLine }}
     */
    testPixelToWorld(pixelX, pixelY, z = 0) {
        const mountRect = this._mountEl.getBoundingClientRect();
        const ndcX =  (pixelX / mountRect.width)  * 2 - 1;
        const ndcY = -(pixelY / mountRect.height) * 2 + 1;

        const origin    = new THREE.Vector3().setFromMatrixPosition(this.camera.matrixWorld);
        const direction = new THREE.Vector3(ndcX, ndcY, 0.5)
            .unproject(this.camera)
            .sub(origin)
            .normalize();
        const t     = (z - origin.z) / direction.z;
        const world = origin.clone().addScaledVector(direction, t);

        const MAT      = new THREE.MeshBasicMaterial({ color: 0xff00ff, depthTest: false });
        const LINE_MAT = new THREE.LineBasicMaterial({ color: 0xff00ff, depthTest: false });

        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), MAT);
        dot.position.copy(world);
        dot.renderOrder = 999;

        const hLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(world.x - 2, world.y, world.z),
                new THREE.Vector3(world.x + 2, world.y, world.z),
            ]), LINE_MAT,
        );
        const vLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(world.x, world.y - 2, world.z),
                new THREE.Vector3(world.x, world.y + 2, world.z),
            ]), LINE_MAT,
        );
        hLine.renderOrder = 999;
        vLine.renderOrder = 999;

        this.scene.add(dot, hLine, vLine);

        console.group('ChevronScene.testPixelToWorld');
        console.log('pixel input:  ', { pixelX, pixelY });
        console.log('ndc:          ', { ndcX, ndcY });
        console.log('world output: ', { x: world.x, y: world.y, z: world.z });
        console.log('cam position: ', { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z });
        console.log('cam fov:      ', this.camera.fov);
        console.groupEnd();

        return { dot, hLine, vLine };
    }

    /** Remove markers returned by testPixelToWorld */
    clearDebugMarkers({ dot, hLine, vLine }) {
        this.scene.remove(dot, hLine, vLine);
        dot.geometry.dispose();
        hLine.geometry.dispose();
        vLine.geometry.dispose();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    destroy() {
        gsap.ticker.remove(this._renderFn);
        this._resizeObserver.disconnect();

        for (const chevron of this._chevrons.values()) chevron.dispose();
        for (const hoop    of this._hoops.values())    hoop.dispose();

        this.renderer.dispose();
        this.renderer.domElement.remove();
        this._chevrons.clear();
        this._hoops.clear();
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _resolveOffset(value, referenceSize) {
    if (typeof value === 'string' && value.endsWith('%')) {
        return (parseFloat(value) / 100) * referenceSize;
    }
    return parseFloat(value) || 0;
}

function _anchorPixelX(rect, anchor) {
    if (anchor.includes('right')) return rect.right;
    if (anchor.includes('left'))  return rect.left;
    return rect.left + rect.width / 2;
}

function _anchorPixelY(rect, anchor) {
    if (anchor.includes('bottom')) return rect.bottom;
    if (anchor.includes('top'))    return rect.top;
    return rect.top + rect.height / 2;
}

function _ndcToWorld(ndcX, ndcY, worldZ, camera) {
    const origin    = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    const direction = new THREE.Vector3(ndcX, ndcY, 0.5)
        .unproject(camera)
        .sub(origin)
        .normalize();
    const t = (worldZ - origin.z) / direction.z;
    return origin.clone().addScaledVector(direction, t);
}