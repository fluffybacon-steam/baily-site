import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Create a mirror object with highly reflective, shiny properties.
 * 
 * The mirror uses MeshStandardMaterial with:
 * - metalness: 1.0 (fully metallic/reflective)
 * - roughness: 0.0 (mirror-smooth)
 * - Additive blending for glow effect
 * - Optional emissive glow
 */

export class Mirror {
    /**
     * @param {object} opts
     * @param {string} [opts.shape='sphere']        'sphere', 'plane', 'cube', 'torus'
     * @param {number} [opts.size=2]                Size/scale
     * @param {string|number} [opts.color='#049ef4'] Mirror color/tint
     * @param {number} [opts.emissiveIntensity=100] Glow intensity
     * @param {boolean} [opts.addBlending=true]     Use additive blending
     * @param {THREE.Camera} [opts.camera]          For screenspace effects
     * @param {HTMLElement} [opts.mountEl]          For screenspace effects
     */
    constructor({
        shape = 'sphere',
        size = 2,
        color = '#049ef4',
        emissiveIntensity = 100,
        addBlending = true,
        camera = null,
        mountEl = null,
    } = {}) {
        this.camera = camera;
        this._mountEl = mountEl;
        this.size = size;
        this.color = new THREE.Color(color);

        // Create material (highly reflective)
        this.material = new THREE.MeshStandardMaterial({
            transparent: false,
            opacity: 1,
            color: this.color,
            emissive: this.color,
            emissiveIntensity: emissiveIntensity,
            metalness: 1.0,      // Fully reflective
            roughness: 0.0,      // Mirror-smooth
            blending: addBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
        });

        // Create geometry based on shape
        let geometry;
        switch (shape.toLowerCase()) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(size, 64, 64);
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(size, size, 32, 32);
                break;
            case 'cube':
                geometry = new THREE.BoxGeometry(size, size, size);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(size, size * 0.3, 32, 100);
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(size, 4);
                break;
            case 'icosahedron':
                geometry = new THREE.IcosahedronGeometry(size, 5);
                break;
            default:
                geometry = new THREE.SphereGeometry(size, 64, 64);
        }

        this.geometry = geometry;
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.root = new THREE.Group();
        this.root.add(this.mesh);

        // Store original properties for animations
        this._originalColor = this.color.clone();
        this._originalEmissiveIntensity = emissiveIntensity;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MATERIAL PROPERTIES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Change mirror color (and emissive color to match).
     * 
     * @param {string|number|THREE.Color} color
     * 
     * @example
     * mirror.setColor('#ff00ff');
     * mirror.setColor(0x049ef4);
     */
    setColor(color) {
        this.color.set(color);
        this.material.color.copy(this.color);
        this.material.emissive.copy(this.color);
        this.material.needsUpdate = true;
    }

    /**
     * Change emissive intensity (glow amount).
     * 
     * @param {number} intensity 0-1000+
     * 
     * @example
     * mirror.setEmissiveIntensity(500);
     */
    setEmissiveIntensity(intensity) {
        this.material.emissiveIntensity = intensity;
        this.material.needsUpdate = true;
    }

    /**
     * Animate color over time.
     * 
     * @param {string|number} targetColor
     * @param {object} vars  GSAP animation vars
     * @returns {gsap.core.Tween}
     * 
     * @example
     * mirror.animateColor('#ff0000', { duration: 2, repeat: -1, yoyo: true });
     */
    animateColor(targetColor, vars = {}) {
        const targetColorObj = new THREE.Color(targetColor);
        return gsap.to(this.color, {
            r: targetColorObj.r,
            g: targetColorObj.g,
            b: targetColorObj.b,
            ...vars,
            onUpdate: () => {
                this.material.color.copy(this.color);
                this.material.emissive.copy(this.color);
                this.material.needsUpdate = true;
            },
        });
    }

