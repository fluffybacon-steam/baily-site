import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import Scene from '@/components/Scene';      // default export, not named
import gsap from 'gsap';


export default function OfficeSection() {
    const containerRef = useRef(null);
    const disposeRef   = useRef(null);

    const handleSceneReady = ({ scene }) => {
        // Tweak the camera for a nice framing
        // (adjust these after you see the initial render)
        scene.camera.position.set(3, 4, 6);
        scene.camera.lookAt(0, 1.8, 0);

        // Override any palette colors
        const customPalette = {
            // man:  { shirt: '#4ECDC4' },
            // woman: { shirt: '#FF6B6B' },
        };

        const result = fireOfficeAnimation(scene, containerRef, customPalette);
        if (result) {
            disposeRef.current = result.dispose;
        }
    };

    useEffect(() => {
        return () => disposeRef.current?.();
    }, []);

    return (
        <section
            ref={containerRef}
            className="office-section"
            style={{ position: 'relative', width: '100%', height: '60vh' }}
        >
            <Scene
                onReady={handleSceneReady}
                width="100%"
                height="100%"
                position="relative"
                name="office"
            />
        </section>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
 *  COLOR CONFIGURATION
 *  Swap any value here to re-skin the whole scene.
 * ═══════════════════════════════════════════════════════════════════════════ */

const OFFICE_PALETTE = {
    man: {
        skin:   '#E8A87C',
        hair:   '#3D3D3D',
        shirt:  '#00aeef',
        pants:  '#2d388a',
        shoes:  '#1a1a2e',
    },
    woman: {
        skin:   '#F2C4A0',
        hair:   '#8B4513',
        shirt:  '#FF6B6B',
        pants:  '#2d388a',
        shoes:  '#1a1a2e',
    },
    desk: {
        top:    '#C4956A',
        legs:   '#8B7355',
    },
    laptop: {
        body:       '#D4D4D4',
        screen:     '#1a1a2e',
        screenGlow: '#00aeef',
    },
};


/* ═══════════════════════════════════════════════════════════════════════════
 *  MATERIAL HELPER
 * ═══════════════════════════════════════════════════════════════════════════ */

const mat = (hex) =>
    new THREE.MeshLambertMaterial({ color: new THREE.Color(hex), flatShading: true });


/* ═══════════════════════════════════════════════════════════════════════════
 *  GEOMETRY BUILDERS
 * ═══════════════════════════════════════════════════════════════════════════ */

function buildPerson(colors, { seated = false, longHair = false } = {}) {
    const root  = new THREE.Group();
    const parts = {};

    const HEAD_R      = 0.45;
    const TORSO_W     = 1.0;
    const TORSO_H     = 1.6;
    const TORSO_D     = 0.5;
    const ARM_R       = 0.12;
    const UPPER_ARM_L = 0.9;
    const FOREARM_L   = 0.85;
    const LEG_R       = 0.15;
    const UPPER_LEG_L = 1.0;
    const LOWER_LEG_L = 1.0;
    const SHOE_W      = 0.35;
    const SHOE_H      = 0.15;
    const SHOE_D      = 0.5;

    // ── Head ────────────────────────────────────────────────────────────
    const headGeo = new THREE.SphereGeometry(HEAD_R, 8, 6);
    const head    = new THREE.Mesh(headGeo, mat(colors.skin));

    const neckPivot = new THREE.Group();
    neckPivot.position.set(0, TORSO_H / 2 + HEAD_R * 0.3, 0);
    head.position.set(0, HEAD_R * 0.5, 0);
    neckPivot.add(head);
    parts.neckPivot = neckPivot;
    parts.head = head;

    // ── Hair ────────────────────────────────────────────────────────────
    if (longHair) {
        const hairTop = new THREE.Mesh(
            new THREE.SphereGeometry(HEAD_R * 1.08, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
            mat(colors.hair)
        );
        hairTop.position.set(0, HEAD_R * 0.12, 0);
        head.add(hairTop);

        const hairBack = new THREE.Mesh(
            new THREE.BoxGeometry(HEAD_R * 1.6, HEAD_R * 1.2, HEAD_R * 0.6),
            mat(colors.hair)
        );
        hairBack.position.set(0, -HEAD_R * 0.15, -HEAD_R * 0.25);
        head.add(hairBack);
        parts.hair = hairBack;
    } else {
        const hairTop = new THREE.Mesh(
            new THREE.SphereGeometry(HEAD_R * 1.05, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.45),
            mat(colors.hair)
        );
        hairTop.position.set(0, HEAD_R * 0.08, 0);
        head.add(hairTop);
        parts.hair = hairTop;
    }

    // ── Torso ───────────────────────────────────────────────────────────
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(TORSO_W, TORSO_H, TORSO_D),
        mat(colors.shirt)
    );
    parts.torso = torso;

    // ── Arms ────────────────────────────────────────────────────────────
    const buildArm = (side) => {
        const sign = side === 'L' ? -1 : 1;

        const shoulderPivot = new THREE.Group();
        shoulderPivot.position.set(sign * (TORSO_W / 2 + ARM_R), TORSO_H / 2 - ARM_R * 2, 0);

        const upperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(ARM_R, ARM_R, UPPER_ARM_L, 6),
            mat(colors.shirt)
        );
        upperArm.position.set(0, -UPPER_ARM_L / 2, 0);
        shoulderPivot.add(upperArm);

        const elbowPivot = new THREE.Group();
        elbowPivot.position.set(0, -UPPER_ARM_L, 0);

        const forearm = new THREE.Mesh(
            new THREE.CylinderGeometry(ARM_R * 0.9, ARM_R * 0.85, FOREARM_L, 6),
            mat(colors.skin)
        );
        forearm.position.set(0, -FOREARM_L / 2, 0);
        elbowPivot.add(forearm);

        const hand = new THREE.Mesh(
            new THREE.SphereGeometry(ARM_R * 1.1, 6, 4),
            mat(colors.skin)
        );
        hand.position.set(0, -FOREARM_L, 0);
        elbowPivot.add(hand);

        shoulderPivot.add(elbowPivot);

        parts[`shoulderPivot${side}`] = shoulderPivot;
        parts[`upperArm${side}`]      = upperArm;
        parts[`elbowPivot${side}`]    = elbowPivot;
        parts[`forearm${side}`]       = forearm;
        parts[`hand${side}`]          = hand;

        return shoulderPivot;
    };

    const armL = buildArm('L');
    const armR = buildArm('R');

    // ── Legs ────────────────────────────────────────────────────────────
    const buildLeg = (side) => {
        const sign = side === 'L' ? -1 : 1;

        const hipPivot = new THREE.Group();
        hipPivot.position.set(sign * (TORSO_W / 4), -TORSO_H / 2, 0);

        const upperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(LEG_R, LEG_R, UPPER_LEG_L, 6),
            mat(colors.pants)
        );
        upperLeg.position.set(0, -UPPER_LEG_L / 2, 0);
        hipPivot.add(upperLeg);

        const kneePivot = new THREE.Group();
        kneePivot.position.set(0, -UPPER_LEG_L, 0);

        const lowerLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(LEG_R * 0.9, LEG_R * 0.85, LOWER_LEG_L, 6),
            mat(colors.pants)
        );
        lowerLeg.position.set(0, -LOWER_LEG_L / 2, 0);
        kneePivot.add(lowerLeg);

        const shoe = new THREE.Mesh(
            new THREE.BoxGeometry(SHOE_W, SHOE_H, SHOE_D),
            mat(colors.shoes)
        );
        shoe.position.set(0, -LOWER_LEG_L - SHOE_H / 2, SHOE_D * 0.15);
        kneePivot.add(shoe);

        hipPivot.add(kneePivot);

        parts[`hipPivot${side}`]  = hipPivot;
        parts[`upperLeg${side}`]  = upperLeg;
        parts[`kneePivot${side}`] = kneePivot;
        parts[`lowerLeg${side}`]  = lowerLeg;
        parts[`shoe${side}`]      = shoe;

        return hipPivot;
    };

    const legL = buildLeg('L');
    const legR = buildLeg('R');

    // ── Assemble ────────────────────────────────────────────────────────
    root.add(torso);
    torso.add(neckPivot);
    torso.add(armL);
    torso.add(armR);
    torso.add(legL);
    torso.add(legR);

    // ── Seated pose ─────────────────────────────────────────────────────
    if (seated) {
        legL.rotation.x = -Math.PI / 2;
        legR.rotation.x = -Math.PI / 2;
        parts.kneePivotL.rotation.x = Math.PI / 2;
        parts.kneePivotR.rotation.x = Math.PI / 2;

        armL.rotation.x = -Math.PI / 2.5;
        armR.rotation.x = -Math.PI / 2.5;
        parts.elbowPivotL.rotation.x = -Math.PI / 4;
        parts.elbowPivotR.rotation.x = -Math.PI / 4;
    }

    root.userData.parts = parts;
    return root;
}


