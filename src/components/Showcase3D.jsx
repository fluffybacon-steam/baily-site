'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import MotionPathPlugin from 'gsap/dist/MotionPathPlugin';
gsap.registerPlugin(MotionPathPlugin);
import Scene from '@/components/Scene';      // your existing Scene wrapper
import DonovanIcon from '@/icons/donovan.svg';
import { hideTooltip, showTooltip } from '@/lib/helper';

// ─── Sketchfab GLTF loader (uncomment when you have models) ─────────────────
// import { GLTFLoader }  from 'three/examples/jsm/loaders/GLTFLoader';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// ─── Icon imports for the highlight rail ─────────────────────────────────────
import nextjs    from '@/icons/nextjs.svg?url';
import salsify   from '@/icons/salsify.svg?url';
import restApi   from '@/icons/rest-api.svg?url';
import python    from '@/icons/python.svg?url';
import greensock from '@/icons/gsap.svg?url';
import html5     from '@/icons/html5.svg?url';
import syndigo   from '@/icons/syndigo.svg?url';
import shopify   from '@/icons/shopify.svg?url';

import RestApiIcon from '@/icons/rest-api.svg';
import Html5Icon   from '@/icons/html5.svg';
import NextjsIcon  from '@/icons/nextjs.svg';

const D2R = (d) => THREE.MathUtils.degToRad(d);
/* ═══════════════════════════════════════════════════════════════════════════════
 *  PROJECT DATA
 *  Same data from the original Showcase — no changes needed.
 * ═══════════════════════════════════════════════════════════════════════════════ */

