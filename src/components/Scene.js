import { ColumnWorld } from '@/3dcomponents/ColumnWorld';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ChevronScene } from '@/3dcomponents/ChevronScene.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createPortal } from 'react-dom';

gsap.registerPlugin(ScrollTrigger);

const Scene = ({ debug, onReady, chevronOpts = {}, width = '100vw', height = '100vh', inset = "0px" }) => {
    const canvasRef   = useRef(null);
    const [chevron, setChevron] = useState(null);

    useEffect(() => {
        const sceneInstance = new ChevronScene(canvasRef.current);
        const c = sceneInstance.addChevron(chevronOpts);
        setChevron(c);

        onReady?.({ chevron: c, scene: sceneInstance });

        return () => {
            sceneInstance.destroy();
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <>
            <div
                ref={canvasRef}
                className='scene-wrapper'
                style={{ zIndex: 0, position: 'absolute', pointerEvents: 'none', 
                    width, height, inset,
                }}
                >{debug && ( <ChevronDevBox chevron={chevron} inset={"65% 0px 0% 77%"}/>)}
            </div>
        </>
    );
}

export default Scene;


export function fireColumnAnimation(scene, setColumnWorld) {
    const gridX = 100;
    const gridZ = 15;
    const spacing = 10;
    const baseHeight = 50;

    const columns = new ColumnWorld(scene, {
        gridX, gridZ, spacing, baseHeight,
        rowShift: 5,
        colShift: 0,
        palette: ['#00aeef'],
        baseWidth: 5,
        widthVariance: 0,
        heightVariance: 0,
        position: { x: 0, y: -225, z: -109.5 },
        rotation: { x: -0.12, y: 0, z: 0 },
        dance: {
            mode: 'spiral',
            frequency: 0.1,
            magnitude: 2,
            wavelength: 1,
            phase: 0,
            colorShift: { hue: 233 - 196, saturation: -0.49, lightness: -0.11 },
        },
        mouse: { enabled: true, magnitude: 25, radius: 40 },
    });
    setColumnWorld?.(columns);

    // ── Position columns so front row tops sit at viewport bottom ────────
    const frontRowWorldZ = columns.root.position.z + (gridZ - 1) * spacing / 2;
    const viewportBottomY = columns.getViewportBottomY(frontRowWorldZ);
    columns.root.position.y = viewportBottomY - baseHeight;

    // ── Tick loop ────────────────────────────────────────────────────────
    const clock = { start: Date.now() };
    gsap.ticker.add(() => {
        columns.update((Date.now() - clock.start) / 1000);
    });

    // Pre-scroll light sweep
    gsap.fromTo(
        columns._topLight.position,
        { x: 100 },
        { x: 0, duration: 0.7, ease: 'power3.inOut' },
        0.7,
    );

    // ─────────────────────────────────────────────────────────────────────
    // Hero column — sits visibly in the grid center from the start.
    // Looks identical to every other column until the grid spreads
    // apart and it's the last one standing.
    // ─────────────────────────────────────────────────────────────────────

    const cam = scene.camera;

    // ─────────────────────────────────────────────────────────────────────
    // Scroll timeline (scrubbed over 150vh)
    //
    //  0 %──── 25 % ──── 50 % ──── 70 % ──── 100 %
    //  │ centre cols │ spread + approach │ hero settles │
    //  │ straighten  │ dampen effects    │ grid fades   │
    // ─────────────────────────────────────────────────────────────────────

    // The "centred" Y: camera is at y=0, column visual midpoint
    // should also be at y=0 → root.y = −baseHeight/2
    const centeredY = -baseHeight;

    const leaveTl = gsap.timeline({
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'top+=150vh top',
            scrub: 1,
        },
    });

    // ── Phase 1 (0 – 25 %): Centre + straighten ─────────────────────────

    // Lift columns from bottom-aligned → vertically centred with camera
    leaveTl.to(columns.root.position, {
        y: centeredY,
        duration: 0.25,
        ease: 'none',
    }, 0);

    // Straighten the tilt so columns face the camera head-on
    leaveTl.to(columns.root.rotation, {
        x: 0,
        duration: 0.25,
        ease: 'none',
    }, 0);


    // ── Dampen dance ─────────────────────────────────────────────────────
    leaveTl.to(columns._dance, {
        magnitude: 0,
        duration: 0.3,
        ease: 'none',
    }, 0.05);

    // ── Dampen colour shift ──────────────────────────────────────────────
    leaveTl.to(columns._dance.colorShift, {
        hue: 0,
        saturation: 0,
        lightness: 0,
        duration: 0.3,
        ease: 'none',
    }, 0.05);

    // ── Kill mouse effect ────────────────────────────────────────────────
    leaveTl.to(columns._mouse, {
        magnitude: 0,
        duration: 0.2,
        ease: 'none',
    }, 0);

}

/**
 * fireHeroAnimation — hero entry animation + scroll-out transition.
 *
 * Handles:
 *   1. ColumnWorld creation with mouse gravity
 *   2. Dynamic Y positioning so the front row tops sit at the viewport bottom
 *   3. Chevron fly-in, text reveal, ball entrance
 *   4. Scroll-out: chevron rises, camera descends, spiral dampens,
 *      mouse fades, columns compress to zero spacing
 */
export function fireHeroAnimation(chevron, scene, heroWrapRef, setColumnWorld) {
    if (!heroWrapRef.current) return false;

    // ── Prevent scroll until hero animation finishes ─────────────────────────
    const preventScroll = (e) => e.preventDefault();
    window.addEventListener('wheel',     preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });

    // ── DOM references ──────────────────────────────────────────────────────
    const container = heroWrapRef.current.querySelector('.logo');
    const text      = container.querySelector('.text');
    const ball      = container.querySelector('.ball');
    const rect      = text.getBoundingClientRect();

    // ── Pre-calculate world positions ───────────────────────────────────────
    const magicNum1 = 0.75;
    const magicNum2 = 2;
    const magicNum3 = 10;
    const gapBetweenCnB = -20;

    const targetZ = chevron.getZForPixelHeight(rect.height * magicNum1);

    const chevronWidth = rect.height * magicNum1 * 0.4;
    const destPos = scene.getElementWorldPosition(text, {
        anchor:  'center',
        z:       targetZ,
        offsetX: -(rect.width / 2) - (chevronWidth / 2) + gapBetweenCnB,
    });

    const startPos = scene.getElementWorldPosition(text, {
        anchor:  'right',
        z:       targetZ,
    });

    // ── Set stage ───────────────────────────────────────────────────────────
    chevron.setRotation(0, 0, 90);
    chevron.setPosition(startPos.x, startPos.y, startPos.z);

    const currentOffset = parseFloat(
        getComputedStyle(container).getPropertyValue('--flip-offset') || '0'
    );
    const targetOffset = currentOffset + rect.height * magicNum1;

    // ── Hero entry timeline ─────────────────────────────────────────────────
    const tl = gsap.timeline();

    tl  // Chevron opens its arms
        .add(
            chevron.open(), { duration: 0.7 }
        , 0)

        // Fly in from right
        .to(chevron.root.position, {
            x:        destPos.x + magicNum3,
            y:        destPos.y + magicNum2,
            z:        destPos.z,
            duration: 0.7,
            ease:     'power3.in',
            onUpdate: () => {
                const projected = chevron.root.position.clone().project(scene.camera);
                const screenX   = ((projected.x + 1) / 2) * window.innerWidth;

                const depth      = scene.camera.position.z - chevron.root.position.z;
                const visibleH   = 2 * Math.tan(THREE.MathUtils.degToRad(scene.camera.fov / 2)) * depth;
                const pxPerUnit  = window.innerHeight / visibleH;
                const rightEdgePx = screenX + (chevron.c_radius * pxPerUnit);

                const textRect = text.getBoundingClientRect();
                const localPct = ((rightEdgePx - textRect.left) / textRect.width * 100).toFixed(3);
                text.style.clipPath = `inset(0 0 0 ${localPct}%)`;
            },
        }, 0.7)

        // CSS text flip
        .to(container, {
            '--flip-offset': `${targetOffset}px`,
            duration:         0.7,
            ease:             'power3.in',
        }, 0.7)

        // Rotation during fly-in
        .to(chevron.root.rotation, {
            y: D2R(190),
            duration: 0.7,
            ease: 'none',
        }, 0)

        // Set arm angle
        .add(chevron.setAngle(45, {
            duration: 1.4,
            ease: 'power3.inOut',
        }), 0.7)

        // Ball slides in
        .fromTo(ball,
            { left: 'calc(0px - var(--ball-size))' },
            {
                left: `calc(${container.offsetWidth / 2 - targetOffset}px - var(--ball-size))`,
                duration: 0.5,
                ease:     'power3.out',
            },
        1.4)

        // Chevron settles to final X
        .to(chevron.root.position, {
            x: destPos.x,
            duration: 0.5,
            ease: 'power3.out',
        }, 1.4)

        // Chevron faces forward
        .to(chevron.root.rotation, {
            y: D2R(180),
            duration: 1.4,
            ease: 'power3.out',
        }, 1.4)

        .to(chevron.root.rotation, {
            x: D2R(180),
            duration: 1.0,
            ease: 'power3.out',
        }, 1.4)

        // Ball grows
        .fromTo(ball,
            { '--ball-size': '0cqw' },
            { '--ball-size': '4cqw', duration: 0.5, ease: 'power3.out' },
        1.6);

    tl.duration(1.5);

    // tl.duration(15);

    // ── Scroll-out timeline ─────────────────────────────────────────────────
    // const leaveTl = gsap.timeline({
    //     scrollTrigger: {
    //         trigger: 'body',
    //         start:   'top top',
    //         end:     'top+=150vh top',
    //         scrub:   1,
    //         markers: true,
    //     }
    // });

    // leaveTl.to(columns, {
    //     _baseWidths: 5,
    //     ease: 'power1.in',
    //     duration: 1,
    // }, 0);


    // ── Unlock scrolling once hero entry finishes ────────────────────────────
    tl.then(() => {
        window.removeEventListener('wheel',     preventScroll);
        window.removeEventListener('touchmove', preventScroll);
    });
}

