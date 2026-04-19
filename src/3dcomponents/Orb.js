import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const TAU = Math.PI * 2;

/**
 * A glowing orb that orbits a point in space, shedding a fading comet trail.
 *
 * The orb emits actual light via a PointLight, so it will illuminate nearby
 * objects (like your Cubes). The trail is a series of small spheres that
 * fade out over time.
 *
 * @example — basic orbit
 * const orb = scene.addOrb('sun', {
 *     center: { x: 0, y: 0, z: 0 },
 *     radius: 15,
 *     frequency: 0.1,        // orbits per second
 *     color: 0xffaa00,
 * });
 *
 * @example — tilted elliptical orbit
 * const orb = scene.addOrb('comet', {
 *     center: { x: 0, y: 5, z: 0 },
 *     radius: 20,
 *     radiusY: 10,           // ellipse
 *     frequency: 0.05,
 *     tilt: { x: 15, z: 30 },
 *     color: 0x00ffff,
 *     trailLength: 40,
 * });
 */
export class Orb {
    /**
     * @param {object}        opts
     * @param {{x,y,z}}       opts.center         orbit center point (default origin)
     * @param {number}        opts.radius         orbit radius (default 10)
     * @param {number}        opts.radiusY        vertical radius for ellipse (default = radius)
     * @param {number}        opts.frequency      orbits per second (default 0.1)
     * @param {boolean}       opts.clockwise      orbit direction (default false = CCW)
     * @param {number}        opts.phase          starting angle in degrees (default 0)
     * @param {{x,y,z}}       opts.tilt           orbit plane tilt in degrees
     * @param {number|string} opts.color          glow color (default 0xffaa00)
     * @param {number}        opts.size           orb diameter (default 1)
     * @param {number}        opts.intensity      light intensity (default 2)
     * @param {number}        opts.lightDistance  point light range (default 50)
     * @param {number}        opts.trailLength    number of trail particles (default 25)
     * @param {number}        opts.trailDuration  seconds before trail fully fades (default 1.5)
     * @param {boolean}       opts.emitLight      attach a PointLight (default true)
     * @param {THREE.Camera}  opts.camera
     * @param {HTMLElement}   opts.mountEl
     */
    constructor({
        center        = { x: 0, y: 0, z: 0 },
        radius        = 10,
        radiusY       = null,
        frequency     = 0.1,
        clockwise     = false,
        phase         = 0,
        tilt          = { x: 0, y: 0, z: 0 },
        color         = 0xffaa00,
        size          = 1,
        intensity     = 2,
        lightDistance = 50,
        trailLength   = 0,
        trailDuration = 0,
        emitLight     = true,
        camera        = null,
        mountEl       = null,
    } = {}) {
        this.camera   = camera;
        this._mountEl = mountEl;

        // Orbit parameters
        this._center    = { ...center };
        this._radius    = radius;
        this._radiusY   = radiusY ?? radius;
        this._frequency = frequency;
        this._clockwise = clockwise;
        this._phase     = THREE.MathUtils.degToRad(phase);
        this._tilt      = {
            x: THREE.MathUtils.degToRad(tilt.x ?? 0),
            y: THREE.MathUtils.degToRad(tilt.y ?? 0),
            z: THREE.MathUtils.degToRad(tilt.z ?? 0),
        };

        // Visual parameters
        this._color         = new THREE.Color(color);
        this._size          = size;
        this._intensity     = intensity;
        this._trailLength   = trailLength;
        this._trailDuration = trailDuration;

        // ── Scene graph ──────────────────────────────────────────────────────
        this.root = new THREE.Group();

        // Orbit pivot (applies tilt)
        this._pivot = new THREE.Group();
        this._pivot.position.set(this._center.x, this._center.y, this._center.z);
        this._pivot.rotation.set(this._tilt.x, this._tilt.y, this._tilt.z);
        this.root.add(this._pivot);

        // ── Orb core ─────────────────────────────────────────────────────────
        const coreGeo = new THREE.SphereGeometry(size / 2, 32, 32);
        this._coreMaterial = new THREE.MeshStandardMaterial({
            color:            this._color,
            emissive:         this._color,
            emissiveIntensity: intensity,
            metalness:        0.0,
            roughness:        0.3,
        });
        this._core = new THREE.Mesh(coreGeo, this._coreMaterial);
        this._pivot.add(this._core);

        // ── Glow halo (additive sprite) ──────────────────────────────────────
        const glowTexture = this._createGlowTexture(128, this._color);
        this._glowMaterial = new THREE.SpriteMaterial({
            map:         glowTexture,
            color:       this._color,
            transparent: true,
            blending:    THREE.AdditiveBlending,
            depthWrite:  false,
        });
        this._glow = new THREE.Sprite(this._glowMaterial);
        this._glow.scale.set(size * 4, size * 4, 1);
        this._core.add(this._glow);

        // ── Point light ──────────────────────────────────────────────────────
        this._light = null;
        if (emitLight) {
            this._light = new THREE.PointLight(this._color, intensity, lightDistance);
            this._light.decay = 2;
            this._core.add(this._light);
        }

        // ── Trail particles ──────────────────────────────────────────────────
        this._trail = [];
        this._trailIndex = 0;
        this._trailMaterial = new THREE.MeshBasicMaterial({
            color:       this._color,
            transparent: true,
            opacity:     0.6,
            blending:    THREE.AdditiveBlending,
            depthWrite:  false,
        });

        // const trailGeo = new THREE.SphereGeometry(size * 0.3, 8, 8);
        const trailGeo = new THREE.SphereGeometry(size, 10, 10);
        for (let i = 0; i < trailLength; i++) {
            const particle = new THREE.Mesh(trailGeo, this._trailMaterial.clone());
            particle.visible = false;
            particle.userData.birthTime = 0;
            this.root.add(particle);  // Trail in world space, not pivot
            this._trail.push(particle);
        }

        // ── Animation state ──────────────────────────────────────────────────
        this._angle      = this._phase;
        this._running    = false;
        this._ticker     = null;
        this._lastTrailTime = 0;

        // Position orb at starting angle
        this._updateOrbPosition();

        // Start orbiting
        this.start();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ORBIT CONTROLS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Start or resume orbital motion.
     */
    start() {
        if (this._running) return;
        this._running = true;

        let lastTime = null;
        this._ticker = (time) => {
            if (lastTime === null) lastTime = time;
            const delta = time - lastTime;
            lastTime = time;

            // Update angle
            const angularVelocity = this._frequency * TAU * (this._clockwise ? -1 : 1);
            this._angle += angularVelocity * delta;

            // Move orb
            this._updateOrbPosition();

            // Spawn trail particle (throttled)
            const trailInterval = this._trailDuration / this._trailLength;
            if (time - this._lastTrailTime > trailInterval) {
                this._spawnTrailParticle(time);
                this._lastTrailTime = time;
            }

            // Fade trail particles
            this._updateTrail(time);
        };
        gsap.ticker.add(this._ticker);
    }

    /**
     * Pause orbital motion (trail continues fading).
     */
    pause() {
        if (!this._running) return;
        this._running = false;
        if (this._ticker) {
            gsap.ticker.remove(this._ticker);
            this._ticker = null;
        }
    }

    /**
     * Stop and reset to initial phase.
     */
    stop() {
        this.pause();
        this._angle = this._phase;
        this._updateOrbPosition();
        this._clearTrail();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARAMETER SETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Change orbit center (animatable).
     * The center is the pivot point — tilt rotates the orbital plane AROUND this point.
     */
    setCenter(x, y, z, vars = {}) {
        // Always update internal tracking
        this._center = { x, y, z };

        if (vars.duration || vars.ease) {
            return gsap.to(this._pivot.position, { x, y, z, ...vars });
        }
        this._pivot.position.set(x, y, z);
    }

    /**
     * Get the world position of the orbit center (pivot point).
     * Useful for verifying the center stays fixed when tilting.
     * @returns {THREE.Vector3}
     */
    getCenterWorldPosition() {
        const pos = new THREE.Vector3();
        this._pivot.getWorldPosition(pos);
        return pos;
    }

    /**
     * Set the orbit's Z depth so it appears as a percentage of viewport width.
     * Keeps current X and Y center coordinates.
     *
     * @param {number} percent   0–1, e.g., 0.6 = orbit fills 60% of viewport width
     * @param {object} [vars]    optional GSAP vars for animation
     * @returns {number}         the calculated Z value
     *
     * @example
     * const orb = scene.addOrb('comet', { radius: 35, ... });
     * orb.setZForViewportPercent(0.6);  // orbit is 60% of viewport width
     */
    setZForViewportPercent(percent, vars = {}) {
        const cam = this.camera;
        if (!cam) {
            console.warn('Orb.setZForViewportPercent: no camera provided.');
            return this._center.z;
        }

        const canvasWidth = this._mountEl?.clientWidth ?? window.innerWidth;
        const fovRad = THREE.MathUtils.degToRad(cam.fov);
        const aspect = cam.aspect;

        // Orbit diameter in world units
        const orbitDiameter = this._radius * 2;

        // Target pixel width
        const targetPixelWidth = canvasWidth * percent;

        // Solve: orbitDiameter / visibleWidth = targetPixelWidth / canvasWidth
        // visibleWidth = 2 * distance * tan(fov/2) * aspect
        const ratio = targetPixelWidth / canvasWidth;
        const distance = orbitDiameter / (ratio * 2 * Math.tan(fovRad / 2) * aspect);
        const z = cam.position.z - distance;

        // Apply
        this.setCenter(this._center.x, this._center.y, z, vars);
        return z;
    }

    /**
     * Change orbit radius.
     */
    setRadius(radius, radiusY = null) {
        this._radius  = radius;
        this._radiusY = radiusY ?? radius;
    }

    /**
     * Change orbit frequency (orbits per second).
     */
    setFrequency(freq) {
        this._frequency = freq;
    }

    /**
     * Change orbit tilt (degrees).
     */
    setTilt(x, y, z) {
        this._tilt = {
            x: THREE.MathUtils.degToRad(x ?? 0),
            y: THREE.MathUtils.degToRad(y ?? 0),
            z: THREE.MathUtils.degToRad(z ?? 0),
        };
        this._pivot.rotation.set(this._tilt.x, this._tilt.y, this._tilt.z);
    }

    /**
     * Change glow color.
     */
    setColor(color) {
        this._color.set(color);
        this._coreMaterial.color.set(color);
        this._coreMaterial.emissive.set(color);
        this._glowMaterial.color.set(color);
        if (this._light) this._light.color.set(color);

        // Update existing trail particles
        for (const p of this._trail) {
            p.material.color.set(color);
        }
    }

    /**
     * Change light intensity.
     */
    setIntensity(intensity) {
        this._intensity = intensity;
        this._coreMaterial.emissiveIntensity = intensity;
        if (this._light) this._light.intensity = intensity;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ═══════════════════════════════════════════════════════════════════════════

    _updateOrbPosition() {
        const x = Math.cos(this._angle) * this._radius;
        const y = Math.sin(this._angle) * this._radiusY;
        this._core.position.set(x, y, 0);
    }

    _spawnTrailParticle(time) {
        const particle = this._trail[this._trailIndex];
        this._trailIndex = (this._trailIndex + 1) % this._trailLength;

        // Get world position of orb core
        const worldPos = new THREE.Vector3();
        this._core.getWorldPosition(worldPos);

        particle.position.copy(worldPos);
        particle.visible = true;
        particle.userData.birthTime = time;
        particle.material.opacity = 1;
        particle.scale.setScalar(1);
    }

    _updateTrail(time) {
        for (const particle of this._trail) {
            if (!particle.visible) continue;

            const age = time - particle.userData.birthTime;
            const lifeRatio = age / this._trailDuration;

            if (lifeRatio >= 1) {
                // particle.visible = false;
                continue;
            }

            // Fade out and shrink
            // particle.material.opacity = 0.6 * (1 - lifeRatio);
            particle.scale.setScalar(1 - lifeRatio * 0.9);
        }
    }

    _clearTrail() {
        for (const particle of this._trail) {
            particle.visible = false;
        }
    }

    _createGlowTexture(resolution, color) {
        const canvas = document.createElement('canvas');
        canvas.width  = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext('2d');

        const center = resolution / 2;
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

        // Convert THREE.Color to CSS
        const c = new THREE.Color(color);
        const cssColor = `rgb(${Math.floor(c.r * 255)}, ${Math.floor(c.g * 255)}, ${Math.floor(c.b * 255)})`;

        gradient.addColorStop(0,   cssColor);
        gradient.addColorStop(0.2, cssColor);
        gradient.addColorStop(0.9, `rgba(${Math.floor(c.r * 255)}, ${Math.floor(c.g * 255)}, ${Math.floor(c.b * 255)}, 0.5)`);
        gradient.addColorStop(1,   'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, resolution, resolution);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    spinOrbit(targetAngle, vars = {}) {
        return gsap.to(this._pivot.rotation, { z: targetAngle, ...vars });
    }

    stopSpin() {
        gsap.killTweensOf(this._pivot.rotation);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    /** Current world position of the orb (the glowing sphere). */
    getWorldPosition() {
        const pos = new THREE.Vector3();
        this._core.getWorldPosition(pos);
        return pos;
    }

    /** Current orbit angle in radians. */
    get angle() { return this._angle; }

    /** The PointLight instance (if emitLight was true). */
    get light() { return this._light; }

    /** Current center position (pivot point). */
    get center() { return { ...this._center }; }

    /**
     * Debug: log center positions to verify tilt preserves the pivot location.
     */
    debugCenter() {
        const worldPos = this.getCenterWorldPosition();
        console.group('Orb center debug');
        console.log('Internal _center:', this._center);
        console.log('Pivot local pos: ', {
            x: this._pivot.position.x,
            y: this._pivot.position.y,
            z: this._pivot.position.z,
        });
        console.log('Pivot world pos: ', { x: worldPos.x, y: worldPos.y, z: worldPos.z });
        console.log('Tilt (degrees):  ', {
            x: THREE.MathUtils.radToDeg(this._tilt.x),
            y: THREE.MathUtils.radToDeg(this._tilt.y),
            z: THREE.MathUtils.radToDeg(this._tilt.z),
        });
        console.groupEnd();
        return worldPos;
    }
    /** Animatable intensity property */
    get trailLength() {
        return this._trailLength;
    }

    set trailLength(val) {
        // Note: Only affects newly spawned particles
        this._trailLength = Math.floor(val);
    }

    get intensity() {
        return this._intensity;
    }

    set intensity(val) {
        this._intensity = val;
        this._coreMaterial.emissiveIntensity = val;
        if (this._light) this._light.intensity = val;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    dispose() {
        this.pause();

        // Core
        this._core.geometry.dispose();
        this._coreMaterial.dispose();

        // Glow
        this._glowMaterial.map?.dispose();
        this._glowMaterial.dispose();

        // Light
        if (this._light) this._light.dispose?.();

        // Trail
        for (const particle of this._trail) {
            particle.geometry.dispose();
            particle.material.dispose();
        }
    }
}