function buildDesk(colors) {
    const root  = new THREE.Group();

    const TOP_W = 3.0;
    const TOP_H = 0.12;
    const TOP_D = 1.4;
    const LEG_H = 1.6;
    const LEG_R = 0.08;

    const top = new THREE.Mesh(
        new THREE.BoxGeometry(TOP_W, TOP_H, TOP_D),
        mat(colors.top)
    );
    top.position.y = LEG_H + TOP_H / 2;
    root.add(top);

    const legPositions = [
        [ (TOP_W / 2 - 0.15),  0,  (TOP_D / 2 - 0.15) ],
        [-(TOP_W / 2 - 0.15),  0,  (TOP_D / 2 - 0.15) ],
        [ (TOP_W / 2 - 0.15),  0, -(TOP_D / 2 - 0.15) ],
        [-(TOP_W / 2 - 0.15),  0, -(TOP_D / 2 - 0.15) ],
    ];

    legPositions.forEach(([x, , z]) => {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(LEG_R, LEG_R, LEG_H, 6),
            mat(colors.legs)
        );
        leg.position.set(x, LEG_H / 2, z);
        root.add(leg);
    });

    root.userData.topY = LEG_H + TOP_H;
    root.userData.topW = TOP_W;
    root.userData.topD = TOP_D;
    return root;
}