//version 1
// export function calloutAnimation(chevron, scene, containerRef) {
//     if (!containerRef.current) return;

//     const callouts = containerRef.current.querySelectorAll('.callout_wrapper');
//     const canvas   = scene.renderer.domElement;

//     // Hoops sit this many units in front of the chevron to prevent z-fighting
//     const HOOP_Z_OFFSET = 5;

//     const callout_tl = gsap.timeline({
//         scrollTrigger: {
//             trigger: containerRef.current,
//             start:   "top 50%",
//             end:     "bottom 50%",
//             scrub:   2,
//             markers: true,
//         }
//     });

//     const tightenCircleColors = () => {
//         callouts.forEach(wrapper => {
//             const h2 = wrapper.querySelector('.circle-color h2');
//             const circleColor = wrapper.querySelector('.circle-color');
//             if (!h2 || !circleColor) return;

//             // Clear so it re-wraps at natural grid width
//             circleColor.style.width = '';

//             requestAnimationFrame(() => {
//                 const range = document.createRange();
//                 range.selectNodeContents(h2);
//                 const textRect= range.getBoundingClientRect();
//                 const padding = parseFloat(getComputedStyle(circleColor).paddingLeft) 
//                             + parseFloat(getComputedStyle(circleColor).paddingRight);
//                 circleColor.style.width = `${Math.ceil(textRect.width + padding + textRect.height)}px`;
//             });
//         });
//     };

//     tightenCircleColors();
//     window.addEventListener('resize', tightenCircleColors);

//     // ── Shared helpers ─────────────────────────────────────────────────────────

//     const getCalloutEls = (wrapper) => ({
//         circle_outline: wrapper.querySelector('.circle-outline'),
//         circle_color:   wrapper.querySelector('.circle-color'),
//         copy:           wrapper.querySelector('.copy-wrapper'),
//         heading:        wrapper.querySelector('.circle-color h2'),
//         color:          wrapper.dataset.color,
//         hoop_color:     wrapper.dataset.colorHoop ?? '#00aeef'
//     });

//     let getCalloutPositions = (circle_outline, circle_color, targetZ, circle_rect) => ({
//         startPos:        scene.getElementWorldPosition(circle_outline, { anchor: 'left',   z: targetZ }),
//         centerPos:       scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: targetZ }),
//         endPos:          scene.getElementWorldPosition(circle_outline, { anchor: 'right',  z: targetZ }),
//         textTargetRight: scene.getElementWorldPosition(circle_color,   { anchor: 'right',  z: targetZ, offsetX: -circle_rect.width / 2 }),
//         textTargetLeft:  scene.getElementWorldPosition(circle_color,   { anchor: 'left',   z: targetZ, offsetX: circle_rect.width / 2 }),
//     });

    

//    const animateCallout0 = (wrapper) => {
//     const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
//     if (!heading) return;

//     const circle_rect = circle_outline.getBoundingClientRect();
//     const targetZ     = chevron.getZForPixelHeight(circle_rect.height * 0.75);
//     const hoop        = scene.addHoop('ring_0', { radiusPx: 80, tubePx: 2, z: targetZ, color: hoop_color });

//     const { startPos, centerPos, endPos, textTargetRight } = getCalloutPositions(circle_outline, circle_color, targetZ, circle_rect);
//     const offCenterPos = scene.getElementWorldPosition(circle_outline, { anchor: 'start', z: targetZ, offsetX: -circle_rect.width / 2 });

//     gsap.set(circle_color, {
//         x:        -circle_rect.width,
//         '--bg':   'transparent',
//         clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
//     });
//     gsap.set(heading, { x: -heading.offsetWidth });

//     hoop.setPosition(centerPos.x, centerPos.y, centerPos.z);
//     hoop.setSize(circle_rect.width, circle_rect.height);
//     chevron.setAngle(27.5);

//     // ── Portal: clip chevron to ring_0 so it appears to emerge from it ──────
//     hoop.enablePortal();
//     hoop.clipChevron(chevron);

