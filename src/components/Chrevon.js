import * as THREE from 'three';
import gsap from 'gsap';

const D2R = (d) => THREE.MathUtils.degToRad(d);

export class Chevron {
    /**
     * @param {object}             opts
     * @param {number}             opts.height
     * @param {number}             opts.radius
     * @param {number}             opts.angle       initial open angle (degrees)
     * @param {number}             opts.minAngle
     * @param {number}             opts.maxAngle
     * @param {string|THREE.Color} opts.color1
     * @param {string|THREE.Color} opts.color2
     * @param {THREE.Camera}       opts.camera      required for alignToElement
     */
    constructor({
        height   = 15,
        radius   = 2,
        angle    = 45,
        minAngle = 0,
        maxAngle = 90,
        color1   = 'red',
        color2   = 'green',
        camera   = null,
    } = {}) {
        this.c_height = height; 
        this.c_radius = radius;

        this.minAngle = minAngle;
        this.maxAngle = maxAngle;
        this.camera   = camera;

        // ── Geometry ─────────────────────────────────────────────────────────
        const geo = new THREE.CapsuleGeometry(radius, height, 10, 20);
        // this.material1 = new THREE.MeshBasicMaterial({ color: new THREE.Color(color1) });
        // this.material2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(color2) });
        this.material1 = new THREE.MeshBasicMaterial({ map: createGradientTexture('#00aeef', '#2d388a') });
        this.material2 = new THREE.MeshBasicMaterial({ map: createGradientTexture('#00aeef', '#2d388a') });

        const mesh1 = new THREE.Mesh(geo, this.material1);
        const mesh2 = new THREE.Mesh(geo, this.material2);

        // ── Groups ───────────────────────────────────────────────────────────
        // root  → position / rotate the whole chevron in world space
        // arm1/2 → GSAP tweens rotation.z directly on these
        this.root = new THREE.Group();
        this.arm1 = new THREE.Group();
        this.arm2 = new THREE.Group();
        this.root.add(this.arm1, this.arm2);

        const geoOffset = height / 2;
        mesh1.position.set(0, -geoOffset, 0);
        mesh2.position.set(0, -geoOffset, 0);
        this.arm1.add(mesh1);
        this.arm2.add(mesh2);

        // Snap to initial angle — no animation
        this._setAngleImmediate(angle);
    }

    // ── Convenience animation methods ────────────────────────────────────────
    // Each method returns a GSAP tween so it can be used standalone OR
    // dropped into a timeline with .add() / .to() / position offsets.
    //
    // Usage standalone:      chevron.open({ ease: 'elastic.out', duration: 1 })
    // Usage in a timeline:   tl.add(chevron.open({ duration: 0.6 }), '>')

    /**
     * Animate arms to maxAngle.
     * @param {gsap.TweenVars} [vars]  any GSAP tween vars (duration, ease, delay, onComplete…)
     * @returns {gsap.core.Tween}
     */
    open(vars = {}) {
        return this._animateAngle(this.maxAngle, vars);
    }

    /**
     * Animate arms to minAngle.
     * @param {gsap.TweenVars} [vars]
     * @returns {gsap.core.Tween}
     */
    close(vars = {}) {
        return this._animateAngle(this.minAngle, vars);
    }

    /**
     * Animate arms to an arbitrary angle (degrees).
     * @param {number}         deg
     * @param {gsap.TweenVars} [vars]
     * @returns {gsap.core.Tween}
     */
    setAngle(deg, vars = {}) {
        const clamped = Math.max(this.minAngle, Math.min(this.maxAngle, deg));
        return this._animateAngle(clamped, vars);
    }

    /** Snap to angle immediately with no animation. */
    snapAngle(deg) {
        gsap.killTweensOf([this.arm1.rotation, this.arm2.rotation]);
        this._setAngleImmediate(deg);
    }

