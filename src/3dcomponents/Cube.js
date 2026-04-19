import * as THREE from 'three';
import gsap from 'gsap';

const D2R = (d) => THREE.MathUtils.degToRad(d);

/**
 * A drifting, semi-transparent cube for use with RenderScene.
 *
 * Lighting notes
 * ──────────────
 * This component uses MeshStandardMaterial which requires scene lighting.
 * The existing DirectionalLight works, but for best results with transparent
 * objects, consider adding an AmbientLight to the scene:
 *
 *   scene.add(new THREE.AmbientLight(0xffffff, 0.4));
 *
 * This prevents the "back" faces of transparent cubes from appearing too dark.
 */
export class Cube {
    /**
     * @param {object}             opts
     * @param {number}             opts.size          cube edge length in world units (default 2)
     * @param {string|number}      opts.color         hex color (default 0xffffff)
     * @param {number}             opts.opacity       0–1, default 0.5 (semi-transparent)
     * @param {THREE.Texture|string} opts.texture     texture object or URL to load
     * @param {number}             opts.metalness     PBR metalness 0–1 (default 0.1)
     * @param {number}             opts.roughness     PBR roughness 0–1 (default 0.5)
     * @param {{x,y,z}}            opts.position      initial world position
     * @param {{x,y,z}}            opts.rotation      initial rotation in degrees
     * @param {{x,y,z}}            opts.velocity      drift velocity (units/sec) — starts immediately
     * @param {{x,y,z}}            opts.endPosition   target position — cube drifts toward this
     * @param {number}             opts.duration      seconds to reach endPosition (default 5)
     * @param {string}             opts.ease          GSAP ease for endPosition drift (default 'none')
     * @param {boolean}            opts.tumble        auto-rotate while drifting (default false)
     * @param {{x,y,z}}            opts.tumbleSpeed   degrees/sec rotation on each axis
     * @param {THREE.Camera}       opts.camera        required for alignToElement
     * @param {HTMLElement}        opts.mountEl       canvas container
     */
    constructor({
        size       = 2,
        color      = 0xffffff,
        opacity    = 0.5,
        texture    = null,
        metalness  = 0.1,
        roughness  = 0.5,
        position   = { x: 0, y: 0, z: 0 },
        rotation   = { x: 0, y: 0, z: 0 },
        velocity   = null,
        endPosition = null,
        duration   = 5,
        ease       = 'none',
        tumble     = false,
        tumbleSpeed = { x: 15, y: 30, z: 10 },
        camera     = null,
        mountEl    = null,
    } = {}) {
        this.camera   = camera;
        this._mountEl = mountEl;
        this._size    = size;

        // Store drift parameters for later scripting
        this._velocity    = velocity;
        this._endPosition = endPosition;
        this._duration    = duration;
        this._ease        = ease;
        this._tumble      = tumble;
        this._tumbleSpeed = tumbleSpeed;

        // Active tweens for cleanup
        this._driftTween  = null;
        this._tumbleTween = null;
        this._velocityTicker = null;

        // ── Geometry ─────────────────────────────────────────────────────────
        const geometry = new THREE.BoxGeometry(size, size, size);

        // ── Material ─────────────────────────────────────────────────────────
        // MeshStandardMaterial responds to scene lighting and supports PBR
        this.material = new THREE.MeshStandardMaterial({
            color:       new THREE.Color(color),
            transparent: true,
            opacity:     opacity,
            metalness:   metalness,
            roughness:   roughness,
            side:        THREE.DoubleSide,    // see inside faces when transparent
            depthWrite:  opacity < 1 ? false : true, // proper transparency sorting
        });

        // Apply texture if provided
        if (texture) {
            this._applyTexture(texture);
        }

        // ── Scene graph ──────────────────────────────────────────────────────
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.root = new THREE.Group();
        this.root.add(this.mesh);

        // Initial transform
        this.root.position.set(position.x ?? 0, position.y ?? 0, position.z ?? 0);
        this.root.rotation.set(
            D2R(rotation.x ?? 0),
            D2R(rotation.y ?? 0),
            D2R(rotation.z ?? 0),
        );

        // ── Auto-start drift if configured ───────────────────────────────────
        if (velocity) {
            this.startVelocityDrift(velocity);
        } else if (endPosition) {
            this.driftTo(endPosition, { duration, ease });
        }

        if (tumble) {
            this.startTumble(tumbleSpeed);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRIFT & MOTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Drift toward a target position over time.
     *
     * @param {{x,y,z}}        target
     * @param {object}         [opts]
     * @param {number}         [opts.duration=5]
     * @param {string}         [opts.ease='power1.inOut']
     * @param {Function}       [opts.onComplete]
     * @returns {gsap.core.Tween}
     */
    driftTo(target, { duration = 5, ease = 'power1.inOut', onComplete } = {}) {
        this.stopDrift();
        this._driftTween = gsap.to(this.root.position, {
            x: target.x ?? this.root.position.x,
            y: target.y ?? this.root.position.y,
            z: target.z ?? this.root.position.z,
            duration,
            ease,
            onComplete,
        });
        return this._driftTween;
    }

    /**
     * Animate to position (alias matching Chevron API).
     */
    moveTo(x, y, z, vars = {}) {
        this.stopDrift();
        this._driftTween = gsap.to(this.root.position, { x, y, z, ...vars });
        return this._driftTween;
    }

    /**
     * Continuous velocity-based drift. The cube moves at a constant rate
     * until stopped or redirected.
     *
     * @param {{x,y,z}} velocity   units per second on each axis
     */
    startVelocityDrift(velocity) {
        this.stopDrift();
        this._velocity = { ...velocity };

        // Use GSAP ticker for frame-synced updates
        let lastTime = null;
        this._velocityTicker = (time) => {
            if (lastTime === null) lastTime = time;
            const delta = time - lastTime;  // GSAP ticker time is already in seconds
            lastTime = time;

            this.root.position.x += (this._velocity.x ?? 0) * delta;
            this.root.position.y += (this._velocity.y ?? 0) * delta;
            this.root.position.z += (this._velocity.z ?? 0) * delta;
        };
        gsap.ticker.add(this._velocityTicker);
    }

    /**
     * Update velocity mid-flight (only works if startVelocityDrift is active).
     * @param {{x?,y?,z?}} newVelocity
     */
    setVelocity(newVelocity) {
        if (!this._velocity) {
            console.warn('Cube.setVelocity: no active velocity drift. Call startVelocityDrift first.');
            return;
        }
        Object.assign(this._velocity, newVelocity);
    }

    /**
     * Stop any active drift (position tween or velocity ticker).
     */
    stopDrift() {
        if (this._driftTween) {
            this._driftTween.kill();
            this._driftTween = null;
        }
        if (this._velocityTicker) {
            gsap.ticker.remove(this._velocityTicker);
            this._velocityTicker = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TUMBLE (auto-rotation)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Start continuous rotation on one or more axes.
     *
     * @param {{x?,y?,z?}} speed   degrees per second on each axis
     */
    startTumble(speed = { x: 15, y: 30, z: 10 }) {
        this.stopTumble();
        this._tumbleSpeed = { ...speed };

        let lastTime = null;
        this._tumbleTicker = (time) => {
            if (lastTime === null) lastTime = time;
            const delta = time - lastTime;  // GSAP ticker time is already in seconds
            lastTime = time;

            this.root.rotation.x += D2R((this._tumbleSpeed.x ?? 0) * delta);
            this.root.rotation.y += D2R((this._tumbleSpeed.y ?? 0) * delta);
            this.root.rotation.z += D2R((this._tumbleSpeed.z ?? 0) * delta);
        };
        gsap.ticker.add(this._tumbleTicker);
    }

    /**
     * Update tumble speed mid-flight.
     */
    setTumbleSpeed(newSpeed) {
        if (this._tumbleSpeed) Object.assign(this._tumbleSpeed, newSpeed);
    }

    stopTumble() {
        if (this._tumbleTicker) {
            gsap.ticker.remove(this._tumbleTicker);
            this._tumbleTicker = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ROTATION (one-shot animation, matches Chevron API)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Animate rotation to specific angles (degrees).
     * @returns {gsap.core.Tween}
     */
    rotateTo(x, y, z, vars = {}) {
        return gsap.to(this.root.rotation, {
            x: D2R(x),
            y: D2R(y),
            z: D2R(z),
            ...vars,
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SNAP SETTERS (no animation)
    // ═══════════════════════════════════════════════════════════════════════════

    setPosition(x, y, z) {
        this.root.position.set(
            _resolve(x, this.root.position.x),
            _resolve(y, this.root.position.y),
            _resolve(z, this.root.position.z),
        );
    }

    setRotation(x, y, z) {
        this.root.rotation.set(
            D2R(_resolve(x, THREE.MathUtils.radToDeg(this.root.rotation.x))),
            D2R(_resolve(y, THREE.MathUtils.radToDeg(this.root.rotation.y))),
            D2R(_resolve(z, THREE.MathUtils.radToDeg(this.root.rotation.z))),
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // APPEARANCE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Change the cube's color.
     * @param {string|number} color
     */
    setColor(color) {
        this.material.color.set(color);
    }

    /**
     * Change opacity (0–1).
     */
    setOpacity(opacity) {
        this.material.opacity = opacity;
        this.material.depthWrite = opacity >= 1;
        this.material.needsUpdate = true;
    }

    /**
     * Apply or replace the cube's texture.
     * @param {THREE.Texture|string} texture   Texture object or URL
     */
    setTexture(texture) {
        this._applyTexture(texture);
    }

    /**
     * Remove texture, revert to solid color.
     */
    clearTexture() {
        if (this.material.map) {
            this.material.map.dispose();
            this.material.map = null;
            this.material.needsUpdate = true;
        }
    }

    _applyTexture(texture) {
        if (typeof texture === 'string') {
            // Load from URL
            const loader = new THREE.TextureLoader();
            loader.load(texture, (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                this.material.map = tex;
                this.material.needsUpdate = true;
            });
        } else if (texture instanceof THREE.Texture) {
            this.material.map = texture;
            this.material.needsUpdate = true;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM ALIGNMENT (mirrors Chevron API)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Align the cube to a DOM element's position in world space.
     *
     * @param {string|HTMLElement} target
     * @param {object}   [opts]
     * @param {'center'|'top-left'|'top-right'|'bottom-left'|'bottom-right'} [opts.anchor='center']
     * @param {number}   [opts.z=0]
     * @param {string|number} [opts.offsetX=0]
     * @param {string|number} [opts.offsetY=0]
     * @param {gsap.TweenVars} [opts.animate]
     */
    alignToElement(target, { anchor = 'center', z = 0, offsetX = 0, offsetY = 0, animate } = {}) {
        const cam = this.camera;
        if (!cam) {
            console.warn('Cube.alignToElement: no camera provided.');
            return;
        }

        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) {
            console.warn(`Cube.alignToElement: element not found — "${target}"`);
            return;
        }

        cam.updateMatrixWorld();
        cam.updateProjectionMatrix();

        const mountRect  = this._mountEl?.getBoundingClientRect();
        const canvasW    = mountRect?.width  ?? window.innerWidth;
        const canvasH    = mountRect?.height ?? window.innerHeight;
        const canvasLeft = mountRect?.left   ?? 0;
        const canvasTop  = mountRect?.top    ?? 0;

        const rect            = el.getBoundingClientRect();
        const resolvedOffsetX = _resolveOffset(offsetX, rect.width);
        const resolvedOffsetY = _resolveOffset(offsetY, rect.height);

        const pixelX = _anchorX(rect, anchor) + resolvedOffsetX - canvasLeft;
        const pixelY = _anchorY(rect, anchor) + resolvedOffsetY - canvasTop;

        const ndcX =  (pixelX / canvasW) * 2 - 1;
        const ndcY = -(pixelY / canvasH) * 2 + 1;
        const world = _ndcToWorld(ndcX, ndcY, z, cam);

        if (animate) {
            return this.moveTo(world.x, world.y, world.z, animate);
        }
        this.root.position.set(world.x, world.y, world.z);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    dispose() {
        this.stopDrift();
        this.stopTumble();
        gsap.killTweensOf(this.root.position);
        gsap.killTweensOf(this.root.rotation);

        this.mesh.geometry.dispose();
        if (this.material.map) this.material.map.dispose();
        this.material.dispose();
    }
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function _resolve(value, current) {
    if (typeof value === 'string' && (value.startsWith('+') || value.startsWith('-'))) {
        return current + parseFloat(value);
    }
    return parseFloat(value);
}

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