//     chevron.setPosition(startPos.x, startPos.y, startPos.z);
//     chevron.setRotation(0, 0, -90);

//     const blindCount = 10;
//     const blindRect = circle_color.getBoundingClientRect();
//     const blindWidth = blindRect.width / blindCount * 1.5; // overlap to cover gaps when rotated

//     const blindEls = Array.from({ length: blindCount }, (_, i) => {
//         const el = document.createElement('div');
//         el.style.cssText = `
//             position: absolute;
//             width: ${blindWidth}px;
//             height: 200%;
//             background: var(--bg);
//             left: ${(i / blindCount) * 100}%;
//             top: -50%;
//             transform-origin: center center;
//             transform: translateX(-50%) rotateZ(45deg) scaleX(0);
//             z-index: -1;
//         `;
//         circle_color.appendChild(el);
//         return { el };
//     });


//     callout_tl
//         .add(chevron.setAngle(45, { duration: 1 }), 0)
//         .fromTo(chevron.root.position,
//             { x: offCenterPos.x, y: offCenterPos.y, z: offCenterPos.z },
//             { x: endPos.x,       y: endPos.y,       z: endPos.z,       duration: 1, ease: 'power2.in' },
//             0
//         )

//         // ── Sentinel: release clip once chevron has fully cleared ring_0 ────
//         // onStart fires when scrubbing forward past t=1.0 (chevron just exited right edge)
//         // onReverseComplete fires when scrubbing back past t=1.0 (re-enter the ring)
//         .to({}, {
//             duration: 0.001,
//             onStart:           () => hoop.releaseChevron(chevron),
//             onReverseComplete: () => hoop.clipChevron(chevron),
//         }, 1.0)

//         .to(chevron.root.position, { x: textTargetRight.x, duration: 2, ease: 'none' }, 1)
//         .to(circle_color, { '--bg': color, duration: 0.5, ease: 'power1.inOut' }, 1)
//         .to(circle_color, {  
//             clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
//             x: -circle_rect.width / 2, 
//             duration: 1, 
//             ease: 'none' }, 1)

//         .to(heading, { x: 0 + circle_rect.width / 3 }, 2);

//         blindEls.forEach(({ el }, i) => {
//             callout_tl.fromTo(el,
//                 { rotateZ: 45, scaleX: 0 },
//                 { rotateZ: 0, scaleX: 2, duration: 1.2, ease: 'power4.inOut' },
//                 2 + i * 0.1
//             );
//         });

//         callout_tl.fromTo(copy, {
//             y:-50,
//             opacity: 0
//         },{
//             y:0,
//             opacity: 1
//         }, 3)

//         .to(chevron.root.rotation, { z: D2R(-180), x: D2R(-31), ease: 'none', duration: 0.30 }, 2.85)

//         .to(chevron.root.position, { z: chevron.root.position.z - 10, ease: 'none', duration: 0.15 }, 2.85);
// };

//     const animateCallout1 = (wrapper) => {
//         const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
//         if (!heading) return;

//         const circle_rect      = circle_outline.getBoundingClientRect();
//         const in_plane_targetZ = chevron.getZForPixelHeight(circle_rect.height * 0.75);
//         const behind_targetZ   = in_plane_targetZ - 20;
//         const hoop             = scene.addHoop('ring_1', { radiusPx: 80, tubePx: 2, z: in_plane_targetZ, color: hoop_color });
//         hoop.setSize(circle_rect.width, circle_rect.height);

//         const { centerPos, textTargetLeft } = getCalloutPositions(circle_outline, circle_color, in_plane_targetZ, circle_rect);
//         const behind_centerPos = scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: behind_targetZ });

//         gsap.set(circle_color, {
//             x:        circle_rect.width,
//             '--bg':   'transparent',
//             clipPath: `inset(0px 0px 0% ${circle_rect.width}px round ${circle_rect.height}px)`,
//         });
//         gsap.set(heading, { x: heading.offsetWidth });

//         hoop.setPosition(centerPos.x, centerPos.y, in_plane_targetZ);

//         const colCount = 13;
//         const colGap = 0; // px gap between columns, 0 for seamless fill

//         const colRect = circle_color.getBoundingClientRect();
//         const colWidth = (colRect.width - colGap * (colCount - 1)) / colCount;

//         const colEls = Array.from({ length: colCount }, (_, i) => {
//             const el = document.createElement('div');
//             const fromAbove = i % 2 === 0; // alternate above/below
//             el.style.cssText = `
//                 position: absolute;
//                 width: ${colWidth}px;
//                 height: 100%;
//                 background: var(--bg);
//                 left: ${i * (colWidth + colGap)}px;
//                 top: 0;
//                 transform: translateY(${fromAbove ? '-100%' : '100%'});
//                 z-index: -1;
//             `;
//             circle_color.appendChild(el);
//             return { el, fromAbove };
//         });

//         callout_tl
//             .to(chevron.root.position,{ 
//                 x: behind_centerPos.x, 
//                 y: behind_centerPos.y, 
//                 z: behind_targetZ, 
//                 duration: 1 
//             }, 3)

//             .to(chevron.root.rotation, { 
//                 x: D2R (-90),
//                 duration: 0.25 
//             }, 3.75)

//             .to(chevron.root.position,{ 
//                 x: centerPos.x, 
//                 y: centerPos.y, 
//                 z: in_plane_targetZ, 
//                 duration: 0.15 
//             }, 4)

//             .to(chevron.root.rotation, { 
//                 y: D2R(45),
//                 duration: 0.15
//             }, 4)

//             .add(chevron.setAngle(27.5, { duration: 0.15 }), 4.15)
//             // .add(chevron.setAngle(45, { duration: 0.15 }), 4.15)

//             .to(chevron.root.rotation, { 
//                 z: D2R(180),
//                 x: D2R(-90),
//                 duration: 0,
//                 ease: 'power2.out'
//             }, 4.15)
            
//             .to(chevron.root.rotation, { 
//                 x: D2R(0),
//                 y: D2R(0),
//                 z: D2R(90),
//                 duration: 0.15,
//                 ease: 'power2.out'
//             }, 4.15)

//             .add(chevron.setAngle(45, { duration: 0.4 }), 4.3)

//             .to(chevron.root.position,{ 
//                 x: textTargetLeft.x, 
//                 duration: 1.85,
//                 ease: 'none'
//             }, 4.15)

//             .to(chevron.root.rotation,{ 
//                 x: D2R(180), 
//                 duration: 1,
//                 ease: 'power2.inOut'
//             }, 4.85)

//             .to(circle_color, { '--bg': color, duration: 0.5, ease: 'power1.inOut' }, 4.15)
//             .to(circle_color,{ 
//                 clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
//                 x: circle_rect.width / 2, 
//                 duration: 1, 
//                 ease: 'none' 
//             }, 4.15)
            
//             .to(heading,{ 
//                 x: 0 - circle_rect.width / 3 
//             }, 5);