    /**
     * Animate the whole chevron's world position.
     * When Z changes, the model tilts in the direction of travel and returns
     * to neutral by the time it arrives — like a plane pitching on takeoff.
     *
     * @param {number}         x
     * @param {number}         y
     * @param {number}         z
     * @param {object}         [vars]            any GSAP tween vars, plus:
     * @param {number}         [vars.tiltAngle=25]   peak tilt in degrees
     * @param {string}         [vars.tiltAxis='x']   rotation axis for the tilt ('x'|'y')
     * @param {string}         [vars.tiltEase='sine.inOut']
     * @returns {gsap.core.Timeline}
     */
    moveTo(x, y, z, vars = {}) {
        const {
            tiltAngle = 25,
            tiltAxis  = 'x',
            tiltEase  = 'sine.inOut',
            ...tweenVars
        } = vars;
 
        const duration = tweenVars.duration ?? 1;
        const deltaZ   = z - this.root.position.z;
        const tl       = gsap.timeline();
 
        // Always tween position
        tl.to(this.root.position, { x, y, z, ...tweenVars }, 0);
 
        // Only add tilt if Z is actually changing
        if (Math.abs(deltaZ) > 0.001) {
            // Tilt toward destination: positive deltaZ (toward camera) pitches forward (negative X)
            const peakRad = D2R(-Math.sign(deltaZ) * tiltAngle);
            const half    = duration / 2;
 
            tl.to(this.root.rotation, {
                    [tiltAxis]: peakRad,
                    duration:   half,
                    ease:       tiltEase,
                }, 0)
              .to(this.root.rotation, {
                    [tiltAxis]: 0,
                    duration:   half,
                    ease:       tiltEase,
                }, half);
        }
 
        return tl;
    }
 

    /**
     * Animate the whole chevron's rotation (degrees).
     * @param {number}         x
     * @param {number}         y
     * @param {number}         z
     * @param {gsap.TweenVars} [vars]
     * @returns {gsap.core.Tween}
     */
    rotateTo(x, y, z, vars = {}) {
        return gsap.to(this.root.rotation, {
            x: D2R(x), y: D2R(y), z: D2R(z),
            ...vars,
        });
    }

    // ── Snap setters (no animation) ───────────────────────────────────────────

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

    setColor(target, color) {
        const c = new THREE.Color(color);
        if (target === 'arm1' || target === 'both') this.material1.color.set(c);
        if (target === 'arm2' || target === 'both') this.material2.color.set(c);
    }

    // ── DOM alignment ─────────────────────────────────────────────────────────
     /**
     * Locks the chevron to its current apparent screen position so it scrolls
     * with the page like a normal DOM element — without being tied to a specific
     * element. Snapshots the current viewport position, converts to document
     * space, then recomputes world coords on every scroll event.
     *
     * @returns {Function} unlock — call to remove the scroll listener
     *
     * Usage:
     *   const unlock = chevron.lockToCurrentPosition();
     *   // later:
     *   unlock();
     */
    lockToCurrentPosition() {
        const cam = this.camera;
        if (!cam) {
            console.warn('Chevron.lockToCurrentPosition: no camera provided.');
            return () => {};
        }
 
        cam.updateMatrixWorld();
        cam.updateProjectionMatrix();
 
        // Project current world position → viewport pixels
        const projected = this.root.position.clone().project(cam);
        const vpX = ( projected.x + 1) / 2 * window.innerWidth;
        const vpY = (-projected.y + 1) / 2 * window.innerHeight;
 
        // Convert viewport px → document px (scroll-invariant)
        const docX  = vpX + window.scrollX;
        const docY  = vpY + window.scrollY;
        const worldZ = this.root.position.z;  // preserve depth
 
        const update = () => {
            // Convert document px back to current viewport px
            const currentVpX =  docX - window.scrollX;
            const currentVpY =  docY - window.scrollY;
 
            // Viewport px → NDC
            const ndcX =  (currentVpX / window.innerWidth)  * 2 - 1;
            const ndcY = -(currentVpY / window.innerHeight) * 2 + 1;
 
            cam.updateMatrixWorld();
            const world = _ndcToWorld(ndcX, ndcY, worldZ, cam);
            this.root.position.set(world.x, world.y, world.z);
        };
 
        window.addEventListener('scroll', update, { passive: true });
 
        // Store so dispose() can clean up if lock is still active
        this._unlockScroll = () => window.removeEventListener('scroll', update);
        return this._unlockScroll;
    }
 
    /**
     * Remove an active scroll lock if one exists.
     */
    unlock() {
        this._unlockScroll?.();
        this._unlockScroll = null;
    }

