import * as THREE from 'three';
import gsap from 'gsap';
import { Chevron } from '@/components/Chrevon';

export class ChevronScene {
    /**
     * @param {HTMLElement} mountEl
     * @param {object}      opts
     * @param {number}      opts.width
     * @param {number}      opts.height
     */
    constructor(mountEl, { width = document.documentElement.clientWidth, height = document.documentElement.clientHeight } = {}) {
        this._chevrons = new Map();

        // ── Scene ────────────────────────────────────────────────────────────
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color('skyblue');
        this.scene.background = null;

        // ── Camera ───────────────────────────────────────────────────────────
        this.camera = new THREE.PerspectiveCamera(100, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, 30);
        this.scene.add(this.camera);

        // ── Lights ───────────────────────────────────────────────────────────
        const light = new THREE.DirectionalLight('white');
        light.position.set(0, 0, 100);
        this.scene.add(light);

        // ── Debug ─────────────────────────────────────────────────────────────
        this.scene.add(new THREE.AxesHelper(100));

        // ── Renderer ─────────────────────────────────────────────────────────
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        mountEl.appendChild(this.renderer.domElement);

        // ── GSAP ticker — single render loop, no THREE clock needed ──────────
        // Bind so we can cleanly remove it in destroy()
        this._renderFn = () => this.renderer.render(this.scene, this.camera);
        gsap.ticker.add(this._renderFn);

        // Opt out of GSAP's lagSmoothing so fast tabs don't get a
        // giant delta spike when they become active again
        gsap.ticker.lagSmoothing(0);

        // ── Expose for devtools / SceneControls panel ─────────────────────────
        window.scene         = this.scene;
        window.sceneCamera   = this.camera;
        window.sceneRenderer = this.renderer;

    }

    // ── Chevron registry ─────────────────────────────────────────────────────

    /**
     * @param {string} id
     * @param {object} opts  forwarded to Chevron constructor
     * @returns {Chevron}
     */
    addChevron(id, opts = {}) {
        const chevron = new Chevron({ camera: this.camera, ...opts });
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    setBackground(color) {
        this.scene.background = new THREE.Color(color);
    }

    setSize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // ── Coordinate utilities ─────────────────────────────────────────────────

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
     *
     * Usage:
     *   const pos = sceneInstance.getElementWorldPosition('.Hero', { z: targetZ });
     *   tl.to(chevron.root.position, { ...pos, duration: 1 });
     */
    getElementWorldPosition(target, { anchor = 'center', z = 0, offsetX = 0, offsetY = 0 } = {}) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) {
            console.warn(`ChevronScene.getElementWorldPosition: element not found — "${target}"`);
            return null;
        }

        this.camera.updateMatrixWorld();
        this.camera.updateProjectionMatrix();

        const rect            = el.getBoundingClientRect();
        const resolvedOffsetX = _resolveOffset(offsetX, rect.width);
        const resolvedOffsetY = _resolveOffset(offsetY, rect.height);
        const pixelX          = _anchorPixelX(rect, anchor) + resolvedOffsetX;
        const pixelY          = _anchorPixelY(rect, anchor) + resolvedOffsetY;
        const ndcX            =  (pixelX / document.documentElement.clientWidth)  * 2 - 1;
        const ndcY            = -(pixelY / document.documentElement.clientHeight) * 2 + 1;

        return _ndcToWorld(ndcX, ndcY, z, this.camera);
    }

    // ── Debug ────────────────────────────────────────────────────────────────

    /**
     * Place a magenta crosshair in the scene at the world position that
     * corresponds to a given pixel coordinate. Use this to verify that
     * NDC → world unprojection lines up with DOM positions.
     *
     * Usage:
     *   const markers = scene.testPixelToWorld(20, 20)
     *   // compare the crosshair position against a known DOM element
     *   scene.clearDebugMarkers(markers) // clean up when done
     *
     * @param {number} pixelX   viewport X in pixels (e.g. from getBoundingClientRect)
     * @param {number} pixelY   viewport Y in pixels
     * @param {number} [z=0]    world-space Z to place the marker at
     * @returns {{ dot, hLine, vLine }}
     */
    testPixelToWorld(pixelX, pixelY, z = 0) {
        const ndcX =  (pixelX / document.documentElement.clientWidth)  * 2 - 1;
        const ndcY = -(pixelY / document.documentElement.clientHeight) * 2 + 1;

        // Unproject through camera
        const origin    = new THREE.Vector3().setFromMatrixPosition(this.camera.matrixWorld);
        const direction = new THREE.Vector3(ndcX, ndcY, 0.5)
            .unproject(this.camera)
            .sub(origin)
            .normalize();
        const t     = (z - origin.z) / direction.z;
        const world = origin.clone().addScaledVector(direction, t);

        const MAT = new THREE.MeshBasicMaterial({ color: 0xff00ff, depthTest: false });
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
        // 1. Stop rendering
        gsap.ticker.remove(this._renderFn);

        // 2. Kill any live tweens on chevron objects
        for (const chevron of this._chevrons.values()) {
            chevron.dispose();
        }

        // 3. Free GPU memory
        this.renderer.dispose();

        // 4. Remove canvas (prevents HMR double-mount)
        this.renderer.domElement.remove();

        this._chevrons.clear();
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