//             colEls.slice().reverse().forEach(({ el, fromAbove }, i) => {
//                 callout_tl.fromTo(el,
//                     { 
//                         // width: colWidth, 
//                         y: fromAbove ? '-100%' : '100%' },
//                     { 
//                         // width: colWidth + colGap, 
//                         y: '0%', duration: 1.5, ease: 'power3.inOut' },
//                     4.5 + i * 0.12
//                 );
//             });

//             callout_tl.fromTo(copy, {
//                 y:-50,
//                 opacity: 0
//             },{
//                 y:0,
//                 opacity: 1
//             }, 6)

//             .to(chevron.root.rotation,{   
//                 z: D2R(0), 
//                 y: D2R(-5), 
//                 ease: 'none', 
//                 duration: 0.30 
//             }, 5.85)
//     };

//     const animateCallout2 = (wrapper) => {
//         const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
//         if (!heading) return;

//         const circle_rect      = circle_outline.getBoundingClientRect();
//         const in_plane_targetZ = chevron.getZForPixelHeight(circle_rect.height * 0.75);
//         const behind_targetZ   = in_plane_targetZ - 20;

//         const hoop = scene.addHoop('ring_2', { radiusPx: 80, tubePx: 2, z: in_plane_targetZ, color: hoop_color });
//         hoop.setSize(circle_rect.width, circle_rect.height);

//         const { startPos, centerPos, endPos, textTargetRight } = getCalloutPositions(circle_outline, circle_color, in_plane_targetZ, circle_rect);
//         const behind_centerPos = scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: behind_targetZ, offsetY: circle_rect.height });

//         gsap.set(circle_color, {
//             x:        -circle_rect.width,
//             '--bg':   'transparent',
//             clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
//         });
//         gsap.set(heading, { x: -heading.offsetWidth });

//         hoop.setPosition(centerPos.x, centerPos.y, in_plane_targetZ);
//         hoop.enablePortal();

//         const circleCount = 15;
//         const freq = 3; // number of full oscillations
//         const amplitude = 0.35; // fraction of container height

//         const rect = circle_color.getBoundingClientRect();
//         const w = rect.width;
//         const h = rect.height;

//         const circleEls = Array.from({ length: circleCount }, (_, i) => {
//             const t = i / (circleCount - 1); // 0 → 1 across width
//             const x = t * 100; // % left
//             const y = 50 + amplitude * 100 * Math.sin(t * freq * Math.PI * 2); // % top

//             const size = 50 + Math.random() * 150;
//             const el = document.createElement('div');
//             el.style.cssText = `
//                 position: absolute;
//                 width: ${size}px;
//                 height: ${size}px;
//                 border-radius: 50%;
//                 background: var(--bg);
//                 left: ${x}%;
//                 top: ${y}%;
//                 transform: translate(-50%, -50%) scale(0);
//                 z-index: -1;
//             `;
//             circle_color.appendChild(el);
//             return { el, dur: 3 + Math.random() * 2 };
//         });

//         callout_tl
//             .to(chevron.root.position, {
//                 x: behind_centerPos.x,
//                 y: behind_centerPos.y,
//                 z: behind_targetZ,
//                 duration: 1
//             }, 6)

//             .add(chevron.setAngle(27.5, { duration: 1 }), 6)

//             .to({}, {
//                 duration: 0.001,
//                 onStart:           () => hoop.clipChevron(chevron),
//                 onReverseComplete: () => hoop.releaseChevron(chevron),
//             }, 6.35)

//             .to(circle_color, { '--bg': color, duration: 0.5, ease: 'power1.inOut' }, 6)
//             .to(circle_color, { 
//                 clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
//                 x: -circle_rect.width / 2, 
//                 duration: 1, ease: 'none' }, 6)

//             .to(heading, { x: 0 + circle_rect.width / 3 }, 7)

//             .fromTo(copy, {
//                 y: -50,
//                 opacity: 0
//             }, {
//                 y: 0,
//                 opacity: 1
//             }, 8)

//         circleEls.forEach(({ el, dur }) => {
//             callout_tl.fromTo(el,
//                 { scale: 0, },
//                 { scale: 3, duration: dur, ease: 'power4.inOut' },
//                 7.5
//             );
//             callout_tl.fromTo(el,
//                 { x: -150, },
//                 { x: 0, duration: dur, ease: 'none' },
//                 7.5
//             );
//         });

//     };

//     // ── Dispatch ───────────────────────────────────────────────────────────────

//     const handlers = [animateCallout0, animateCallout1, animateCallout2];

//     callouts.forEach((wrapper, index) => {
//         handlers[index]?.(wrapper);
//     });
// }