    /**
     * @param {number} pixelHeight 
     * @returns {z} z value to scale chrevon to appropiate height
     */
    getZForPixelHeight(pixelHeight) {
        console.log(this);
        const cam           = this.camera;
        const chevronHeight = this.c_height + this.c_radius * 2;
        const fovRad        = THREE.MathUtils.degToRad(cam.fov);
        const visibleAtZ0   = 2 * Math.tan(fovRad / 2) * cam.position.z;
        const worldTarget   = (pixelHeight / window.innerHeight) * visibleAtZ0;
        const result        = cam.position.z - (chevronHeight * cam.position.z) / worldTarget;

        console.table({
            pixelHeight,
            chevronHeight,
            'cam.fov':       cam?.fov,
            'cam.position.z': cam?.position.z,
            fovRad,
            visibleAtZ0,
            worldTarget,
            result,
        });

        return result;
    }
    
    /**
     * Align the chevron to a DOM element's position in world space.
     *
     * @param {string|HTMLElement} target
     * @param {object}   [opts]
     * @param {'center'|'top-left'|'top-right'|'bottom-left'|'bottom-right'} [opts.anchor='center']
     * @param {number}   [opts.z=0]          world-space Z depth
     * @param {string|number} [opts.offsetX=0]  horizontal offset — px number or '50%' of element width
     * @param {string|number} [opts.offsetY=0]  vertical offset   — px number or '50%' of element height
     * @param {THREE.Camera}  [opts.camera]   override instance camera
     * @param {gsap.TweenVars} [opts.animate] if provided, animate instead of snap
     */
    alignToElement(target, { anchor = 'center', z = 0, offsetX = 0, offsetY = 0, camera, animate } = {}) {
        const cam = camera ?? this.camera;
        if (!cam) {
            console.warn('Chevron.alignToElement: no camera provided.');
            return;
        }
 
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) {
            console.warn(`Chevron.alignToElement: element not found — "${target}"`);
            return;
        }
 
        cam.updateMatrixWorld();
        cam.updateProjectionMatrix();
 
        const rect = el.getBoundingClientRect();
 
        // Resolve offsets — accept raw px numbers or percentage strings e.g. '50%'
        const resolvedOffsetX = _resolveOffset(offsetX, rect.width);
        const resolvedOffsetY = _resolveOffset(offsetY, rect.height);
 
        const pixelX = _anchorX(rect, anchor) + resolvedOffsetX;
        const pixelY = _anchorY(rect, anchor) + resolvedOffsetY;
        const ndcX   =  (pixelX / window.innerWidth)  * 2 - 1;
        const ndcY   = -(pixelY / window.innerHeight) * 2 + 1;
        const world  = _ndcToWorld(ndcX, ndcY, z, cam);
 
        if (animate) {
            return this.moveTo(world.x, world.y, world.z, animate);
        }
        this.root.position.set(world.x, world.y, world.z);
    }

    // ── Disposal ──────────────────────────────────────────────────────────────

    dispose() {
        gsap.killTweensOf([this.arm1.rotation, this.arm2.rotation, this.root.position, this.root.rotation]);
        this.arm1.children[0]?.geometry.dispose();
        this.material1.dispose();
        this.material2.dispose();
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    /**
     * Core tween builder — both arms move symmetrically.
     * Returns a GSAP timeline so both arms animate as one unit.
     */
    _animateAngle(deg, vars = {}) {
        const rad = D2R(deg);
        const tl  = gsap.timeline();
        tl.to(this.arm1.rotation, { z:  rad, ...vars }, 0)
          .to(this.arm2.rotation, { z: -rad, ...vars }, 0); // '<' = same time
        return tl;
    }

    _setAngleImmediate(deg) {
        const rad = D2R(Math.max(this.minAngle, Math.min(this.maxAngle, deg)));
        this.arm1.rotation.z =  rad;
        this.arm2.rotation.z = -rad;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve a value against a current value.
 * - String starting with '+' or '-' → relative:  '+10' means current + 10
 * - Plain number or numeric string  → absolute:   10 means exactly 10
 */
function _resolve(value, current) {
    if (typeof value === 'string' && (value.startsWith('+') || value.startsWith('-'))) {
        return current + parseFloat(value);
    }
    return parseFloat(value);
}

/**
 * Resolve an offset value to pixels.
 * Accepts a plain number (px) or a percentage string relative to a reference size.
 * Examples: 10, -20, '50%', '-25%'
 */
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

function createGradientTexture(colorStart, colorEnd) {
    const canvas = document.createElement('canvas');
    canvas.width  = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, colorStart);
    grad.addColorStop(1, colorEnd);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; // ← this
    return texture;
}