function buildLaptop(colors) {
    const root = new THREE.Group();

    const BASE_W = 1.0;
    const BASE_H = 0.04;
    const BASE_D = 0.7;

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D),
        mat(colors.body)
    );
    root.add(base);

    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, BASE_H / 2, -BASE_D / 2);
    lidPivot.rotation.x = -Math.PI / 2 + 0.35;

    const LID_H = 0.03;
    const lid = new THREE.Mesh(
        new THREE.BoxGeometry(BASE_W * 0.97, LID_H, BASE_D * 0.95),
        mat(colors.body)
    );
    lid.position.set(0, 0, -BASE_D * 0.95 / 2);

    const screen = new THREE.Mesh(
        new THREE.BoxGeometry(BASE_W * 0.88, LID_H + 0.005, BASE_D * 0.82),
        mat(colors.screen)
    );
    screen.position.set(0, LID_H / 2 + 0.003, -BASE_D * 0.95 / 2);

    const glow = new THREE.Mesh(
        new THREE.BoxGeometry(BASE_W * 0.82, 0.002, BASE_D * 0.72),
        new THREE.MeshBasicMaterial({
            color: new THREE.Color(colors.screenGlow),
            transparent: true,
            opacity: 0.3,
        })
    );
    glow.position.set(0, LID_H / 2 + 0.008, -BASE_D * 0.95 / 2);

    lidPivot.add(lid);
    lidPivot.add(screen);
    lidPivot.add(glow);
    root.add(lidPivot);

    root.userData.glow   = glow;
    root.userData.screen = screen;
    return root;
}