    /**
     * Animate emissive intensity.
     * 
     * @param {number} targetIntensity
     * @param {object} vars  GSAP vars
     * @returns {gsap.core.Tween}
     * 
     * @example
     * mirror.animateEmissive(0, { duration: 1.5, ease: 'power2.inOut' });
     */
    animateEmissive(targetIntensity, vars = {}) {
        const proxy = { intensity: this.material.emissiveIntensity };
        return gsap.to(proxy, {
            intensity: targetIntensity,
            ...vars,
            onUpdate: () => {
                this.material.emissiveIntensity = proxy.intensity;
                this.material.needsUpdate = true;
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // POSITION & ROTATION
    // ═══════════════════════════════════════════════════════════════════════════

    setPosition(x, y, z) {
        this.root.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.root.rotation.set(
            THREE.MathUtils.degToRad(x),
            THREE.MathUtils.degToRad(y),
            THREE.MathUtils.degToRad(z)
        );
    }

    /**
     * Animate to a position.
     * 
     * @param {number|object} x
     * @param {number} [y]
     * @param {number} [z]
     * @param {object} [vars]
     * @returns {gsap.core.Tween}
     */
    moveTo(x, y, z, vars = {}) {
        if (typeof x === 'object') {
            vars = y || {};
            y = x.y;
            z = x.z;
            x = x.x;
        }
        return gsap.to(this.root.position, { x, y, z, ...vars });
    }

    /**
     * Animate rotation.
     * 
     * @param {number} x  Degrees
     * @param {number} y  Degrees
     * @param {number} z  Degrees
     * @param {object} vars  GSAP vars
     * @returns {gsap.core.Tween}
     */
    rotateTo(x, y, z, vars = {}) {
        return gsap.to(this.root.rotation, {
            x: THREE.MathUtils.degToRad(x),
            y: THREE.MathUtils.degToRad(y),
            z: THREE.MathUtils.degToRad(z),
            ...vars,
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Pulse the mirror (size + glow).
     * 
     * @param {object} opts
     * @param {number} [opts.duration=1]      Pulse duration
     * @param {number} [opts.scale=1.3]       Max scale
     * @param {number} [opts.maxGlow=500]     Max emissive intensity
     * @param {number} [opts.repeat=-1]       -1 for infinite
     */
    pulse({ duration = 1, scale = 1.3, maxGlow = 500, repeat = -1 } = {}) {
        const baseIntensity = this.material.emissiveIntensity;

        gsap.to(this.root.scale, {
            x: scale,
            y: scale,
            z: scale,
            duration,
            repeat,
            yoyo: true,
            ease: 'sine.inOut',
        });

        gsap.to(this.material, {
            emissiveIntensity: maxGlow,
            duration,
            repeat,
            yoyo: true,
            ease: 'sine.inOut',
        });
    }

    /**
     * Spin the mirror.
     * 
     * @param {object} opts
     * @param {number} [opts.duration=3]   Rotation duration
     * @param {string} [opts.axis='y']     'x', 'y', or 'z'
     * @param {number} [opts.repeat=-1]    -1 for infinite
     */
    spin({ duration = 3, axis = 'y', repeat = -1 } = {}) {
        const rotVars = {
            duration,
            repeat,
            ease: 'none',
        };
        rotVars[axis] = Math.PI * 2;

        gsap.to(this.root.rotation, rotVars);
    }

    /**
     * Orbit around a point.
     * 
     * @param {object} opts
     * @param {THREE.Vector3|object} [opts.center={x:0,y:0,z:0}]  Orbit center
     * @param {number} [opts.radius=10]    Orbit radius
     * @param {number} [opts.duration=5]   Orbit speed
     * @param {number} [opts.height=0]     Height offset
     */
    orbit({ center = { x: 0, y: 0, z: 0 }, radius = 10, duration = 5, height = 0 } = {}) {
        let angle = 0;

        const orbitTicker = (time) => {
            angle = (time / duration) * Math.PI * 2;
            this.root.position.x = center.x + Math.cos(angle) * radius;
            this.root.position.y = center.y + height;
            this.root.position.z = center.z + Math.sin(angle) * radius;
        };

        gsap.ticker.add(orbitTicker);
        this._orbitTicker = orbitTicker;
    }

    /**
     * Stop orbiting.
     */
    stopOrbit() {
        if (this._orbitTicker) {
            gsap.ticker.remove(this._orbitTicker);
            this._orbitTicker = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Clean up resources.
     */
    dispose() {
        this.stopOrbit();
        gsap.killTweensOf(this.root);
        gsap.killTweensOf(this.root.position);
        gsap.killTweensOf(this.root.rotation);
        gsap.killTweensOf(this.root.scale);
        gsap.killTweensOf(this.material);

        this.geometry.dispose();
        this.material.dispose();
    }
}

// ════════════════════════════════════════════════════════════════════════════
// MIRROR PRESETS (Ready-to-use styles)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Preset: Classic Blue Mirror
 */
export function createBlueMirror(opts = {}) {
    return new Mirror({
        shape: 'sphere',
        size: 2,
        color: '#049ef4',
        emissiveIntensity: 200,
        ...opts,
    });
}

/**
 * Preset: Cyan Glowing Mirror
 */
export function createCyanMirror(opts = {}) {
    return new Mirror({
        shape: 'sphere',
        size: 2,
        color: '#00ffff',
        emissiveIntensity: 250,
        ...opts,
    });
}

/**
 * Preset: Magenta Mirror
 */
export function createMagentaMirror(opts = {}) {
    return new Mirror({
        shape: 'icosahedron',
        size: 1.5,
        color: '#ff00ff',
        emissiveIntensity: 180,
        ...opts,
    });
}

/**
 * Preset: Gold Mirror
 */
export function createGoldMirror(opts = {}) {
    return new Mirror({
        shape: 'octahedron',
        size: 2,
        color: '#ffaa00',
        emissiveIntensity: 150,
        ...opts,
    });
}

/**
 * Preset: Rainbow Morphing Mirror
 */
export function createRainbowMirror(opts = {}) {
    const mirror = new Mirror({
        shape: 'torus',
        size: 2,
        color: '#ff0000',
        emissiveIntensity: 200,
        ...opts,
    });

    const colors = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#ff00ff'];
    let colorIndex = 0;

    gsap.ticker.add((time) => {
        const newIndex = Math.floor(time * 0.5) % colors.length;
        if (newIndex !== colorIndex) {
            colorIndex = newIndex;
            mirror.setColor(colors[colorIndex]);
        }
    });

    return mirror;
}

/**
 * Preset: Pulsing Mirror (breathing effect)
 */
export function createPulsingMirror(opts = {}) {
    const mirror = new Mirror({
        shape: 'sphere',
        size: 1.5,
        color: '#00ffff',
        emissiveIntensity: 100,
        ...opts,
    });

    mirror.pulse({
        duration: 1.2,
        scale: 1.5,
        maxGlow: 400,
        repeat: -1,
    });

    return mirror;
}

/**
 * Preset: Spinning Mirror
 */
export function createSpinningMirror(opts = {}) {
    const mirror = new Mirror({
        shape: 'cube',
        size: 1.5,
        color: '#ff00ff',
        emissiveIntensity: 150,
        ...opts,
    });

    mirror.spin({
        duration: 4,
        axis: 'y',
        repeat: -1,
    });

    // Bonus: also rotate on X axis
    gsap.to(mirror.root.rotation, {
        x: Math.PI * 2,
        duration: 6,
        repeat: -1,
        ease: 'none',
    });

    return mirror;
}

/**
 * Preset: Super Bright Supernova
 */
export function createSupernovanMirror(opts = {}) {
    const mirror = new Mirror({
        shape: 'sphere',
        size: 2.5,
        color: '#ffff00',
        emissiveIntensity: 500,
        ...opts,
    });

    // Periodic bursts
    let burstTimer = 0;
    gsap.ticker.add((time) => {
        if (Math.floor(time / 3) > burstTimer) {
            burstTimer = Math.floor(time / 3);

            gsap.to(mirror.material, {
                emissiveIntensity: 1000,
                duration: 0.2,
                ease: 'power2.out',
            });

            gsap.to(mirror.material, {
                emissiveIntensity: 500,
                duration: 0.8,
                ease: 'power2.in',
                delay: 0.2,
            });
        }
    });

    return mirror;
}

/**
 * Preset: Dark/Matte (Anti-mirror)
 */
export function createDarkMirror(opts = {}) {
    const mirror = new Mirror({
        shape: 'sphere',
        size: 2,
        color: '#002244',
        emissiveIntensity: 20,
        addBlending: false,  // Normal blending for dark effect
        ...opts,
    });

    return mirror;
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE INTEGRATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Add a mirror to a RenderScene.
 * 
 * @param {RenderScene} scene
 * @param {string} id
 * @param {Mirror|object} mirrorOrOpts  Mirror instance or options
 * @returns {Mirror}
 * 
 * @example
 * const mirror = addMirrorToScene(scene, 'mirror1', {
 *     shape: 'sphere',
 *     color: '#049ef4',
 *     emissiveIntensity: 200,
 * });
 */
export function addMirrorToScene(scene, id, mirrorOrOpts) {
    let mirror;

    if (mirrorOrOpts instanceof Mirror) {
        mirror = mirrorOrOpts;
    } else {
        mirror = new Mirror(mirrorOrOpts || {});
    }

    scene.scene.add(mirror.root);
    return mirror;
}
