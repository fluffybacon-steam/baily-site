import * as THREE from 'three';

/**
 * Fog — atmospheric depth fog for the scene.
 *
 * Wraps THREE.Fog (linear) or THREE.FogExp2 (exponential) with a
 * mutation-friendly API that plays well with GSAP tweening.
 *
 * ─── Quick start ──────────────────────────────────────────────
 *
 *   const fog = new Fog(scene, {
 *       color: '#0a0a1a',
 *       near:  20,
 *       far:   120,
 *   });
 *
 * ─── Exponential fog ─────────────────────────────────────────
 *
 *   const fog = new Fog(scene, {
 *       type:    'exponential',
 *       color:   '#0a0a1a',
 *       density: 0.025,
 *   });
 *
 * ─── GSAP animation ─────────────────────────────────────────
 *
 * All scalar properties are direct getters/setters, so GSAP
 * can tween them without wrappers:
 *
 *   gsap.to(fog, { near: 5, far: 60, duration: 2 });
 *   gsap.to(fog, { density: 0.05, duration: 1.5 });
 *
 * For colour, tween the underlying THREE.Color:
 *
 *   gsap.to(fog.color, { r: 0.1, g: 0, b: 0.2, duration: 1 });
 *
 * ─── Scene background sync ──────────────────────────────────
 *
 * Fog looks best when the scene background matches the fog colour.
 * Pass `syncBackground: true` and the scene background is set
 * automatically on construction and whenever you call setColor().
 *
 *   const fog = new Fog(scene, {
 *       color: '#0a0a1a',
 *       syncBackground: true,
 *   });
 *
 * @example — fade-in fog on scroll
 * const fog = new Fog(scene, { color: '#1a1a2e', near: 200, far: 200 });
 * gsap.to(fog, { near: 10, far: 80, duration: 3, ease: 'power2.inOut' });
 */

export class Fog {
    /**
     * @param {THREE.Scene|object} scene   THREE.Scene or RenderScene wrapper
     * @param {object}             [opts]
     * @param {'linear'|'exponential'} [opts.type='linear']
     * @param {string|THREE.Color} [opts.color='#000000']
     * @param {number}             [opts.near=10]       linear fog start distance
     * @param {number}             [opts.far=100]       linear fog end distance
     * @param {number}             [opts.density=0.02]  exponential fog density
     * @param {boolean}            [opts.syncBackground=false]
     */
    constructor(scene, {
        type           = 'linear',
        color          = '#000000',
        near           = 10,
        far            = 100,
        density        = 0.02,
        syncBackground = false,
    } = {}) {
        // Accept raw THREE.Scene or RenderScene wrapper
        this._scene = scene.scene instanceof THREE.Scene ? scene.scene : scene;
        this._type  = type;
        this._syncBackground = syncBackground;

        const fogColor = new THREE.Color(color);

        if (type === 'exponential') {
            this._fog = new THREE.FogExp2(fogColor, density);
        } else {
            this._fog = new THREE.Fog(fogColor, near, far);
        }

        this._scene.fog = this._fog;

        if (syncBackground) {
            this._scene.background = fogColor.clone();
        }
    }

    // ── Accessors (GSAP-friendly) ─────────────────────────────────────────────

    /** The fog colour object — tween with gsap.to(fog.color, { r, g, b }). */
    get color() { return this._fog.color; }

    /** Linear fog: start distance. */
    get near() { return this._fog.near ?? 0; }
    set near(v) {
        if (this._fog.near !== undefined) this._fog.near = v;
    }

    /** Linear fog: end distance (fully opaque). */
    get far() { return this._fog.far ?? 0; }
    set far(v) {
        if (this._fog.far !== undefined) this._fog.far = v;
    }

    /** Exponential fog: density. */
    get density() { return this._fog.density ?? 0; }
    set density(v) {
        if (this._fog.density !== undefined) this._fog.density = v;
    }

    // ── Setters ───────────────────────────────────────────────────────────────

    /**
     * Change the fog colour.
     * @param {string|THREE.Color} color
     */
    setColor(color) {
        this._fog.color.set(color);
        if (this._syncBackground) {
            this._scene.background = this._fog.color.clone();
        }
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    /** Remove fog from the scene. */
    dispose() {
        this._scene.fog = null;
    }
}