function buildChair(color) {
    const root = new THREE.Group();

    const SEAT_W = 1.0;
    const SEAT_H = 0.1;
    const SEAT_D = 0.8;
    const SEAT_Y = 1.1;
    const BACK_H = 1.0;

    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(SEAT_W, SEAT_H, SEAT_D),
        mat(color)
    );
    seat.position.y = SEAT_Y;
    root.add(seat);

    const back = new THREE.Mesh(
        new THREE.BoxGeometry(SEAT_W, BACK_H, 0.08),
        mat(color)
    );
    back.position.set(0, SEAT_Y + BACK_H / 2, -SEAT_D / 2 + 0.04);
    root.add(back);

    const LEG_R = 0.06;
    const legOffsets = [
        [ SEAT_W / 2 - 0.1,  SEAT_D / 2 - 0.1 ],
        [-SEAT_W / 2 + 0.1,  SEAT_D / 2 - 0.1 ],
        [ SEAT_W / 2 - 0.1, -SEAT_D / 2 + 0.1 ],
        [-SEAT_W / 2 + 0.1, -SEAT_D / 2 + 0.1 ],
    ];

    legOffsets.forEach(([x, z]) => {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(LEG_R, LEG_R, SEAT_Y, 6),
            mat(color)
        );
        leg.position.set(x, SEAT_Y / 2, z);
        root.add(leg);
    });

    root.userData.seatY = SEAT_Y + SEAT_H;
    return root;
}


/* ═══════════════════════════════════════════════════════════════════════════
 *  fireOfficeAnimation
 * ═══════════════════════════════════════════════════════════════════════════ */