const project_list = [
    {
        highlights: ['nextjs', 'typescript', 'google-auth', 'google-sheets'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/workout_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/workout_mobile.webp',
        agency: '', url: 'https://github.com/fluffybacon-steam/WorkoutManager',
        copy: `<p>An open-source spreadsheet-to-app planner for tracking workout programs, cross-platform tracking &amp; backup enabled through Google Sheets API connection. User authentication powered by Google OAuth.</p><p>Development is active &amp; ongoing.</p>`,
        id: 'Workout Planner',
    },
    {
        highlights: ['wordpress', 'php', 'rest-api'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/demkota_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/demkota_mobile.webp',
        agency: 'donovan', url: 'https://www.demkotaranchbeef.com/',
        copy: `<p>I was involved in the design &amp; responsible in the implementation of Demkota's Product Catalog.</p><p>This represented my time using AJAX and WordPress's REST API to create a user-filterable catalog.</p>`,
        id: 'Demkota Ranch Beef',
    },
    {
        highlights: ['wordpress', 'php', 'greensock'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/donovan_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/donovan_mobile.webp',
        agency: 'donovan', url: 'https://donovanadv.com',
        copy: `<p>This website was part of my former agency's re-brand.</p><p>As lead developer, I utilized <a href='https://gsap.com/'>GSAP</a> animation library to bring the movement-centric design to life.</p>`,
        id: 'Donovan Advertising',
    },
    {
        highlights: ['wordpress', 'php', 'react'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/furmanos_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/furmanos_mobile.webp',
        agency: 'donovan', url: 'https://furmanos.com',
        copy: `<p>This project marked my first experience integrating state-monitoring React.js components within a WordPress environment.</p><p>As the lead developer, I'm especially proud of the single recipe page.</p>`,
        id: 'Furmano Foods',
    },
    {
        highlights: ['wordpress', 'php'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/hammond_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/hammond_mobile.webp',
        agency: '', url: 'https://hammondelectricalservices.com',
        copy: `<p>My first freelancer client! 🥳</p><p>Site-map, Design, Copywriting, and Development handled solely by me. Additionally, I ran a Paid Search campaign generating 43k+ impressions and 40+ leads.</p>`,
        id: 'Hammond Electrical',
    },
    {
        highlights: ['wordpress', 'php', 'salsify'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/justbare_og_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/justbare_og_mobile.webp',
        agency: 'donovan', url: 'https://justbarefoods.com',
        copy: `<p>A branded website for a popular brand of prepared and fresh chicken products.</p><p>Custom API integration with Salsify for seamless product synchronization.</p>`,
        id: 'Just Bare Foods',
    },
    {
        highlights: ['html5', 'css'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/naeveag_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/naeveag_mobile.webp',
        agency: '', url: 'https://naeveag.com',
        copy: `<p>A brochure website for one of the largest agriculture production operations in Iowa.</p>`,
        id: 'Naeve Ag Production',
    },
    {
        highlights: ['wordpress', 'php'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/perdueanimal_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/perdueanimal_mobile.webp',
        agency: 'donovan', url: 'https://www.perdueanimalnutrition.com',
        copy: `<p>Brochure website for Perdue Animal Nutrition's feed division.</p><p>I'm especially proud of the Weekly Dairy Report — a custom widget that parses uploaded PDFs into a clean homepage display.</p>`,
        id: 'Perdue Animal Nutrition',
    },
    {
        highlights: ['wordpress', 'php', 'salsify', 'woo'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrims_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrims_mobile.webp',
        agency: 'donovan', url: 'https://pilgrimsusa.com',
        copy: `<p>Branded website for a multi-national food company with unique product accent color integration across WooCommerce.</p><p>Custom Salsify API for automatic product data sync.</p>`,
        id: 'Pilgrims USA',
    },
    {
        highlights: ['wordpress', 'php', 'syndigo'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrimsfoodservice_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrimsfoodservice_mobile.webp',
        agency: 'donovan', url: '',
        copy: `<p>Custom Syndigo API integration for seamless product data synchronization.</p><p>Note: this site is no longer in service.</p>`,
        id: 'Pilgrims Foodservice',
    },
    {
        highlights: ['wordpress', 'php', 'react'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/sunnyvalley_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/sunnyvalley_mobile.webp',
        agency: 'donovan', url: 'https://www.sunnyvalleysmokedmeats.com/',
        copy: `<p>Branded website for one of California's most prominent Smoked Meats providers.</p><p>Proud of the subtle animations and responsive curved design elements.</p>`,
        id: 'Sunny Valley Meats',
    },
    {
        highlights: ['shopify'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/meijiamerica_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/meijiamerica_mobile.webp',
        agency: 'donovan', url: 'https://meijiamerica.com/',
        copy: `<p>Brochure site for the famous Japanese food company.</p><p>Utilized custom &amp; inline Liquid code to achieve the desired look within a pre-existing Shopify theme.</p>`,
        id: 'Meiji America',
    },
    {
        highlights: ['wordpress', 'php'],
        desktop: 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrimspraise_desktop.webp',
        mobile:  'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrimspraise_mobile.webp',
        agency: 'donovan', url: '',
        copy: `<p>Digital replacement for Pilgrim's traditionally-paper employee appreciation cards.</p><p>Features an employee identification verification system and automatic email mapping schema.</p>`,
        id: 'Pilgrims Praise',
    },
];


/* ═══════════════════════════════════════════════════════════════════════════════
 *  CONFIGURATION — tweak these to taste
 * ═══════════════════════════════════════════════════════════════════════════════ */

const PHONE_BODY_W = 3.2, PHONE_BODY_H = 6.4, bodyD = 0.1;

const MONITOR_BODY_W = 9.6;
const MONITOR_BODY_H = 5.8;
const MONITOR_STAND_NECK_H = 0.8;
const MONITOR_STAND_BASE_H = 0.2;
// Full height including stand: bodyH + neck + base
const MONITOR_TOTAL_H = MONITOR_BODY_H + MONITOR_STAND_NECK_H + MONITOR_STAND_BASE_H;

const nud_x = 1;
const nud_y = 1;
const nud_z = 0;

const CONFIG = {
    // ── Device placement (world units) ───────────────────────────────────────
    monitor: {
        // Adding the nudge to the original base position (1, 0, 0)
        position: new THREE.Vector3(1 + nud_x, 0 + nud_y, 0 + nud_z),
        rotation: new THREE.Euler(0, 0, 0),
        screenAspect: 16 / 9,
    },
    phone: {
        // Adding the same nudge to the original base position (-3, -2, 1)
        position: new THREE.Vector3(-3 + nud_x, -1.5 + nud_y, 1 + nud_z),
        rotation: new THREE.Euler(0, 0.2, 0),
        screenAspect: 9 / 16,
    },

    // ── Camera ───────────────────────────────────────────────────────────────
    cameraPadding: 1.5,
    cameraZFallback: 18,

    // ── Orbit (mouse drag to rotate camera around devices) ───────────────
    orbit: {
        target:        new THREE.Vector3(1.5, 0, 0),   // focus point between devices
        damping:       0.08,            // smoothing factor (0 = frozen, 1 = instant)
        sensitivity:   0.002,           // radians per pixel of drag
        minPolar:      Math.PI * 0.25,  // clamp vertical: don't go under the floor
        maxPolar:      Math.PI * 0.65,  // clamp vertical: don't flip over the top
        minAzimuth:   -Math.PI * 0.35,  // clamp horizontal: how far left
        maxAzimuth:    Math.PI * 0.35,  // clamp horizontal: how far right
        returnSpeed:   0.02,            // how fast camera drifts back to rest when idle
    },

    // ── Idle animation ───────────────────────────────────────────────────────
    // Set to 0 to disable
    floatAmplitude: 0,       // world units up/down
    floatFrequency: 0,       // cycles per second

    // ── Transition ───────────────────────────────────────────────────────────
    transitionDuration: 0.8,    // seconds for full project swap animation
};


/* ═══════════════════════════════════════════════════════════════════════════════
 *  PROCEDURAL DEVICE MODELS
 * ═══════════════════════════════════════════════════════════════════════════════ */

function createMonitorModel() {
    const group = new THREE.Group();
    group.name = 'monitor_device';

    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1f,
        roughness: 0.35,
        metalness: 0.8,
    });
    const bezelMat = new THREE.MeshStandardMaterial({
        color: 0x0d0d10,
        roughness: 0.2,
        metalness: 0.9,
    });
    const screenMat = new THREE.MeshBasicMaterial({
        color: 0x222233,
        side: THREE.FrontSide,
    });

    const bodyW = MONITOR_BODY_W, bodyH = MONITOR_BODY_H, bodyD = 0.35;
    const bezelW = 0.2;
    const bottomBezel = 0.45;
    const screenW = bodyW - bezelW * 2;
    const screenH = bodyH - bezelW - bottomBezel;
    const standNeckW = 0.6, standNeckH = MONITOR_STAND_NECK_H, standNeckD = 0.4;
    const standBaseW = 1, standBaseH = MONITOR_STAND_BASE_H, standBaseD = 1.6;

    const faceZ = bodyD / 2;

    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), bodyMat);
    body.name = 'monitor_body';
    group.add(body);

    const outerW = bodyW + 0.02, outerH = bodyH + 0.02;
    const bezelShape = new THREE.Shape();
    bezelShape.moveTo(-outerW / 2, -outerH / 2);
    bezelShape.lineTo( outerW / 2, -outerH / 2);
    bezelShape.lineTo( outerW / 2,  outerH / 2);
    bezelShape.lineTo(-outerW / 2,  outerH / 2);
    bezelShape.closePath();

    const hole = new THREE.Path();
    const holeYOffset = (bottomBezel - bezelW) / 2;
    hole.moveTo(-screenW / 2,  -screenH / 2 - holeYOffset);
    hole.lineTo( screenW / 2,  -screenH / 2 - holeYOffset);
    hole.lineTo( screenW / 2,   screenH / 2 - holeYOffset);
    hole.lineTo(-screenW / 2,   screenH / 2 - holeYOffset);
    hole.closePath();
    bezelShape.holes.push(hole);

    const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
        depth: 0.06,
        bevelEnabled: false,
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.z = faceZ;
    bezel.name = 'monitor_bezel';
    group.add(bezel);

    const screenYOffset = (bottomBezel - bezelW) / 2;
    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(screenW, screenH),
        screenMat,
    );
    screen.position.set(0, -screenYOffset, faceZ + 0.01);
    screen.name = 'monitor_screen';
    group.add(screen);

    const neck = new THREE.Mesh(
        new THREE.BoxGeometry(standNeckW, standNeckH, standNeckD),
        bodyMat,
    );
    neck.position.set(0, -(bodyH / 2 + standNeckH / 2), 0);
    group.add(neck);

    const baseRight = new THREE.Mesh(
        new THREE.BoxGeometry(standBaseW/2, standBaseH, standBaseD),
        bodyMat,
    );
    baseRight.position.set(standNeckW, -(bodyH / 2 + standNeckH + standBaseH / 2), standNeckD / 2);
    baseRight.rotation.set(0,1,0)
    group.add(baseRight);
    const baseLeft = new THREE.Mesh(
        new THREE.BoxGeometry(standBaseW/2, standBaseH, standBaseD),
        bodyMat,
    );
    baseLeft.position.set(-standNeckW, -(bodyH / 2 + standNeckH + standBaseH / 2), standNeckD / 2);
    baseLeft.rotation.set(0,-1,0)
    group.add(baseLeft);

    return { group, screenMesh: screen, screenMaterial: screenMat };
}

// function cameraZToFitHeight(worldH, fovDeg, canvasPixelH, targetPixelH) {
//     const fovRad = THREE.MathUtils.degToRad(fovDeg);
//     return (worldH * canvasPixelH) / (targetPixelH * 2 * Math.tan(fovRad / 2));
// }

function createPhoneModel() {
    const group = new THREE.Group();
    group.name = 'phone_device';

    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1f,
        roughness: 0.25,
        metalness: 0.85,
    });
    const screenMat = new THREE.MeshBasicMaterial({
        color: 0x222233,
        side: THREE.FrontSide,
    });

    const bezelW = 0.15;
    const screenW = PHONE_BODY_W - bezelW * 2;
    const screenH = PHONE_BODY_H - bezelW * 2 - 0.15;
    const cornerRadius = 0.35;

    // 1. Main Body
    const bodyShape = createRoundedRectShape(PHONE_BODY_W, PHONE_BODY_H, cornerRadius);
    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
        depth: bodyD,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 3,
    });
    bodyGeo.center();
    bodyGeo.computeBoundingBox();

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.name = 'phone_body';
    group.add(body);

    const frontZ = bodyGeo.boundingBox.max.z;

    // 2. The Screen (Original PlaneGeo)
    const screenGeo = new THREE.PlaneGeometry(screenW, screenH);
    const screen = new THREE.Mesh(screenGeo, screenMat);
    // Move it slightly back so it sits behind the frame we're about to add
    screen.position.set(0.0, 0.0, frontZ + 0.005);
    screen.name = 'phone_screen';
    group.add(screen);

    // 3. The Additional Frame (Body shape with a Screen hole)
    const frameShape = createRoundedRectShape(PHONE_BODY_W, PHONE_BODY_H, cornerRadius);
    const screenRadius = cornerRadius * 0.8; // Rounded inner corners
    const holePath = createRoundedRectShape(screenW, screenH, screenRadius);
    
    // Add the hole to the shape
    frameShape.holes.push(holePath);

    const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
        depth: 0.002, // Very thin layer
        bevelEnabled: false
    });
    frameGeo.center();

    const frame = new THREE.Mesh(frameGeo, bodyMat);
    frame.position.set(0, 0, frontZ + 0.01); // Layered on top
    frame.name = 'phone_frame';
    group.add(frame);

    return { group, screenMesh: screen, screenMaterial: screenMat };
}

function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const hw = w / 2, hh = h / 2;
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  TEXTURE CACHE
 * ═══════════════════════════════════════════════════════════════════════════════ */

function nextImageProxy(url, width = 1920, quality = 80) {
    if (!url) return url;
    if (url.startsWith('/') || url.startsWith('data:')) return url;
    return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}

class TextureCache {
    constructor() {
        this._cache = new Map();
    }

    get(url) {
        if (!url) return Promise.resolve(null);
        if (this._cache.has(url)) return Promise.resolve(this._cache.get(url));

        return new Promise((resolve, reject) => {
            const img = new window.Image();
            const proxiedUrl = nextImageProxy(url);

            img.onload = () => {
                const tex = new THREE.Texture(img);
                tex.colorSpace      = THREE.SRGBColorSpace;
                tex.minFilter       = THREE.LinearFilter;
                tex.magFilter       = THREE.LinearFilter;
                tex.generateMipmaps = false;
                tex.needsUpdate     = true;
                this._cache.set(url, tex);
                resolve(tex);
            };

            img.onerror = (err) => {
                console.error('[TextureCache] FAILED to load:', url, '→', proxiedUrl, err);
                reject(new Error(`Texture load failed: ${url}`));
            };

            img.src = proxiedUrl;
        });
    }

    preload(urls) {
        urls.forEach((url) => { if (url) this.get(url).catch(() => {}); });
    }

    dispose() {
        this._cache.forEach((tex) => tex.dispose());
        this._cache.clear();
    }
}


/* ═══════════════════════════════════════════════════════════════════════════════
 *  SCENE SETUP HELPERS
 * ═══════════════════════════════════════════════════════════════════════════════ */

function setupLighting(threeScene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    threeScene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff4e6, 1.2);
    key.position.set(8, 10, 10);
    key.castShadow = false;
    threeScene.add(key);

    const fill = new THREE.DirectionalLight(0xd0e8ff, 0.5);
    fill.position.set(-6, 4, 5);
    threeScene.add(fill);

    const rim = new THREE.PointLight(0x00aeef, 60, 50);
    rim.position.set(0, 2, -8);
    threeScene.add(rim);

    return { ambient, key, fill, rim };
}