//version 2 with pin
export function calloutAnimation(chevron, scene, containerRef) {
    if (!containerRef.current) return;

    const callouts = containerRef.current.querySelectorAll('.callout_wrapper');
    chevron.setColor("both", '#e7e7e7', '#8e8e8e');


    const callout_tl = gsap.timeline({
        scrollTrigger: {
            trigger: containerRef.current,
            start:   "top 50%",
            end:     "bottom 33%",
            scrub:   2,
            // markers: true,
        }
    });

    const tightenCircleColors = () => {
        callouts.forEach(wrapper => {
            const h2 = wrapper.querySelector('.circle-color h2');
            const circleColor = wrapper.querySelector('.circle-color');
            if (!h2 || !circleColor) return;

            // Clear so it re-wraps at natural grid width
            circleColor.style.width = '';

            requestAnimationFrame(() => {
                const range = document.createRange();
                range.selectNodeContents(h2);
                const textRect= range.getBoundingClientRect();
                const padding = parseFloat(getComputedStyle(circleColor).paddingLeft) 
                            + parseFloat(getComputedStyle(circleColor).paddingRight);
                circleColor.style.width = `${Math.ceil(textRect.width + padding + textRect.height)}px`;
            });
        });
    };

    tightenCircleColors();
    window.addEventListener('resize', tightenCircleColors);

    // ── Shared helpers ─────────────────────────────────────────────────────────

    const getCalloutEls = (wrapper) => ({
        circle_outline: wrapper.querySelector('.circle-outline'),
        circle_color:   wrapper.querySelector('.circle-color'),
        copy:           wrapper.querySelector('.copy-wrapper'),
        heading:        wrapper.querySelector('.circle-color h2'),
        color:          wrapper.dataset.color,
        hoop_color:     wrapper.dataset.colorHoop ?? '#00aeef'
    });

    let getCalloutPositions = (circle_outline, circle_color, targetZ, circle_rect) => ({
        startPos:        scene.getElementWorldPosition(circle_outline, { anchor: 'left',   z: targetZ }),
        centerPos:       scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: targetZ }),
        endPos:          scene.getElementWorldPosition(circle_outline, { anchor: 'right',  z: targetZ }),
        textTargetRight: scene.getElementWorldPosition(circle_color,   { anchor: 'right',  z: targetZ, offsetX: -circle_rect.width / 2 }),
        textTargetLeft:  scene.getElementWorldPosition(circle_color,   { anchor: 'left',   z: targetZ, offsetX: circle_rect.width / 2 }),
    });

    

   const animateCallout0 = (wrapper) => {
    const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
    if (!heading) return;

    const circle_rect = circle_outline.getBoundingClientRect();
    const targetZ     = chevron.getZForPixelHeight(circle_rect.height * 0.75);
    const hoop        = scene.addHoop('ring_0', { radiusPx: 80, tubePx: 2, z: targetZ, color: hoop_color });

    const { startPos, centerPos, endPos, textTargetRight } = getCalloutPositions(circle_outline, circle_color, targetZ, circle_rect);
    const offCenterPos = scene.getElementWorldPosition(circle_outline, { anchor: 'start', z: targetZ, offsetX: -circle_rect.width });

    gsap.set(circle_color, {
        x:        -circle_rect.width,
        '--bg':   'transparent',
        clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
    });
    gsap.set(heading, { x: -heading.offsetWidth });

    hoop.setPosition(centerPos.x, centerPos.y, centerPos.z);
    hoop.setSize(circle_rect.width, circle_rect.height);
    chevron.setAngle(27.5);

    // ── Portal: clip chevron to ring_0 so it appears to emerge from it ──────
    hoop.enablePortal();
    hoop.clipChevron(chevron);

    chevron.setPosition(startPos.x, startPos.y, startPos.z);
    chevron.setRotation(0, 0, -90);

    const blindCount = 8;
    const blindRect = circle_color.getBoundingClientRect();
    const blindWidth = (blindRect.width) / blindCount * 1.5; // overlap to cover gaps when rotated
    
    // left: calc(${(i / blindCount) * 100}% + ${circle_rect.width}px);
    const blindEls = Array.from({ length: blindCount }, (_, i) => {
        const el = document.createElement('div');
        el.style.cssText = `
            position: absolute;
            width: ${blindWidth}px;
            height: 200%;
            background: var(--bg);
            left: ${(i / blindCount) * 100}%;
            top: -50%;
            transform-origin: center center;
            transform: translateX(-50%) rotateZ(45deg) scaleX(0);
            z-index: -1;
        `;
        circle_color.appendChild(el);
        return { el };
    });


    callout_tl
        .add(chevron.setAngle(45, { duration: 1, ease:"expo.in" }), 0)
        .fromTo(chevron.root.position,
            { x: offCenterPos.x, y: offCenterPos.y, z: offCenterPos.z },
            { x: endPos.x,       y: endPos.y,       z: endPos.z,       duration: 1, ease: 'power2.in' },
            0
        )

        // ── Sentinel: release clip once chevron has fully cleared ring_0 ────
        // onStart fires when scrubbing forward past t=1.0 (chevron just exited right edge)
        // onReverseComplete fires when scrubbing back past t=1.0 (re-enter the ring)
        .to({}, {
            duration: 0.001,
            onStart:           () => hoop.releaseChevron(chevron),
            onReverseComplete: () => hoop.clipChevron(chevron),
        }, 0.95)

        .to(chevron.root.position, { x: textTargetRight.x, duration: 2, ease: 'none' }, 1)
        .to(circle_color, { '--bg': color, duration: 0.5, ease: 'power1.inOut' }, 1)
        .to(circle_color, {  
            clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
            x: -circle_rect.width / 2, 
            duration: 1, 
            ease: 'none' }, 1)

        .to(heading, { x: 0 + circle_rect.width / 3 }, 2);

        blindEls.forEach(({ el }, i) => {
            callout_tl.fromTo(el,
                { rotateZ: 45, scaleX: 0 },
                { rotateZ: 0, scaleX: 2, duration: 1.2, ease: 'power4.inOut' },
                2 + i * 0.1
            );
        });

        callout_tl.fromTo(copy, {
            y:-50,
            opacity: 0
        },{
            y:0,
            opacity: 1
        }, 3)

        .to(chevron.root.rotation, { z: D2R(-180), x: D2R(-31), ease: 'none', duration: 0.30 }, 2.85)

        .to(chevron.root.position, { z: chevron.root.position.z - 10, ease: 'none', duration: 0.15 }, 2.85);
};

    const animateCallout1 = (wrapper) => {
        const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
        if (!heading) return;

        const circle_rect      = circle_outline.getBoundingClientRect();
        const in_plane_targetZ = chevron.getZForPixelHeight(circle_rect.height * 0.75);
        const behind_targetZ   = in_plane_targetZ - 20;
        const hoop             = scene.addHoop('ring_1', { radiusPx: 80, tubePx: 2, z: in_plane_targetZ, color: hoop_color });
        hoop.setSize(circle_rect.width, circle_rect.height);

        const { centerPos, textTargetLeft } = getCalloutPositions(circle_outline, circle_color, in_plane_targetZ, circle_rect);
        const behind_centerPos = scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: behind_targetZ });

        gsap.set(circle_color, {
            x:        circle_rect.width,
            '--bg':   'transparent',
            clipPath: `inset(0px 0px 0% ${circle_rect.width}px round ${circle_rect.height}px)`,
        });
        gsap.set(heading, { x: heading.offsetWidth });

        hoop.setPosition(centerPos.x, centerPos.y, in_plane_targetZ);

        const colCount = 13;
        const colGap = -1; // px gap between columns, 0 for seamless fill

        const colRect = circle_color.getBoundingClientRect();
        const colWidth = (colRect.width - colGap * (colCount - 1)) / colCount;

        const colEls = Array.from({ length: colCount }, (_, i) => {
            const el = document.createElement('div');
            const fromAbove = i % 2 === 0; // alternate above/below
            el.style.cssText = `
                position: absolute;
                width: ${colWidth}px;
                height: 100%;
                background: var(--bg);
                left: ${i * (colWidth + colGap)}px;
                top: 0;
                transform: translateY(${fromAbove ? '-100%' : '100%'});
                z-index: -1;
            `;
            circle_color.appendChild(el);
            return { el, fromAbove };
        });

        callout_tl
            .to(chevron.root.position,{ 
                x: behind_centerPos.x, 
                y: behind_centerPos.y, 
                z: behind_targetZ, 
                duration: 1 
            }, 3)

            .to(chevron.root.rotation, { 
                x: D2R (-90),
                duration: 0.25 
            }, 3.75)

            .to(chevron.root.position,{ 
                x: centerPos.x, 
                y: centerPos.y, 
                z: in_plane_targetZ, 
                duration: 0.15 
            }, 4)

            .to(chevron.root.rotation, { 
                y: D2R(45),
                duration: 0.15
            }, 4)

            .add(chevron.setAngle(27.5, { duration: 0.15 }), 4.15)
            // .add(chevron.setAngle(45, { duration: 0.15 }), 4.15)

            .to(chevron.root.rotation, { 
                z: D2R(180),
                x: D2R(-90),
                duration: 0,
                ease: 'power2.out'
            }, 4.15)
            
            .to(chevron.root.rotation, { 
                x: D2R(0),
                y: D2R(0),
                z: D2R(90),
                duration: 0.15,
                ease: 'power2.out'
            }, 4.15)

            .add(chevron.setAngle(45, { duration: 0.4 }), 4.3)

            .to(chevron.root.position,{ 
                x: textTargetLeft.x, 
                duration: 1.85,
                ease: 'none'
            }, 4.15)

            .to(chevron.root.rotation,{ 
                x: D2R(180), 
                duration: 1,
                ease: 'power2.inOut'
            }, 4.85)

            .to(circle_color, { '--bg': color, duration: 0.5, ease: 'power1.inOut' }, 4.15)
            .to(circle_color,{ 
                clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
                x: circle_rect.width / 2, 
                duration: 1, 
                ease: 'none' 
            }, 4.15)
            
            .to(heading,{ 
                x: 0 - circle_rect.width / 3 
            }, 5);

            colEls.slice().reverse().forEach(({ el, fromAbove }, i) => {
                callout_tl.fromTo(el,
                    { 
                        // width: colWidth, 
                        y: fromAbove ? '-100%' : '100%' },
                    { 
                        // width: colWidth + colGap, 
                        y: '0%', duration: 1.5, ease: 'power3.inOut' },
                    4.5 + i * 0.12
                );
            });

            callout_tl.fromTo(copy, {
                y:-50,
                opacity: 0
            },{
                y:0,
                opacity: 1
            }, 6)

            .to(chevron.root.rotation,{   
                z: D2R(0), 
                y: D2R(-5), 
                ease: 'none', 
                duration: 0.30 
            }, 5.85)
    };

    const animateCallout2 = (wrapper) => {
        const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
        if (!heading) return;

        const circle_rect      = circle_outline.getBoundingClientRect();
        const in_plane_targetZ = chevron.getZForPixelHeight(circle_rect.height * 0.75);
        const behind_targetZ   = in_plane_targetZ - 20;

        const hoop = scene.addHoop('ring_2', { radiusPx: 80, tubePx: 2, z: in_plane_targetZ, color: hoop_color });
        hoop.setSize(circle_rect.width, circle_rect.height);

        const { startPos, centerPos, endPos, textTargetRight } = getCalloutPositions(circle_outline, circle_color, in_plane_targetZ, circle_rect);
        const behind_centerPos = scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: behind_targetZ, offsetY: circle_rect.height });

        gsap.set(circle_color, {
            x:        -circle_rect.width,
            '--bg':   'transparent',
            clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
        });
        gsap.set(heading, { x: -heading.offsetWidth });

        hoop.setPosition(centerPos.x, centerPos.y, in_plane_targetZ);
        hoop.enablePortal();

        const circleCount = 15;
        const freq = 3; // number of full oscillations
        const amplitude = 0.35; // fraction of container height

        const rect = circle_color.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        const circleEls = Array.from({ length: circleCount }, (_, i) => {
            const t = i / (circleCount - 1); // 0 → 1 across width
            const x = t * 100; // % left
            const y = 50 + amplitude * 100 * Math.sin(t * freq * Math.PI * 2); // % top

            const size = 50 + Math.random() * 150;
            const el = document.createElement('div');
            el.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: var(--bg);
                left: ${x}%;
                top: ${y}%;
                transform: translate(-50%, -50%) scale(0);
                z-index: -1;
            `;
            circle_color.appendChild(el);
            return { el, dur: 3 + Math.random() * 2 };
        });

        callout_tl
            .to(chevron.root.position, {
                x: behind_centerPos.x,
                y: behind_centerPos.y,
                z: behind_targetZ,
                duration: 1
            }, 6)

            .add(chevron.setAngle(27.5, { duration: 1 }), 6)

            .to({}, {
                duration: 0.001,
                onStart:           () => hoop.clipChevron(chevron),
                onReverseComplete: () => hoop.releaseChevron(chevron),
            }, 6.35)

            .to(circle_color, { '--bg': color, duration: 0.5, ease: 'power1.inOut' }, 6)
            .to(circle_color, { 
                clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
                x: -circle_rect.width / 2, 
                duration: 1, ease: 'none' }, 6)

            .to(heading, { x: 0 + circle_rect.width / 3 }, 7)

            .fromTo(copy, {
                y: -50,
                opacity: 0
            }, {
                y: 0,
                opacity: 1
            }, 8)

        circleEls.forEach(({ el, dur }) => {
            callout_tl.fromTo(el,
                { scale: 0, },
                { scale: 3, duration: dur, ease: 'power4.inOut' },
                7.5
            );
            callout_tl.fromTo(el,
                { x: -150, },
                { x: 0, duration: dur, ease: 'none' },
                7.5
            );
        });

    };

    // ── Dispatch ───────────────────────────────────────────────────────────────

    const handlers = [animateCallout0, animateCallout1, animateCallout2];

    callouts.forEach((wrapper, index) => {
        handlers[index]?.(wrapper);
    });
}

// export function calloutAnimation(chevron, scene, containerRef) {
//     if (!containerRef.current) return;

//     const callouts = containerRef.current.querySelectorAll('.callout_wrapper');
//     const canvas   = scene.renderer.domElement;

//     // Hoops sit this many units in front of the chevron to prevent z-fighting
//     const HOOP_Z_OFFSET = 5;

//     const callout_tl = gsap.timeline({
//         scrollTrigger: {
//             trigger: containerRef.current,
//             start:   "top 50%",
//             end:     "bottom 75%",
//             scrub:   1,
//             markers: true,
//         }
//     });

//     // ── Shared helpers ─────────────────────────────────────────────────────────

//     const getCalloutEls = (wrapper) => ({
//         circle_outline: wrapper.querySelector('.circle-outline'),
//         circle_color:   wrapper.querySelector('.circle-color'),
//         copy:           wrapper.querySelector('.copy-wrapper'),
//         heading:        wrapper.querySelector('.circle-color h2'),
//         color:          wrapper.dataset.color,
//         hoop_color:     wrapper.dataset.colorHoop ?? '#00aeef'
//     });

//     let getCalloutPositions = (circle_outline, circle_color, targetZ, circle_rect) => ({
//         startPos:        scene.getElementWorldPosition(circle_outline, { anchor: 'left',   z: targetZ }),
//         centerPos:       scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: targetZ }),
//         endPos:          scene.getElementWorldPosition(circle_outline, { anchor: 'right',  z: targetZ }),
//         textTargetRight: scene.getElementWorldPosition(circle_color,   { anchor: 'right',  z: targetZ, offsetX: -circle_rect.width / 2 }),
//         textTargetLeft:  scene.getElementWorldPosition(circle_color,   { anchor: 'left',   z: targetZ, offsetX: circle_rect.width / 2 }),
//     });


//    const animateCallout0 = (wrapper) => {
//     const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
//     if (!heading) return;

//     const circle_rect = circle_outline.getBoundingClientRect();
//     const targetZ     = chevron.getZForPixelHeight(circle_rect.height * 0.75);
//     const hoop        = scene.addHoop('ring_0', { radiusPx: 80, tubePx: 2, z: targetZ, color: hoop_color });

//     const { startPos, centerPos, endPos, textTargetRight } = getCalloutPositions(circle_outline, circle_color, targetZ, circle_rect);
//     const offCenterPos = scene.getElementWorldPosition(circle_outline, { anchor: 'start', z: targetZ, offsetX: -circle_rect.width / 2 });

//     gsap.set(heading, { x: -heading.offsetWidth });

//     hoop.setPosition(centerPos.x, centerPos.y, centerPos.z);
//     hoop.setSize(circle_rect.width, circle_rect.height);
//     chevron.setAngle(27.5);

//     // ── Portal: clip chevron to ring_0 so it appears to emerge from it ──────
//     hoop.enablePortal();
//     hoop.clipChevron(chevron);

//     chevron.setPosition(startPos.x, startPos.y, startPos.z);
//     chevron.setRotation(0, 0, -90);

//     const rightEdgeOfOutline = circle_rect.width; // in parent coords
//     const circleColorLeft = -circle_rect.width * 2; // gsap x offset
//     const clipLeft = ((rightEdgeOfOutline - circleColorLeft) / circle_rect.width);


//     gsap.set(circle_color, {
//         x:        -circle_rect.width,
//         '--scale' :0,
//         clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
//     });

//     callout_tl
//         .add(chevron.setAngle(45, { duration: 1 }), 0)
//         .fromTo(chevron.root.position,
//             { x: offCenterPos.x, y: offCenterPos.y, z: offCenterPos.z },
//             { x: endPos.x,       y: endPos.y,       z: endPos.z,       duration: 1, ease: 'power2.in' },
//             0
//         )

//         // ── Sentinel: release clip once chevron has fully cleared ring_0 ────
//         // onStart fires when scrubbing forward past t=1.0 (chevron just exited right edge)
//         // onReverseComplete fires when scrubbing back past t=1.0 (re-enter the ring)
//         .to({}, {
//             duration: 0.001,
//             onStart:           () => hoop.releaseChevron(chevron),
//             onReverseComplete: () => hoop.clipChevron(chevron),
//         }, 1.0)

//         .to(chevron.root.position, { x: textTargetRight.x, duration: 2, ease: 'none' }, 1)
//         .to(circle_color, { 
//             '--scale' : 1, duration: 0.25, ease: 'expo.in'
//         }, 1)
//         .to(circle_color, { 
//             x: -circle_rect.width / 2, 
//             // clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`, 
//             duration: 1, ease: 'none' }, 1)

//         .to(heading, { x: 0 + circle_rect.width / 3 }, 2)

//         .fromTo(copy, {
//             y:-50,
//             opacity: 0
//         },{
//             y:0,
//             opacity: 1
//         }, 3)

//         .to(chevron.root.rotation, { z: D2R(-180), x: D2R(-31), ease: 'none', duration: 0.30 }, 2.85)

//         .to(chevron.root.position, { z: chevron.root.position.z - 10, ease: 'none', duration: 0.15 }, 2.85);
// };

//     const animateCallout1 = (wrapper) => {
//         const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
//         if (!heading) return;

//         const circle_rect      = circle_outline.getBoundingClientRect();
//         const in_plane_targetZ = chevron.getZForPixelHeight(circle_rect.height * 0.75);
//         const behind_targetZ   = in_plane_targetZ - 20;
//         const hoop             = scene.addHoop('ring_1', { radiusPx: 80, tubePx: 2, z: in_plane_targetZ, color: hoop_color });
//         hoop.setSize(circle_rect.width, circle_rect.height);

//         const { centerPos, textTargetLeft } = getCalloutPositions(circle_outline, circle_color, in_plane_targetZ, circle_rect);
//         const behind_centerPos = scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: behind_targetZ });

//         gsap.set(circle_color, {
//             x:        circle_rect.width,
//             '--bg':   'transparent',
//             clipPath: `inset(0px 0px 0% ${circle_rect.width}px round ${circle_rect.height}px)`,
//         });
//         gsap.set(heading, { x: heading.offsetWidth });

//         hoop.setPosition(centerPos.x, centerPos.y, in_plane_targetZ);

//         callout_tl
//             .to(chevron.root.position,{ 
//                 x: behind_centerPos.x, 
//                 y: behind_centerPos.y, 
//                 z: behind_targetZ, 
//                 duration: 1 
//             }, 3)

//             .to(chevron.root.rotation, { 
//                 x: D2R (-90),
//                 duration: 0.25 
//             }, 3.75)

//             .to(chevron.root.position,{ 
//                 x: centerPos.x, 
//                 y: centerPos.y, 
//                 z: in_plane_targetZ, 
//                 duration: 0.15 
//             }, 4)

//             .to(chevron.root.rotation, { 
//                 y: D2R(45),
//                 duration: 0.15
//             }, 4)

//             .add(chevron.setAngle(27.5, { duration: 0.15 }), 4.15)
//             // .add(chevron.setAngle(45, { duration: 0.15 }), 4.15)

//             .to(chevron.root.rotation, { 
//                 z: D2R(180),
//                 x: D2R(-90),
//                 duration: 0,
//                 ease: 'power2.out'
//             }, 4.15)
            
//             .to(chevron.root.rotation, { 
//                 x: D2R(0),
//                 y: D2R(0),
//                 z: D2R(90),
//                 duration: 0.15,
//                 ease: 'power2.out'
//             }, 4.15)

//             .add(chevron.setAngle(45, { duration: 0.4 }), 4.3)

//             .to(chevron.root.position,{ 
//                 x: textTargetLeft.x, 
//                 duration: 1.85,
//                 ease: 'none'
//             }, 4.15)

//             .to(chevron.root.rotation,{ 
//                 x: D2R(180), 
//                 duration: 1,
//                 ease: 'power2.inOut'
//             }, 4.85)

//             .to(circle_color,{ 
//                 '--bg': color, 
//                 x: circle_rect.width / 2, 
//                 duration: 1, 
//                 ease: 'none' 
//             }, 4.15)
            
//             .to(heading,{ 
//                 x: 0 - circle_rect.width / 3 
//             }, 5)

//             .fromTo(copy, {
//                 y:-50,
//                 opacity: 0
//             },{
//                 y:0,
//                 opacity: 1
//             }, 6)

//             .to(chevron.root.rotation,{   
//                 z: D2R(0), 
//                 y: D2R(-5), 
//                 ease: 'none', 
//                 duration: 0.30 
//             }, 5.85)
//     };

//     const animateCallout2 = (wrapper) => {
//         const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
//         if (!heading) return;

//         const circle_rect      = circle_outline.getBoundingClientRect();
//         const in_plane_targetZ = chevron.getZForPixelHeight(circle_rect.height * 0.75);
//         const behind_targetZ   = in_plane_targetZ - 20;

//         const hoop = scene.addHoop('ring_2', { radiusPx: 80, tubePx: 2, z: in_plane_targetZ, color: hoop_color });
//         hoop.setSize(circle_rect.width, circle_rect.height);

//         const { startPos, centerPos, endPos, textTargetRight } = getCalloutPositions(circle_outline, circle_color, in_plane_targetZ, circle_rect);
//         const behind_centerPos = scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: behind_targetZ, offsetY: circle_rect.height });

//         gsap.set(circle_color, {
//             x:        -circle_rect.width,
//             '--bg':   'transparent',
//             clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
//         });
//         gsap.set(heading, { x: -heading.offsetWidth });

//         hoop.setPosition(centerPos.x, centerPos.y, in_plane_targetZ);

//         // ── Portal: stamp stencil disc from the start so it's ready ─────────────
//         // Chevron is NOT clipped yet — only clipped once it enters the ring plane.
//         // depthTest:false on the disc means it stamps even when the chevron
//         // is behind it in world space, which is exactly what we need here.
//         hoop.enablePortal();

//         callout_tl
//             .to(chevron.root.position, {
//                 x: behind_centerPos.x,
//                 y: behind_centerPos.y,
//                 z: behind_targetZ,
//                 duration: 1
//             }, 6)

//             .add(chevron.setAngle(27.5, { duration: 1 }), 6)

//             // ── Sentinel: clip chevron to ring_2 as it crosses the hoop plane ───
//             // Fires at t=6.35 — chevron is approaching the ring face. From this
//             // point forward it is only visible inside the disc, giving the
//             // impression it is swallowed by the portal as it recedes behind the ring.
//             // onReverseComplete undoes the clip when scrubbing backward.
//             .to({}, {
//                 duration: 0.001,
//                 onStart:           () => hoop.clipChevron(chevron),
//                 onReverseComplete: () => hoop.releaseChevron(chevron),
//             }, 6.35)

//             .to(circle_color, { '--bg': color, x: -circle_rect.width / 2, duration: 1, ease: 'none' }, 6)

//             .to(heading, { x: 0 + circle_rect.width / 3 }, 7)

//             .fromTo(copy, {
//                 y:-50,
//                 opacity: 0
//             },{
//                 y:0,
//                 opacity: 1
//             }, 8)

//     };

//     // ── Dispatch ───────────────────────────────────────────────────────────────

//     const handlers = [animateCallout0, animateCallout1, animateCallout2];

//     callouts.forEach((wrapper, index) => {
//         handlers[index]?.(wrapper);
//     });
// }


const D2R = (d) => THREE.MathUtils.degToRad(d);

function ChevronDevBox({ chevron, inset = "50px 10px 0 0" }) {
    const [pos, setPos]     = useState({ x: 0, y: 0, z: 0 });
    const [rot, setRot]     = useState({ x: 0, y: 0, z: 0 });
    const [arm, setArm]     = useState(45);
    const activeRef         = useRef(null);

    const D2R = d => d * Math.PI / 180;
    const R2D = r => parseFloat((r * 180 / Math.PI).toFixed(1));
    useEffect(() => {
        const handleMouseUp = () => { activeRef.current = null; };
        const handleTouchEnd = () => { activeRef.current = null; };
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchend', handleTouchEnd);
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    useEffect(() => {
        if (!chevron) return;
        const update = () => {
            // ← THE FIX: don't clobber state while the user is dragging/typing
            if (activeRef.current) return;

            const p = chevron.root.position;
            const r = chevron.root.rotation;
            setPos({ x: parseFloat(p.x.toFixed(2)), y: parseFloat(p.y.toFixed(2)), z: parseFloat(p.z.toFixed(2)) });
            setRot({ x: R2D(r.x), y: R2D(r.y), z: R2D(r.z) });
            setArm(R2D(chevron.arm1.rotation.z));
        };
        gsap.ticker.add(update);
        return () => gsap.ticker.remove(update);
    }, [chevron]);

    const applyPos = (axis, v) => { chevron.root.position[axis] = v; setPos(p => ({ ...p, [axis]: v })); };
    const applyRot = (axis, v) => { chevron.root.rotation[axis] = D2R(v); setRot(r => ({ ...r, [axis]: v })); };
    const applyArm = (v) => { chevron.arm1.rotation.z = D2R(v); chevron.arm2.rotation.z = -D2R(v); setArm(v); };

    if (!chevron) return null;

    const trackStyle  = { display: 'grid', gridTemplateColumns: '14px 1fr 56px', alignItems: 'center', gap: '6px', marginBottom: '4px' };
    const labelStyle  = (color) => ({ fontSize: '10px', fontWeight: '700', color, textAlign: 'center' });
    const numStyle    = { background: '#1a1d28', border: '1px solid #2a2d38', borderRadius: '3px', color: '#c8ccd8', fontFamily: 'monospace', fontSize: '14px', padding: '2px 4px', width: '100%', textAlign: 'right' };
    const sectionStyle = { fontSize: '9px', letterSpacing: '0.2em', color: '#4a4f63', margin: '8px 0 5px', paddingBottom: '4px', borderBottom: '1px solid #2a2d38' };

    const Track = ({ label, color, value, min, max, step = 0.1, onChange }) => (
    <div style={trackStyle}>
        <span style={labelStyle(color)}>{label}</span>
        <input
            type="range" min={min} max={max} step={step} value={value}
            onMouseDown={() => activeRef.current = label}
            onTouchStart={() => activeRef.current = label}
            onChange={e => onChange(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: color }}
        />
        <input
            type="number" min={min} max={max} step={step}
            value={value}
            onFocus={() => activeRef.current = label}
            onBlur={()  => { activeRef.current = null; }}
            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
            style={numStyle}
        />
    </div>
);

    // Portal renders outside the pointer-events:none scene wrapper
    return createPortal(
        <div style={{
            position: 'fixed', inset, width: '280px', height: 'fit-content',
            background: '#0d0f14', border: '1px solid #2a2d38',
            borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px',
            color: '#c8ccd8', zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)', userSelect: 'none',
            overflow: 'hidden', pointerEvents: 'auto',
        }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', background:'#13161f', borderBottom:'1px solid #2a2d38' }}>
                <span style={{ fontSize:'14px', color:'#4d9fff' }}>⬡</span>
                <span style={{ flex:1, letterSpacing:'0.15em', fontSize:'10px', color:'#7a7f94' }}>CHEVRON DEV</span>
            </div>

            <div style={{ padding: '8px 12px' }}>
                <div style={sectionStyle}>POSITION</div>
                <Track label="X" color="#ff4d6d" value={pos.x} min={-50} max={50}  onChange={v => applyPos('x', v)} />
                <Track label="Y" color="#39ff80" value={pos.y} min={-50} max={50}  onChange={v => applyPos('y', v)} />
                <Track label="Z" color="#4d9fff" value={pos.z} min={-100} max={30} onChange={v => applyPos('z', v)} />

                <div style={sectionStyle}>ROTATION °</div>
                <Track label="X" color="#ff4d6d" value={rot.x} min={-180} max={180} step={1} onChange={v => applyRot('x', v)} />
                <Track label="Y" color="#39ff80" value={rot.y} min={-180} max={180} step={1} onChange={v => applyRot('y', v)} />
                <Track label="Z" color="#4d9fff" value={rot.z} min={-180} max={180} step={1} onChange={v => applyRot('z', v)} />

                <div style={sectionStyle}>ARM ANGLE °</div>
                <Track label="A" color="#f5c542" value={arm} min={0} max={90} step={0.5} onChange={applyArm} />
            </div>
        </div>,
        document.body
    );
}