import * as THREE from 'three';
import gsap from 'gsap';
import { Chevron } from '@/3dcomponents/Chrevon.js';
import { Hoop }    from '@/3dcomponents/Hoop.js';
import { Cube } from '@/3dcomponents/Cube.js';
import { Orb } from '@/3dcomponents/Orb.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class RenderScene {
    /**
     * @param {HTMLElement} mountEl
     * @param {object}      opts
     * @param {number}      opts.width
     * @param {number}      opts.height
     */
    constructor(mountEl, { width, height } = {}) {
        console.log('mountEl', mountEl, mountEl.getAttribute('name'));
        const w = width  ?? mountEl.clientWidth;
        const h = height ?? mountEl.clientHeight;
        const n = mountEl.getAttribute('name') ?? 'scene';

        this._cubes = new Map();
        this._orbs = new Map();
        this._chevrons = new Map();
        this._hoops    = new Map();
        this._mountEl  = mountEl;

        this.scene = new THREE.Scene();
        this.scene.name = n;
        this.scene.background = null;

        this.camera = new THREE.PerspectiveCamera(100, w / h, 0.1, 2000);
        this.camera.position.set(0, 0, 30);
        this.scene.add(this.camera);

        const light = new THREE.DirectionalLight('white');
        light.position.set(0, 0, 100);
        this.scene.add(light);
        this.directionalLight = light;  // ← Store reference!

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        this.ambientLight = ambientLight; 

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

        if(typeof window.scenes != 'undefined'){
            window.scenes.push(this.scene);
        } else {
            window.scenes = [this.scene];
        }
        // window.scene         = this.scene;
        // window.sceneCamera   = this.camera;
        // window.sceneRenderer = this.renderer;
    }

    enableBloom({ strength = 1.5, radius = 0.4, threshold = 0.85 } = {}) {
        if (this._composer) {
            console.warn('Bloom already enabled. Call disableBloom() first.');
            return;
        }
 
        const width = this._mountEl.clientWidth;
        const height = this._mountEl.clientHeight;
 
        // Create effect composer (post-processing pipeline)
        this._composer = new EffectComposer(this.renderer);
        this._composer.setSize(width, height);
 
        // First pass: render the scene normally
        const renderPass = new RenderPass(this.scene, this.camera);
        this._composer.addPass(renderPass);
 
        // Second pass: bloom effect
        this._bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            strength,    // strength
            radius,      // radius
            threshold    // threshold
        );
        this._composer.addPass(this._bloomPass);
 
        // Update render function to use composer instead of direct renderer
        gsap.ticker.remove(this._renderFn);
        this._renderFn = () => this._composer.render();
        gsap.ticker.add(this._renderFn);
 
        // Handle window resize
        this._resizeObserverCallback = () => {
            const w = this._mountEl.clientWidth;
            const h = this._mountEl.clientHeight;
            this._composer.setSize(w, h);
        };
        this._resizeObserver.disconnect();
        this._resizeObserver = new ResizeObserver(this._resizeObserverCallback);
        this._resizeObserver.observe(this._mountEl);
 
        console.log('Bloom enabled');
    }
 
    /**
     * Disable bloom post-processing.
     * 
     * @example
     * scene.disableBloom();
     */
    disableBloom() {
        if (!this._composer) {
            console.warn('Bloom not enabled.');
            return;
        }
 
        // Revert to direct rendering
        gsap.ticker.remove(this._renderFn);
        this._renderFn = () => this.renderer.render(this.scene, this.camera);
        gsap.ticker.add(this._renderFn);
 
        // Restore resize observer
        this._resizeObserver.disconnect();
        this._resizeObserver = new ResizeObserver(() => {
            const w = this._mountEl.clientWidth;
            const h = this._mountEl.clientHeight;
            this.setSize(w, h);
        });
        this._resizeObserver.observe(this._mountEl);
 
        this._composer.dispose();
        this._composer = null;
        this._bloomPass = null;
 
        console.log('Bloom disabled');
    }
 
    /**
     * Adjust bloom strength at runtime (animatable).
     * 
     * @param {number} strength  0-2 (higher = more bloom)
     * 
     * @example
     * gsap.to({ bloomStrength: 1.5 }, {
     *     bloomStrength: 2.5,
     *     duration: 2,
     *     onUpdate(self) {
     *         scene.setBloomStrength(self.targets()[0].bloomStrength);
     *     }
     * });
     */
    setBloomStrength(strength) {
        if (!this._bloomPass) {
            console.warn('Bloom not enabled.');
            return;
        }
        this._bloomPass.strength = Math.max(0, Math.min(2, strength));
    }
 
    /**
     * Get current bloom strength.
     * @returns {number}
     */
    getBloomStrength() {
        return this._bloomPass?.strength ?? 0;
    }
 
    /**
     * Adjust bloom threshold (what brightness triggers bloom).
     * Lower = more objects bloom. Higher = only brightest objects bloom.
     * 
     * @param {number} threshold  0-1
     */
    setBloomThreshold(threshold) {
        if (!this._bloomPass) {
            console.warn('Bloom not enabled.');
            return;
        }
        this._bloomPass.threshold = Math.max(0, Math.min(1, threshold));
    }
 
    /**
     * Get current bloom threshold.
     * @returns {number}
     */
    getBloomThreshold() {
        return this._bloomPass?.threshold ?? 0.85;
    }

    setLightIntensity(directional = null, ambient = null) {
        if (directional !== null) this.directionalLight.intensity = directional;
        if (ambient !== null) this.ambientLight.intensity = ambient;
    }

    /**
    * Add a drifting cube to the scene.
    *
    * Basic usage
    * ───────────
    * const cube = scene.addCube('c1', { size: 3, color: 0x00aeef, opacity: 0.6 });
    *
    * Drift to a target
    * ─────────────────
    * const cube = scene.addCube('c2', {
    *     position: { x: -20, y: 10, z: 0 },
    *     endPosition: { x: 20, y: -10, z: 5 },
    *     duration: 8,
    *     ease: 'power1.inOut',
    * });
    *
    * Constant velocity drift
    * ───────────────────────
    * const cube = scene.addCube('c3', {
    *     position: { x: 0, y: 0, z: -50 },
    *     velocity: { x: 2, y: 0.5, z: 3 },   // units per second
    *     tumble: true,
    * });
    *
    * With texture
    * ────────────
    * const cube = scene.addCube('c4', {
    *     texture: '/textures/glass.png',
    *     opacity: 0.7,
    * });
    *
    * @param {string} id
    * @param {object} opts  forwarded to Cube constructor
    * @returns {Cube}
    */
    addCube(id, opts = {}) {
        const cube = new Cube({ camera: this.camera, mountEl: this._mountEl, ...opts });
        this._cubes.set(id, cube);
        this.scene.add(cube.root);
        return cube;
    }
    
    /** @returns {Cube|null} */
    getCube(id) { return this._cubes.get(id) ?? null; }
    
    /**
     * Dispose and remove a cube from the scene.
     */
    removeCube(id) {
        const cube = this._cubes.get(id);
        if (!cube) return;
        cube.dispose();
        this.scene.remove(cube.root);
        this._cubes.delete(id);
    }

    /**
     * Add an orbiting light orb to the scene.
     *
     * The orb emits a PointLight that illuminates nearby objects. Great for
     * dynamic lighting on your semi-transparent cubes!
     *
     * @param {string} id
     * @param {object} opts  forwarded to Orb constructor
     * @returns {Orb}
     *
     * @example — golden sun orbit
     * const sun = scene.addOrb('sun', {
     *     center: { x: 0, y: 0, z: 0 },
     *     radius: 20,
     *     frequency: 0.08,
     *     color: 0xffaa00,
     *     intensity: 3,
     * });
     *
     * @example — cyan comet with long trail
     * const comet = scene.addOrb('comet', {
     *     center: { x: 0, y: 0, z: 5 },
     *     radius: 25,
     *     radiusY: 12,
     *     frequency: 0.15,
     *     tilt: { x: 20, z: 45 },
     *     color: 0x00ffff,
     *     trailLength: 50,
     *     trailDuration: 2,
     * });
     *
     * @example — multiple orbs for complex lighting
     * scene.addOrb('warm', { center: {x:0,y:0,z:0}, radius: 15, color: 0xff6600, frequency: 0.1 });
     * scene.addOrb('cool', { center: {x:0,y:0,z:0}, radius: 15, color: 0x0066ff, frequency: 0.1, phase: 180 });
     */
    addOrb(id, opts = {}) {
        const orb = new Orb({ camera: this.camera, mountEl: this._mountEl, ...opts });
        this._orbs.set(id, orb);
        this.scene.add(orb.root);
        return orb;
    }

    /** @returns {Orb|null} */
    getOrb(id) { return this._orbs.get(id) ?? null; }
    
    removeOrb(id) {
        const orb = this._orbs.get(id);
        if (!orb) return;
        orb.dispose();
        this.scene.remove(orb.root);
        this._orbs.delete(id);
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
            console.warn(`Scene.getElementWorldPosition: element not found — "${target}"`);
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

        console.group('Scene.testPixelToWorld');
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

    setCanvasClipToHoops(hoops) {
        document.getElementById('__hoop-clip')?.remove();

        const circles = hoops.map(hoop => {
            const { x, y } = hoop._projectToCanvas();
            const r = hoop.getInnerRadiusPx();
            return `<circle cx="${x}" cy="${y}" r="${r}"/>`;
        }).join('');

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', '__hoop-clip');
        svg.style.cssText = 'position:absolute;width:0;height:0;';
        svg.innerHTML = `
            <defs>
                <clipPath id="hoop-holes" clipPathUnits="userSpaceOnUse">
                    ${circles}
                </clipPath>
            </defs>`;
        this._mountEl.appendChild(svg);
        this.renderer.domElement.style.clipPath = 'url(#hoop-holes)';
    }
    
    clearCanvasClip() {
        document.getElementById('__hoop-clip')?.remove();
        this.renderer.domElement.style.clipPath = 'none';
    }

    /**
     * Calculate the Z depth at which a world-space width appears as a target pixel width.
     *
     * @param {number} worldWidth       width in world units (e.g., orbit diameter)
     * @param {number} targetPixelWidth desired pixel width on screen
     * @returns {number} z depth
     */
    getZForWorldWidth(worldWidth, targetPixelWidth) {
        const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
        const canvasWidth = this._mountEl?.clientWidth ?? window.innerWidth;
        const aspect = this.camera.aspect;
    
        // visibleWidth at distance d = 2 * d * tan(fov/2) * aspect
        // We want: worldWidth / visibleWidth = targetPixelWidth / canvasWidth
        // Solve for d, then z = cameraZ - d
    
        const ratio = targetPixelWidth / canvasWidth;
        const distance = worldWidth / (ratio * 2 * Math.tan(fovRad / 2) * aspect);
        return this.camera.position.z - distance;
    }
    
    /**
     * Calculate Z depth for an orbit to fill a percentage of viewport width.
     *
     * @param {number} orbitRadius      orbit radius in world units
     * @param {number} percent          0–1, e.g., 0.6 = 60% of viewport width
     * @returns {number} z depth
     *
     * @example
     * const z = scene.getZForOrbitPercent(35, 0.6);  // 60% of viewport
     * const orb = scene.addOrb('comet', { radius: 35, ... });
     * orb.setCenter(0, 0, z);
     */
    getZForOrbitPercent(orbitRadius, percent) {
        const canvasWidth = this._mountEl?.clientWidth ?? window.innerWidth;
        const targetPixelWidth = canvasWidth * percent;
        const orbitDiameter = orbitRadius * 2;
        return this.getZForWorldWidth(orbitDiameter, targetPixelWidth);
    }
    
    /**
     * Calculate Z depth for any object to fill a percentage of viewport width.
     *
     * @param {number} worldWidth   object width in world units
     * @param {number} percent      0–1
     * @returns {number} z depth
     */
    getZForWidthPercent(worldWidth, percent) {
        const canvasWidth = this._mountEl?.clientWidth ?? window.innerWidth;
        return this.getZForWorldWidth(worldWidth, canvasWidth * percent);
    }
    
    /**
     * Inverse: get pixel width of a world width at a given Z depth.
     *
     * @param {number} worldWidth
     * @param {number} z
     * @returns {number} pixel width
     */
    getPixelWidthAtZ(worldWidth, z) {
        const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
        const canvasWidth = this._mountEl?.clientWidth ?? window.innerWidth;
        const aspect = this.camera.aspect;
        const distance = this.camera.position.z - z;
        const visibleWidth = 2 * distance * Math.tan(fovRad / 2) * aspect;
        return (worldWidth / visibleWidth) * canvasWidth;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    destroy() {
        gsap.ticker.remove(this._renderFn);
        this._resizeObserver.disconnect();
        
        if (this._composer) {
            this.disableBloom();
        }
 
        for (const cube of this._cubes.values()) cube.dispose();
        for (const orb of this._orbs.values()) orb.dispose();
        for (const chevron of this._chevrons.values()) chevron.dispose();
        for (const hoop of this._hoops.values()) hoop.dispose();
 
        this.renderer.dispose();
        this.renderer.domElement.remove();
        this._cubes.clear();
        this._orbs.clear();
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