function fireOfficeAnimation(scene, containerRef, palette = {}) {
    if (!containerRef?.current) return null;

    const colors = deepMerge(structuredClone(OFFICE_PALETTE), palette);

    const threeScene = scene.scene;
    const camera     = scene.camera;

    // ── Build meshes ────────────────────────────────────────────────────
    const desk    = buildDesk(colors.desk);
    const laptop  = buildLaptop(colors.laptop);
    const chair   = buildChair(colors.desk.legs);
    const man     = buildPerson(colors.man,   { seated: true,  longHair: false });
    const woman   = buildPerson(colors.woman, { seated: false, longHair: true  });

    const manParts   = man.userData.parts;
    const womanParts = woman.userData.parts;

    // ── Position furniture ──────────────────────────────────────────────
    desk.position.set(0, 0, 0);

    const deskTopY = desk.userData.topY;
    laptop.position.set(0.2, deskTopY + 0.02, 0);

    chair.position.set(0, 0, -1.2);

    // ── Position characters ─────────────────────────────────────────────
    const TORSO_H  = 1.6;
    const manSeatY = chair.userData.seatY;
    man.position.set(0, manSeatY + TORSO_H / 2, -1.0);

    const STAND_LEGS = 1.0 + 1.0 + 0.15;
    woman.position.set(2.2, STAND_LEGS + TORSO_H / 2, -0.6);

    womanParts.shoulderPivotR.rotation.set(0, 0, 0);

    // ── Scene group ─────────────────────────────────────────────────────
    const officeGroup = new THREE.Group();
    officeGroup.add(desk);
    officeGroup.add(laptop);
    officeGroup.add(chair);
    officeGroup.add(man);
    officeGroup.add(woman);
    threeScene.add(officeGroup);

    // ── Lighting ────────────────────────────────────────────────────────
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 5, 4);
    officeGroup.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-3, 3, -2);
    officeGroup.add(fillLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    officeGroup.add(ambient);

    /* ═══════════════════════════════════════════════════════════════════════
     *  ANIMATION TIMELINE  (auto-play, ≈ 4 s)
     *
     *    0.0 s  — Man typing, woman walks in from the right
     *    1.2 s  — Her arm lifts to his shoulder
     *    2.0 s  — He looks up to acknowledge her
     *    2.5 s  — Laptop glow pulses, hold beat
     * ═══════════════════════════════════════════════════════════════════════ */

    const tl_office = gsap.timeline({ delay: 0.3 });

    // ── Woman slides in ─────────────────────────────────────────────────
    const womanStartX = woman.position.x + 2.5;
    const womanEndX   = woman.position.x;
    woman.position.x  = womanStartX;

    tl_office.to(woman.position, {
        x: womanEndX, duration: 1.0, ease: 'power2.out',
    }, 0);

    // Walk bob
    const walkProxy = { t: 0 };
    const womanBaseY = woman.position.y;
    tl_office.to(walkProxy, {
        t: 1, duration: 1.0, ease: 'none',
        onUpdate: () => {
            woman.position.y = womanBaseY + Math.sin(walkProxy.t * Math.PI * 4) * 0.06;
        },
        onComplete: () => { woman.position.y = womanBaseY; },
    }, 0);

    // Leg stride
    tl_office.fromTo(womanParts.hipPivotL.rotation, { x: 0.3 },
        { x: -0.2, duration: 0.25, repeat: 1, yoyo: true, ease: 'sine.inOut' }, 0);
    tl_office.fromTo(womanParts.hipPivotR.rotation, { x: -0.2 },
        { x: 0.3, duration: 0.25, repeat: 1, yoyo: true, ease: 'sine.inOut' }, 0);

    // Legs settle
    tl_office.to(womanParts.hipPivotL.rotation, { x: 0, duration: 0.3, ease: 'power1.out' }, 1.0);
    tl_office.to(womanParts.hipPivotR.rotation, { x: 0, duration: 0.3, ease: 'power1.out' }, 1.0);

    // ── Man typing ──────────────────────────────────────────────────────
    const typingRepeat = 5;
    tl_office.fromTo(manParts.elbowPivotL.rotation,
        { x: -Math.PI / 4 },
        { x: -Math.PI / 4 - 0.12, duration: 0.2, repeat: typingRepeat, yoyo: true, ease: 'sine.inOut' },
        0
    );
    tl_office.fromTo(manParts.elbowPivotR.rotation,
        { x: -Math.PI / 4 },
        { x: -Math.PI / 4 - 0.1, duration: 0.25, repeat: typingRepeat, yoyo: true, ease: 'sine.inOut' },
        0.1
    );

    // ── Woman's arm reaches his shoulder ─────────────────────────────────
    tl_office.to(womanParts.shoulderPivotR.rotation, {
        x: -Math.PI / 3, z: -0.35,
        duration: 0.8, ease: 'power2.inOut',
    }, 1.2);

    tl_office.to(womanParts.elbowPivotR.rotation, {
        x: -Math.PI / 5,
        duration: 0.8, ease: 'power2.inOut',
    }, 1.2);

    // ── Man acknowledges ────────────────────────────────────────────────
    tl_office.to(manParts.neckPivot.rotation, {
        x: 0.2, y: 0.4, z: 0.08,
        duration: 0.6, ease: 'power2.out',
    }, 2.0);

    // Typing stops
    tl_office.to(manParts.elbowPivotL.rotation, { x: -Math.PI / 4, duration: 0.4 }, 2.0);
    tl_office.to(manParts.elbowPivotR.rotation, { x: -Math.PI / 4, duration: 0.4 }, 2.0);

    // ── Laptop glow pulse ───────────────────────────────────────────────
    const glowMat = laptop.userData.glow.material;
    tl_office.to(glowMat, {
        opacity: 0.6, duration: 1.0,
        repeat: -1, yoyo: true, ease: 'sine.inOut',
    }, 2.5);

    // ── Cleanup ─────────────────────────────────────────────────────────
    const dispose = () => {
        tl_office.kill();
        threeScene.remove(officeGroup);
        officeGroup.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    };

    return { tl: tl_office, dispose, officeGroup };
}


/* ═══════════════════════════════════════════════════════════════════════════
 *  UTILITY
 * ═══════════════════════════════════════════════════════════════════════════ */

function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (
            source[key] &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key]) &&
            target[key] &&
            typeof target[key] === 'object'
        ) {
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}