/* ═══════════════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export default function Showcase3D() {
    const [activeIndex, setActiveIndex]   = useState(0);
    const [isTransitioning, setTransitioning] = useState(false);

    const sceneRef       = useRef(null);
    const devicesRef     = useRef(null);
    const texCacheRef    = useRef(new TextureCache());
    const idleTweenRef   = useRef(null);
    const rafRef         = useRef(null);
    const orbitRef       = useRef(null);
    const dragOverlayRef = useRef(null);

    const activeProject = project_list[activeIndex];

    const svgRef = useRef(null);

    // ─────────────────────────────────────────────────────────────────────────
    //  SCENE READY
    // ─────────────────────────────────────────────────────────────────────────
    const handleSceneReady = useCallback(({ scene: renderScene }) => {
        sceneRef.current = renderScene;
        const threeScene = renderScene.scene;
        const camera     = renderScene.camera;
        const containerEl = document.querySelector('.showcase-3d .devices');

        // ── Lighting ────────────────────────────────────────────────────
        setupLighting(threeScene);

        // ── Create devices ──────────────────────────────────────────────
        const monitor = createMonitorModel();
        const phone   = createPhoneModel();

        monitor.group.rotation.copy(CONFIG.monitor.rotation);
        
        threeScene.add(monitor.group);
        threeScene.add(phone.group);
        
        devicesRef.current = { monitor, phone };
        
        const layoutDevices = () => {
            const monitorZ = renderScene.getZForWorldWidth(MONITOR_BODY_W, Math.max(400, containerEl.offsetWidth / 1.25));
            const monitorXYZ = renderScene.getElementWorldPosition(containerEl, { anchor: "top-right", z: monitorZ });
            monitor.group.position.set(
                monitorXYZ.x - MONITOR_BODY_W / 2,
                monitorXYZ.y - MONITOR_BODY_H / 2,
                monitorZ
            );

            const phoneZ = monitorZ + 1;
            const phoneXYZ = renderScene.getElementWorldPosition(containerEl, { anchor: "bottom-left", z: phoneZ });
            const phoneRatio = 0.175;
            const phoneScale = (MONITOR_BODY_W * phoneRatio) / PHONE_BODY_W;
            phone.group.scale.setScalar(phoneScale);
            phone.group.position.set(
                phoneXYZ.x + (PHONE_BODY_W * phoneScale) / 2,
                phoneXYZ.y + (PHONE_BODY_H * phoneScale) / 2,
                monitorZ + 1
            );

            const offset_x = Math.abs(monitor.group.position.x - phone.group.position.x) / 6;
            const offset_y = Math.abs(monitor.group.position.y - phone.group.position.y) / 4;
            phone.group.position.x += offset_x / 2;
            monitor.group.position.x -= offset_x / 2;
            phone.group.position.y += offset_y;

            return monitorZ;
        };
        const monitorZ = layoutDevices();

        const tl_phone_flip = gsap.timeline();

        //pick up phone
        tl_phone_flip.fromTo(phone.group.position,{
            x: phone.group.position.x + 1.25,
            y: phone.group.position.y - 3,
            // z: phone.group.position.z - 0.5,
        },{
            x:phone.group.position.x,
            // z:phone.group.position.z,
            y:phone.group.position.y,
            duration:2,
            ease:'power1.inOut'
        }, 0)

        //flip phone
        .fromTo(phone.group.position,{
            z: phone.group.position.z - 5,
        },{
            z: phone.group.position.z,
            duration:2,
            ease:'back.out(1.7)'
        }, 0)

        //display phone
        .fromTo(phone.group.rotation,{
            x: 1.56,
            y: 0,
            z: -0.5,
        },{
            x:CONFIG.phone.rotation.x,
            y:CONFIG.phone.rotation.y,
            z:CONFIG.phone.rotation.z,
            duration:2,
            ease:'power1.inOut'
        }, 0);

        // tl_phone_flip.duration(1);
        // ── Load initial textures ───────────────────────────────────────
        const tc = texCacheRef.current;
        const firstProject = project_list[0];

        const applyTexture = (material, tex) => {
            material.map = tex;
            material.color.set(0xffffff);
            material.needsUpdate = true;
        };

        Promise.all([
            tc.get(firstProject.desktop),
            tc.get(firstProject.mobile),
        ]).then(([desktopTex, mobileTex]) => {
            if (desktopTex) applyTexture(monitor.screenMaterial, desktopTex);
            if (mobileTex)  applyTexture(phone.screenMaterial,   mobileTex);
        }).catch((err) => {
            console.error('[Showcase3D] Initial texture load failed:', err);
            monitor.screenMaterial.color.set(0xff00ff);
            phone.screenMaterial.color.set(0xff00ff);
        });

        tc.preload([
            project_list[1]?.desktop,
            project_list[1]?.mobile,
        ]);

        // return;

        // ══════════════════════════════════════════════════════════════════
        //  ORBIT CAMERA — spherical coordinates around a focus target
        //
        //  theta  = azimuthal angle (horizontal, around Y axis)
        //  phi    = polar angle (vertical, from +Y down)
        //  radius = distance from target
        //
        //  Rest radius is derived from the fitted Z so the initial
        //  view always frames the monitor to its container.
        // ══════════════════════════════════════════════════════════════════

        const orbitCfg  = CONFIG.orbit;
        orbitCfg.target.set(0, 0, monitorZ);
        let restRadius = camera.position.z - monitorZ; 
        // orbitCfg.target.set(
        //     (monitor.group.position.x + phone.group.position.x) / 2,
        //     (monitor.group.position.y + phone.group.position.y) / 2,
        //     monitorZ
        // );
        // let restRadius  = camera.position.z - orbitCfg.target.z;       
        const restTheta = 0;
        const restPhi   = Math.PI / 2;

        const orbit = {
            theta:       restTheta,
            phi:         restPhi,
            radius:      restRadius,
            thetaTarget: restTheta,
            phiTarget:   restPhi,
            isDragging:  false,
            lastX:       0,
            lastY:       0,
            idleTimer:   0,
        };
        orbitRef.current = orbit;

        const updateCameraFromSpherical = () => {
            // console.log('updateCameraFromSpherical',orbit);
            const t = orbit.theta;
            const p = orbit.phi;
            const r = orbit.radius;
            camera.position.set(
                orbitCfg.target.x + r * Math.sin(p) * Math.sin(t),
                orbitCfg.target.y + r * Math.cos(p),
                orbitCfg.target.z + r * Math.sin(p) * Math.cos(t),
            );
            camera.lookAt(orbitCfg.target);
        };
        updateCameraFromSpherical();

        // ── Pointer events for drag ─────────────────────────────────────
        const overlay = dragOverlayRef.current;
        if (!overlay) {
            console.warn('[Showcase3D] dragOverlayRef not ready — orbit disabled');
            return;
        }

        const onPointerDown = (e) => {
            orbit.isDragging = true;
            orbit.lastX = e.clientX;
            orbit.lastY = e.clientY;
            overlay.style.cursor = 'grabbing';
        };

        const onPointerMove = (e) => {
            if (!orbit.isDragging) return;
            const dx = e.clientX - orbit.lastX;
            const dy = e.clientY - orbit.lastY;
            orbit.lastX = e.clientX;
            orbit.lastY = e.clientY;

            orbit.thetaTarget -= dx * orbitCfg.sensitivity;
            orbit.phiTarget   -= dy * orbitCfg.sensitivity;

            orbit.thetaTarget = Math.max(orbitCfg.minAzimuth, Math.min(orbitCfg.maxAzimuth, orbit.thetaTarget));
            orbit.phiTarget   = Math.max(orbitCfg.minPolar,   Math.min(orbitCfg.maxPolar,   orbit.phiTarget));

            orbit.idleTimer = 0;
        };

        const onPointerUp = () => {
            orbit.isDragging = false;
            overlay.style.cursor = 'grab';
        };

        overlay.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup',   onPointerUp);

        // ── Animation loop ──────────────────────────────────────────────
        const tick = () => {
            const d = orbitCfg.damping;

            orbit.theta += (orbit.thetaTarget - orbit.theta) * d;
            orbit.phi   += (orbit.phiTarget   - orbit.phi)   * d;

            if (!orbit.isDragging) {
                orbit.idleTimer++;
                if (orbit.idleTimer > 60) {
                    orbit.thetaTarget += (restTheta - orbit.thetaTarget) * orbitCfg.returnSpeed;
                    orbit.phiTarget   += (restPhi   - orbit.phiTarget)   * orbitCfg.returnSpeed;
                }
            }

            updateCameraFromSpherical();
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        // ── Resize handler — re-fit camera when container changes ───────
        const onResize = () => {
            const newMonitorZ = layoutDevices();
            orbitCfg.target.set(0, 0, newMonitorZ);
            restRadius = camera.position.z - newMonitorZ;
            orbit.radius = restRadius;
        };
        window.addEventListener('resize', onResize);

        // ── Cleanup ─────────────────────────────────────────────────────
        renderScene.__showcaseCleanup = () => {
            overlay.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup',   onPointerUp);
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(rafRef.current);
            idleTween?.kill();
            texCacheRef.current.dispose();
        };
    }, []);

    useGSAP(()=>{

    }, {dependencies: []})

    // useEffect(() => {
    //     return () => {
    //         sceneRef.current?.__showcaseCleanup?.();
    //     };
    // }, []);


    // ─────────────────────────────────────────────────────────────────────────
    //  PROJECT NAVIGATION
    // ─────────────────────────────────────────────────────────────────────────
    const navigateToProject = useCallback((newIndex) => {
        if (isTransitioning || newIndex === activeIndex || !devicesRef.current) return;
        const goBack = (newIndex < activeIndex) ? true : false;
        setTransitioning(true);

        const { monitor, phone } = devicesRef.current;
        const tc = texCacheRef.current;
        const newProject = project_list[newIndex];
        const dur = CONFIG.transitionDuration ;

        const tl = gsap.timeline({
            onStart: () => {
                setActiveIndex(newIndex);
                
                tc.preload([
                    project_list[newIndex - 1]?.desktop,
                    project_list[newIndex - 1]?.mobile,
                    project_list[newIndex + 1]?.desktop,
                    project_list[newIndex + 1]?.mobile,
                ]);
            },
            onComplete:()=>{
                setTransitioning(false);
            }
        });

        // Slight scale dip
        // tl.to(monitor.group.scale, { x: 0.5, y: 0.5, z: 0.5, duration: dur * 0.4, ease: 'power2.in' }, 0);
        tl.to(phone.group.scale,   { x: phone.group.scale.x * 0.95, y: phone.group.scale.y * 0.95, z: phone.group.scale.z * 0.95, duration: dur * 0.4, ease: 'power2.in' }, 0);
        
        // tl.to(monitor.group.rotation, { y: D2R(180), duration: dur * 0.4, ease: 'power2.in' }, 0);
        tl.to(phone.group.rotation,   { y: goBack ? D2R(-180) : D2R(180), duration: dur * 0.4, ease: 'power2.in' }, 0);

        // Swap textures at midpoint
        tl.add(() => {
            Promise.all([
                tc.get(newProject.desktop),
                tc.get(newProject.mobile),
            ]).then(([deskTex, mobTex]) => {
                if (deskTex) {
                    monitor.screenMaterial.map = deskTex;
                    monitor.screenMaterial.color.set(0xffffff);
                    monitor.screenMaterial.needsUpdate = true;
                }
                if (mobTex) {
                    phone.screenMaterial.map = mobTex;
                    phone.screenMaterial.color.set(0xffffff);
                    phone.screenMaterial.needsUpdate = true;
                }
            }).catch((err) => {
                console.error('[Showcase3D] Transition texture load failed:', err);
            });
        }, dur * 0.4);

        // // Scale back to rest
        // tl.to(monitor.group.rotation, {
        //     y: D2R(360),
        //     duration: dur * 0.6,
        //     ease: 'power2.out',
        // }, dur * 0.4);

        tl.to(phone.group.rotation, {
            y: goBack ? D2R(-360) + CONFIG.phone.rotation.y : D2R(360) + CONFIG.phone.rotation.y,
            duration: dur * 0.6,
            ease: 'power1.out',
        }, dur * 0.4);

        // tl.to(monitor.group.rotation, {
        //     y: 0,
        //     duration: 0,
        //     ease: 'power2.out',
        // });

        tl.to(phone.group.rotation, {
            y: CONFIG.phone.rotation.y,
            duration: 0,
            ease: 'none',
        });


        // tl.to(monitor.group.scale, { x: 1, y: 1, z: 1, duration: dur * 0.6, ease: 'power2.out' }, dur * 0.4);
        tl.to(phone.group.scale,   { x: phone.group.scale.x, y: phone.group.scale.y, z: phone.group.scale.z, duration: dur * 0.6, ease: 'power2.out' }, dur * 0.4);

    }, [activeIndex, isTransitioning]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                navigateToProject(Math.min(activeIndex + 1, project_list.length - 1));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                navigateToProject(Math.max(activeIndex - 1, 0));
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [activeIndex, navigateToProject]);


    // ─────────────────────────────────────────────────────────────────────────
    //  HIGHLIGHT RAIL
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!svgRef.current) return;
        const highlightEls = svgRef.current.querySelectorAll('.on-rail');
        if (!highlightEls.length) return;

        highlightEls.forEach((el) => {
            const tip = el.getAttribute('data-tooltip');
            if (!tip) return;
            el.addEventListener('mousemove', (evt) => showTooltip(evt, tip));
            el.addEventListener('mouseleave', hideTooltip);
        });

        gsap.set(highlightEls, {
            scale: 0.5,
            opacity: 0,
            attr: {
                'data-position': 0,
                'data-selected': 'false',
                'data-type': (i, target) => [...target.classList].filter((c) => c !== 'on-rail').join(' '),
            },
            motionPath: {
                path: '#highlight_path',
                align: '#highlight_path',
                alignOrigin: [0.5, 0.5],
                end: 0,
            },
        });
    }, []);

    useEffect(() => {
        if (!svgRef.current) return;
        const highlightEls = svgRef.current.querySelectorAll('.on-rail');
        if (!highlightEls.length) return;

        const activeSet   = new Set(activeProject.highlights);
        const hl_start    = 0;
        const hl_end      = 0.95;

        const { old_news, new_news, leftover_news } = Array.from(highlightEls).reduce(
            (g, el) => {
                const selected = el.dataset.selected === 'true';
                const active   = activeSet.has(el.dataset.type);
                if (selected && !active)       g.old_news.push(el);
                else if (!selected && active)  g.new_news.push(el);
                else if (selected && active)   g.leftover_news.push(el);
                return g;
            },
            { old_news: [], new_news: [], leftover_news: [] },
        );

        const count = new_news.length + leftover_news.length;
        const finalPos = (i, c) => hl_start + (i / (c + 1)) * (hl_end - hl_start);

        const tl = gsap.timeline();

        old_news.forEach((el) => {
            tl.set(el, { attr: { 'data-selected': 'false' } });
            tl.to(el, {
                motionPath: { path: '#highlight_path', align: '#highlight_path', alignOrigin: [0.5, 0.5], fromCurrent: true, start: parseFloat(el.dataset.position), end: 1 },
                scale: 0.5, opacity: 0,
            }, 'out');
        });

        leftover_news.forEach((el, idx) => {
            const fp = finalPos(count - idx, count);
            tl.to(el, {
                motionPath: { path: '#highlight_path', align: '#highlight_path', alignOrigin: [0.5, 0.5], fromCurrent: true, start: (_, t) => parseFloat(t.dataset.position), end: fp },
                attr: { 'data-position': fp },
            }, 'out');
        });

        new_news.forEach((el, idx) => {
            const fp = finalPos(idx + 1, count);
            const yOff = el.dataset?.yoffset ? parseFloat(el.dataset.yoffset) : 0;
            const xOff = el.dataset?.xoffset ? parseFloat(el.dataset.xoffset) : 0;
            tl.set(el, { attr: { 'data-selected': 'true', 'data-position': fp } });
            tl.to(el, {
                motionPath: { path: '#highlight_path', align: '#highlight_path', alignOrigin: [0.5 + xOff, 0.5 + yOff], start: 0, end: fp },
                scale: 1, opacity: 1,
            }, 'out');
        });

        tl.duration(0.75).play();
    }, [activeProject]);


    // ─────────────────────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="showcase showcase-3d" >

            <div className="devices" data-fade-stagger="0">

                <Scene
                    onReady={handleSceneReady}
                    inset="-25% 0 0 -25%"
                    width="150%"
                    height="150%"
                    position="absolute"
                    name="showcase-scene"
                />

                <div
                    ref={dragOverlayRef}
                    className="orbit-overlay"
                />


                <div className="nav-arrows">
                    <button
                        className="nav-arrow prev"
                        disabled={activeIndex === 0 || isTransitioning}
                        onClick={() => navigateToProject(activeIndex - 1)}
                        aria-label="Previous project"
                    >
                        ‹
                    </button>
                    {/* <span className="nav-counter">
                        {activeIndex + 1} / {project_list.length}
                    </span> */}
                    <button
                        className="nav-arrow next"
                        disabled={activeIndex === project_list.length - 1 || isTransitioning}
                        onClick={() => navigateToProject(activeIndex + 1)}
                        aria-label="Next project"
                    >
                        ›
                    </button>
                </div>

            </div>
            
            <div class='highlights_wrapper' data-fade-stagger="0.5">
                <svg className="highlights" viewBox="0 0 50 10" ref={svgRef} preserveAspectRatio="meet">
                    <path fill="transparent" stroke="transparent" strokeWidth="1px" id="highlight_path" d="M0,5 L50,5" />
                    {/* <image data-tooltip="REST API"                  className="on-rail rest-api"      width={8}    height={8}    href={restApi} /> */}
                    <image data-tooltip="Salsify API"               className="on-rail salsify"       width={7.25} height={7.25} href={salsify} />
                    <image data-tooltip="GreenSock Animation Platform" className="on-rail greensock"   width={10}    height={8}    href={greensock} />
                    <image data-tooltip="WordPress"                 className="on-rail wordpress"     width={8}    height={7.5}  href="https://upload.wikimedia.org/wikipedia/commons/9/98/WordPress_blue_logo.svg" />
                    <image data-tooltip="React"                     className="on-rail react"         width={8}    height={8}    href="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" />
                    <image data-tooltip="PHP"                       className="on-rail php"           width={9.5}  height={8}    href="https://upload.wikimedia.org/wikipedia/commons/2/27/PHP-logo.svg" />
                    {/* <image data-tooltip="Next.js"                   className="on-rail nextjs"        width={8}    height={8}    href={nextjs} /> */}
                    <image data-tooltip="TypeScript"                className="on-rail typescript"    width={7.5}  height={7.5}  href="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" />
                    <image data-tooltip="Python"                    className="on-rail python"        width={8}    height={8}    href={python} />
                    {/* <image data-tooltip="HTML5"                     className="on-rail html5"         width={8}    height={8}    href={html5} /> */}
                    <image data-tooltip="Shopify"                   className="on-rail shopify"       width={9}    height={8}    href={shopify} />
                    <image data-tooltip="Syndigo API"               className="on-rail syndigo"       width={8}    height={8}    href={syndigo} />
                    <image data-tooltip="CSS3"                      className="on-rail css"           width={8}    height={7.5}  href="https://upload.wikimedia.org/wikipedia/commons/a/ab/Official_CSS_Logo.svg" />
                    <image data-tooltip="WooCommerce"               className="on-rail woo"           width={8}    height={7.5}  href="https://upload.wikimedia.org/wikipedia/commons/5/51/WooCommerce_logo_%282015%29.svg" />
                    <image data-tooltip="Google OAuth"              className="on-rail google-auth"   width={8}    height={7.5}  href="https://upload.wikimedia.org/wikipedia/commons/3/3a/GDevs.svg" />
                    <image data-tooltip="Google Sheets API"         className="on-rail google-sheets" width={8}    height={7.5}  href="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" />
                    <g data-tooltip="REST API" className="on-rail rest-api">
                        <RestApiIcon width={8} height={8} />
                    </g>
                    <g data-tooltip="HTML5" className="on-rail html5">
                        <Html5Icon width={8} height={8} />
                    </g>
                    <g data-tooltip="Next.js" className="on-rail nextjs">
                        <NextjsIcon width={8} height={8} />
                    </g>
                </svg>
            </div>

            {activeProject && (
                <div className="copy" key={activeProject.id} data-fade-stagger="0.5">
                    <h2>{activeProject.id}</h2>
                    <div className="brief" dangerouslySetInnerHTML={{ __html: activeProject.copy }} />
                    <GetAgencyDisclaimer agency={activeProject.agency} />
                    {activeProject.url && (
                        <a className="button-pill button-pill--medium button-pill--color" href={activeProject.url}>Visit Link</a>
                    )}
                </div>
            )}

            <div className="tiles" data-fade-stagger="0.75">
                {project_list.map((project, index) => {
                    const thumb = project.desktop || project.mobile;
                    return (
                        <div
                            key={index}
                            role="button"
                            tabIndex={0}
                            className={`tile ${index === activeIndex ? 'active' : ''}`}
                            style={{ '--bg-url': `url(${thumb})` }}
                            onClick={() => navigateToProject(index)}
                            onKeyDown={(e) => e.key === 'Enter' && navigateToProject(index)}
                        >
                            <h3>{project.id}</h3>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


const GetAgencyDisclaimer = ({ agency }) => {
    switch (agency) {
        case 'donovan':
            return (
                <div className="agency" style={{'--bg-color': '#d54f1f'}}>
                    <span>Made in partnership with</span>
                    <a href="https://donovanadv.com"><DonovanIcon /></a>
                </div>
            );
        default:
            return <div className="agency" />;
    }
};