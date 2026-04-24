import * as THREE from 'three';
import gsap from 'gsap';

const TAU = Math.PI * 2;

/**
 * A glowing orb that orbits a point in space, shedding a fading comet trail.
 *
 * The trail uses lightweight Sprites with a radial-gradient glow texture
 * and additive blending — inspired by the three.js particle-spiral /
 * afterimage demo — instead of heavy SphereGeometry meshes.
 *
 * @example — basic orbit
 * const orb = scene.addOrb('sun', {
 *     center: { x: 0, y: 0, z: 0 },
 *     radius: 15,
 *     frequency: 0.1,
 *     color: 0xffaa00,
 * });
 *
 * @example — tilted elliptical orbit with comet trail
 * const orb = scene.addOrb('comet', {
 *     center: { x: 0, y: 5, z: 0 },
 *     radius: 20,
 *     radiusY: 10,
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
     * @param {number}        opts.trailLength    number of trail sprites (default 25)
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
        lightDistance  = 50,
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

        // ── Shared glow texture (one for orb halo + trail sprites) ───────────
        this._glowTexture = this._createGlowTexture(128, this._color);

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
            color:             this._color,
            emissive:          this._color,
            emissiveIntensity: intensity,
            metalness:         0.0,
            roughness:         0.3,
        });
        this._core = new THREE.Mesh(coreGeo, this._coreMaterial);
        this._pivot.add(this._core);

        // ── Glow halo (additive sprite) ──────────────────────────────────────
        this._glowMaterial = new THREE.SpriteMaterial({
            map:         this._glowTexture,
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

        // ── Trail sprites ────────────────────────────────────────────────────
        // Inspired by the three.js particle-spiral example:
        //   • Sprites instead of SphereGeometry  → orders of magnitude lighter
        //   • Shared glow texture with additive blending → soft, luminous look
        //   • Non-linear alpha fade (quadratic ease-out) mirrors the example's
        //     `modTime.oneMinus().mul(2.0)` alpha curve
        this._trail = [];
        this._trailIndex = 0;

        for (let i = 0; i < trailLength; i++) {
            // Each sprite gets its own material so we can set per-particle
            // opacity independently (SpriteMaterial has no per-instance attrs).
            const mat = new THREE.SpriteMaterial({
                map:         this._glowTexture,
                color:       this._color,
                transparent: true,
                opacity:     0,
                blending:    THREE.AdditiveBlending,
                depthWrite:  false,
                depthTest:   true,
            });

            const sprite = new THREE.Sprite(mat);
            sprite.visible   = false;
            sprite.userData.birthTime = 0;
            // Trail lives in world space so it doesn't rotate with the pivot
            this.root.add(sprite);
            this._trail.push(sprite);
        }

        // ── Animation state ──────────────────────────────────────────────────
        this._angle         = this._phase;
        this._running       = false;
        this._ticker        = null;
        this._lastTrailTime = 0;

        // Position orb at starting angle
        this._updateOrbPosition();

        // Start orbiting
        this.start();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ORBIT CONTROLS
    // ═══════════════════════════════════════════════════════════════════════════

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
            if (this._trailLength > 0 && this._trailDuration > 0) {
                const trailInterval = this._trailDuration / this._trailLength;
                if (time - this._lastTrailTime > trailInterval) {
                    this._spawnTrailParticle(time);
                    this._lastTrailTime = time;
                }
            }

            // Fade trail particles
            this._updateTrail(time);
        };
        gsap.ticker.add(this._ticker);
    }

    pause() {
        if (!this._running) return;
        this._running = false;
        if (this._ticker) {
            gsap.ticker.remove(this._ticker);
            this._ticker = null;
        }
    }

    stop() {
        this.pause();
        this._angle = this._phase;
        this._updateOrbPosition();
        this._clearTrail();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARAMETER SETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    setCenter(x, y, z, vars = {}) {
        this._center = { x, y, z };
        if (vars.duration || vars.ease) {
            return gsap.to(this._pivot.position, { x, y, z, ...vars });
        }
        this._pivot.position.set(x, y, z);
    }

    getCenterWorldPosition() {
        const pos = new THREE.Vector3();
        this._pivot.getWorldPosition(pos);
        return pos;
    }

    setZForViewportPercent(percent, vars = {}) {
        const cam = this.camera;
        if (!cam) {
            console.warn('Orb.setZForViewportPercent: no camera provided.');
            return this._center.z;
        }

        const canvasWidth  = this._mountEl?.clientWidth ?? window.innerWidth;
        const fovRad       = THREE.MathUtils.degToRad(cam.fov);
        const aspect       = cam.aspect;
        const orbitDiameter = this._radius * 2;
        const targetPixelWidth = canvasWidth * percent;
        const ratio    = targetPixelWidth / canvasWidth;
        const distance = orbitDiameter / (ratio * 2 * Math.tan(fovRad / 2) * aspect);
        const z = cam.position.z - distance;

        this.setCenter(this._center.x, this._center.y, z, vars);
        return z;
    }

    setRadius(radius, radiusY = null) {
        this._radius  = radius;
        this._radiusY = radiusY ?? radius;
    }

    setFrequency(freq) {
        this._frequency = freq;
    }

    setTilt(x, y, z) {
        this._tilt = {
            x: THREE.MathUtils.degToRad(x ?? 0),
            y: THREE.MathUtils.degToRad(y ?? 0),
            z: THREE.MathUtils.degToRad(z ?? 0),
        };
        this._pivot.rotation.set(this._tilt.x, this._tilt.y, this._tilt.z);
    }

    setColor(color) {
        this._color.set(color);
        this._coreMaterial.color.set(color);
        this._coreMaterial.emissive.set(color);
        this._glowMaterial.color.set(color);
        if (this._light) this._light.color.set(color);

        // Regenerate glow texture with new color
        this._glowTexture.dispose();
        this._glowTexture = this._createGlowTexture(128, this._color);
        this._glowMaterial.map = this._glowTexture;

        // Update trail sprite materials
        for (const sprite of this._trail) {
            sprite.material.color.set(color);
            sprite.material.map = this._glowTexture;
        }
    }

    setIntensity(intensity) {
        this._intensity = intensity;
        this._coreMaterial.emissiveIntensity = intensity;
        if (this._light) this._light.intensity = intensity;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERNAL — TRAIL (sprite-based, inspired by three.js particle spiral)
    // ═══════════════════════════════════════════════════════════════════════════

    _updateOrbPosition() {
        const x = Math.cos(this._angle) * this._radius;
        const y = Math.sin(this._angle) * this._radiusY;
        this._core.position.set(x, y, 0);
    }

    _spawnTrailParticle(time) {
        if (this._trailLength === 0) return;

        const sprite = this._trail[this._trailIndex];
        this._trailIndex = (this._trailIndex + 1) % this._trailLength;

        // Grab the orb's current world position
        const worldPos = new THREE.Vector3();
        this._core.getWorldPosition(worldPos);

        sprite.position.copy(worldPos);
        sprite.visible = true;
        sprite.userData.birthTime = time;
        sprite.material.opacity = 1;
        // Initial scale matches the orb's glow halo
        sprite.scale.set(this._size * 3, this._size * 3, 1);
    }

    /**
     * Fade & shrink trail sprites every frame.
     *
     * The alpha curve is modelled after the three.js particle-spiral example's
     * `fAlpha = modTime.oneMinus().mul(2.0)`:
     *   – A "one minus life ratio" base gives linear fade-out.
     *   – Squaring it (quadratic ease-out) keeps particles bright near the
     *     orb and makes them vanish quickly at the tail — the classic comet
     *     look. The ×2 clamp saturates alpha to 1.0 for the first half of
     *     the particle's life, so the trail stays vivid close to the head.
     *
     * Scale follows an inverse-square curve so particles shrink smoothly
     * from full size to a tiny point — again matching the feel of the
     * spiral demo's `accTime = modTime * modTime` acceleration.
     */
    _updateTrail(time) {
        for (const sprite of this._trail) {
            if (!sprite.visible) continue;

            const age       = time - sprite.userData.birthTime;
            const lifeRatio = Math.min(age / this._trailDuration, 1);

            if (lifeRatio >= 1) {
                sprite.visible = false;
                continue;
            }

            // ── Alpha: saturated-then-fade curve ─────────────────────────
            // raw = (1 - lifeRatio) * 2   →  clamped to [0, 1]
            // Stays at 1.0 for the first 50% of life, then fades out.
            const rawAlpha = (1 - lifeRatio) * 2;
            const alpha    = Math.min(rawAlpha, 1);
            sprite.material.opacity = alpha;

            // ── Scale: quadratic shrink ──────────────────────────────────
            // Mirrors the spiral demo's `accTime = modTime²` acceleration:
            // particles shrink slowly at first, then collapse quickly.
            const scaleFactor = (1 - lifeRatio * lifeRatio);
            const s = this._size * 3 * scaleFactor;
            sprite.scale.set(s, s, 1);
        }
    }

    _clearTrail() {
        for (const sprite of this._trail) {
            sprite.visible = false;
            sprite.material.opacity = 0;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GLOW TEXTURE (shared by orb halo + trail sprites)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generates a radial-gradient canvas texture that acts like the
     * circle.png sprite in the three.js example — a soft, bright center
     * fading to fully transparent edges. Using a canvas texture means
     * no external image dependency.
     */
    _createGlowTexture(resolution, color) {
        const canvas  = document.createElement('canvas');
        canvas.width  = resolution;
        canvas.height = resolution;
        const ctx     = canvas.getContext('2d');

        const center   = resolution / 2;
        const gradient = ctx.createRadialGradient(
            center, center, 0,
            center, center, center,
        );

        const c = new THREE.Color(color);
        const r = Math.floor(c.r * 255);
        const g = Math.floor(c.g * 255);
        const b = Math.floor(c.b * 255);

        // Tight bright core → soft fall-off → transparent edge
        gradient.addColorStop(0,    `rgba(${r}, ${g}, ${b}, 1)`);
        gradient.addColorStop(0.15, `rgba(${r}, ${g}, ${b}, 0.9)`);
        gradient.addColorStop(0.4,  `rgba(${r}, ${g}, ${b}, 0.4)`);
        gradient.addColorStop(0.7,  `rgba(${r}, ${g}, ${b}, 0.12)`);
        gradient.addColorStop(1,    `rgba(${r}, ${g}, ${b}, 0)`);

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

    getWorldPosition() {
        const pos = new THREE.Vector3();
        this._core.getWorldPosition(pos);
        return pos;
    }

    get angle()  { return this._angle; }
    get light()  { return this._light; }
    get center() { return { ...this._center }; }

    get trailLength() {
        return this._trailLength;
    }

    set trailLength(val) {
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

    // ═══════════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    dispose() {
        this.pause();

        // Core
        this._core.geometry.dispose();
        this._coreMaterial.dispose();

        // Glow
        this._glowMaterial.dispose();

        // Shared texture
        this._glowTexture.dispose();

        // Light
        if (this._light) this._light.dispose?.();

        // Trail sprites
        for (const sprite of this._trail) {
            sprite.material.dispose();
        }
    }
}