import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ChevronScene } from '@/3dcomponents/ChevronScene.js';
import { Hoop } from '@/3dcomponents/Hoop.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
        <div
            ref={canvasRef}
            className='scene-wrapper'
            style={{ zIndex: 0, position: 'absolute', pointerEvents: 'none', 
                width, height, inset,
            }}
        >
            {debug && (<ChevronDevBox chevron={chevron} />)}
        </div>
    );
}

export default Scene;

export function fireHeroAnimation(chevron, scene) {
    const preventScroll = (e) => e.preventDefault();
    window.addEventListener('wheel',     preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });

    const container = document.querySelector('.Hero');
    const text      = container.querySelector('.text');
    const ball      = container.querySelector('.ball');
    const rect      = text.getBoundingClientRect();

    // ── Pre-calculate all positions before timeline builds ──────────────────
    const magicNum1 = 0.75;
    const magicNum2 = 2;
    const magicNum3 = 10;
    const gapBetweenCnB = -20

    const targetZ = chevron.getZForPixelHeight(rect.height * magicNum1);

    console.log('targetZ',targetZ);
    console.log('rect.height', rect.height);
    console.log('canvas clientHeight', scene.canvasHeight);
    console.log('canvas clientWidth', scene.canvasWidth);

    // World units → pixels at targetZ depth

    // Where the chevron lands — left of the text, vertically centered
    const chevronWidth = rect.height * magicNum1 * 0.4; // approximate world-unit width at targetZ
    const destPos = scene.getElementWorldPosition(text, {
        anchor:  'center',
        z:       targetZ,
        offsetX: -(rect.width / 2) - (chevronWidth / 2) + gapBetweenCnB,
    });

    // Off-screen start — same Y and Z as destination, far right
    const startPos = scene.getElementWorldPosition(text, {
        anchor:  'right',
        z:       targetZ,
    });

    // ── Set stage (instant, before timeline plays) ───────────────────────────
    chevron.setRotation(0, 0, 90);
    chevron.setPosition(startPos.x, startPos.y, startPos.z);

    // ── CSS variable — current value so we can increment from it ─────────────
    const currentOffset = parseFloat(
        getComputedStyle(container).getPropertyValue('--flip-offset') || '0'
    );
    const targetOffset = currentOffset + rect.height * magicNum1; // match chevron height in px
    const offsetPct = ((targetOffset / rect.width) * 100).toFixed(3);
    // console.log('offsetPct',offsetPct);

    // ── Timeline ─────────────────────────────────────────────────────────────
    const tl = gsap.timeline();

    tl  // Fly chevron in from right
        .add(
            chevron.open(), { duration: 0.7 }
        , 0)

        .to(chevron.root.position, {
            x:        destPos.x + magicNum3,
            y:        destPos.y + magicNum2,
            z:        destPos.z,
            duration: 0.7,
            ease:     'power3.in',
            onUpdate: () => {
                const projected = chevron.root.position.clone().project(scene.camera);
                const screenX   = ((projected.x + 1) / 2) * window.innerWidth;

                // Convert capsule diameter to screen pixels at current Z depth
                const depth      = scene.camera.position.z - chevron.root.position.z;
                const visibleH   = 2 * Math.tan(THREE.MathUtils.degToRad(scene.camera.fov / 2)) * depth;
                const pxPerUnit  = window.innerHeight / visibleH;
                const rightEdgePx = screenX + (chevron.c_radius * pxPerUnit);

                const textRect = text.getBoundingClientRect();
                const localPct = ((rightEdgePx - textRect.left) / textRect.width * 100).toFixed(3);
                text.style.clipPath = `inset(0 0 0 ${localPct}%)`;
            },
        }, 0.7)
        
        .to(container, {
            '--flip-offset': `${targetOffset}px`,
            duration:         0.7,
            ease:             'power3.in',
        }, 0.7)
        
        .to(chevron.root.rotation, {
            y: D2R(190),
            duration: 0.7,
            ease: 'none',
        }, 0)

        .add( chevron.setAngle(45, {
            duration: 1.4,
            ease: 'power3.inOut',
        }),
        0.7 ) 

        .fromTo(ball, {
            left: 'calc(0px - var(--ball-size))',
        },
        {
            left: `calc(${container.offsetWidth/2 - targetOffset}px - var(--ball-size))`,
            duration:         0.5,
            ease:             'power3.out',
        }, 1.4)

        .to(chevron.root.position, {
            x: destPos.x,
            duration: 0.5,
            ease: 'power3.out',
        }, 1.4)

        .to(chevron.root.rotation, {
            y: D2R(180),
            x: D2R(0),
            duration: 1.4,
            ease: 'power3.out',
        }, 1.4)

        .fromTo(ball, {
            '--ball-size' : '0cqw',
        },
        {
            '--ball-size' : '4cqw',
            duration:         0.5,
            ease:             'power3.out',
        }, 1.6)

        // tl.then(()=>{const unlock = chevron.lockToCurrentPosition();})
        tl.duration(1.5);


    const leaveTl = gsap.timeline({
        scrollTrigger: {
            trigger: 'body',
            start:   'top top',
            end:     'center top',
            scrub:   1,
            markers: true,
        }
    })
    .fromTo(chevron.root.rotation,
        { x: D2R(180) },
        { x: D2R(260), ease: 'none', duration: 1 }
    );

    tl.then(()=>{
        window.removeEventListener('wheel',     preventScroll);
        window.removeEventListener('touchmove', preventScroll);
    });
}

export function calloutAnimation(chevron, scene) {
    const canvas = scene.renderer.domElement;

    const hoop = scene.addHoop('ring', { radiusPx: 80, tubePx: 4, z: 0 });
    hoop.setPosition(0, 0, 0);

    const DIRECTION = 'left'; // swap to 'top', 'bottom', 'right' to test other axes

    gsap.set(chevron.root.position, hoop.getEntryWorldPosition(DIRECTION, 15));
    hoop.enableCanvasClip(canvas, DIRECTION);

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

    tl.to(chevron.root.position, {
        ...hoop.getHoopWorldPosition(),
        duration: 0.8,
        ease: 'power2.in',
    });

    tl.to(chevron.root.position, {
        ...hoop.getExitWorldPosition(DIRECTION, 15),
        duration: 0.8,
        ease: 'power2.out',
        onStart: () => hoop.disableCanvasClip(),
    });

    tl.call(() => {
        gsap.set(chevron.root.position, hoop.getEntryWorldPosition(DIRECTION, 15));
        hoop.enableCanvasClip(canvas, DIRECTION);
    });

    return tl;
}
// export function calloutAnimation(chevron, scene, containerRef) {
//     const wrapper = containerRef.current.querySelector('.callout_wrapper');

//     const circle_outline = wrapper.querySelector('.circle-outline');
//     const circle_color   = wrapper.querySelector('.circle-color');
//     const copy           = wrapper.querySelector('.copy-wrapper');
//     const heading        = circle_color.querySelector('h2');

//     if (!heading) return;

//     const circle_rect = circle_outline.getBoundingClientRect();
//     const targetZ     = chevron.getZForPixelHeight(circle_rect.height * 0.50);

//     const targetPos_start = scene.getElementWorldPosition(circle_outline, {
//         anchor: 'center',
//         z: targetZ,
//     });
//     const targetPos_end = scene.getElementWorldPosition(circle_color, {
//         anchor: 'right',
//         z: targetZ,
//     });

//     // ── DOM initial state ────────────────────────────────────────────────────

//     gsap.set(circle_color, {
//         x: -(circle_rect.width),
//         '--bg': 'transparent',
//         clipPath: `inset(0px -${circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
//     });
//     gsap.set(heading, { x: -(heading.offsetWidth) });

//     // ── Hoop ─────────────────────────────────────────────────────────────────

//     // Size is derived from the DOM element — no need for the initial radiusPx guess.
//     const hoop = scene.addHoop('ring', {
//         z:          targetZ,
//         tubePx:     2,
//         stencilRef: 1,
//     });

//     // setSize fits to the element's bounding box (tighter axis → always circular)
//     hoop.setSize(circle_rect.width, circle_rect.height);
//     hoop.setPosition(targetPos_start.x, targetPos_start.y, targetPos_start.z);

//     // ── Chevron initial position ──────────────────────────────────────────────

//     // Convert the hoop's world-space radius to a usable X offset so the chevron
//     // starts one full diameter to the LEFT of the hoop center, at the same depth.
//     // _pxToWorld is internal — derive the offset from the positions we already have,
//     // or use getElementWorldPosition on the left edge of circle_outline:
//     const hoopLeftEdge = scene.getElementWorldPosition(circle_outline, {
//         anchor: 'center-left',   // left mid-point of the element
//         z: targetZ,
//     });

//     // Start: left of ring, same Z as hoop (behind it by one hoop depth feels natural)
//     // We push Z back slightly so the chevron is behind the stencil disc plane.
//     const behindZ = targetZ - 1;

//     gsap.set(chevron.root.position, {
//         x: hoopLeftEdge.x,
//         y: targetPos_start.y,
//         z: behindZ,
//     });

//     // ── Portal + clip ─────────────────────────────────────────────────────────

//     hoop.enablePortal();
//     hoop.clipChevron(chevron);

//     // ── Timeline ──────────────────────────────────────────────────────────────

//     const tl = gsap.timeline();

//     // Phase 1 — Chevron travels from left of hoop to center, still behind the plane.
//     // Only the part inside the disc is visible (portal clip active).
//     tl.to(chevron.root.position, {
//         x: targetPos_start.x,
//         z: behindZ,           // still behind — don't cross the plane yet
//         duration: 0.6,
//         ease: 'power2.in',
//     });

//     // Phase 2 — Burst through: push the chevron forward past the hoop's Z plane.
//     // Release the clip at the exact moment it crosses so it renders fully from here on.
//     tl.to(chevron.root.position, {
//         z: targetZ + 1,       // just past the ring
//         duration: 0.35,
//         ease: 'power3.out',
//         onStart: () => hoop.releaseChevron(chevron),
//     });

//     // Phase 3 — Continue to final position (right edge of circle_color).
//     tl.to(chevron.root.position, {
//         x: targetPos_end.x,
//         y: targetPos_end.y,
//         z: targetPos_end.z,
//         duration: 0.5,
//         ease: 'power2.inOut',
//     });
    

//         // gsap.set(chevron.root.position, {
//         //     x: targetPos_start.x,
//         //     y: targetPos_start.y,
//         //     z: targetPos_start.z,
//         //     duration: 1,
//         //     ease: 'none',
//         // }, 0)

//         // gsap.set(chevron.root.rotation, {
//         //     z: D2R(-90),
//         //     duration: 1,
//         //     ease: 'none',
//         // }, 0)

//         // const wrapper_tl = gsap.timeline({
//         //     scrollTrigger: {
//         //         trigger: wrapper,
//         //         start: `top-=${circle_rect.height} center`, // Starts when wrapper is near bottom
//         //         end: "bottom center",   // Ends when wrapper is near top
//         //         scrub: true,         // Smooth 1-second catch-up
//         //         pin: false,
//         //         markers:false,
//         //     }
//         // })

//         // .to(chevron.root.position, {
//         //     x: targetPos_end.x,
//         //     duration: 1,
//         //     ease: 'power1.inOut',
//         // }, 0)

//         // .to(circle_color,{ 
//         //     x: -circle_final_stop, 
//         //     '--bg': circle_bg_color, 
//         //     duration: 0.25,
//         //     ease: "power4.in"
//         // }, 0.25)

//         // .to(heading, {
//         //     x: circle_final_stop,
//         //     duration: 0.5,
//         // }, 0.5)

//         // .fromTo(copy,{
//         //     opacity: 0,
//         //     y:-20,
//         // }, {
//         //     opacity: 1,
//         //     y:0,
//         //     duration: 1,
//         // }, 1)
// }

// Helpers

const D2R = (d) => THREE.MathUtils.degToRad(d);

function ChevronDevBox({ chevron, inset = "50px 10px 0 0" }) {
    const [pos, setPos]     = useState({ x: 0, y: 0, z: 0 });
    const [rot, setRot]     = useState({ x: 0, y: 0, z: 0 });
    const [arm, setArm]     = useState(45);
    const activeRef         = useRef(null);

    const D2R = d => d * Math.PI / 180;
    const R2D = r => parseFloat((r * 180 / Math.PI).toFixed(1));

    // ── Pull from chevron each frame ────────────────────────────────────────
    useEffect(() => {
        if (!chevron) return;
        const update = () => {
            const p = chevron.root.position;
            const r = chevron.root.rotation;
            setPos({ x: parseFloat(p.x.toFixed(2)), y: parseFloat(p.y.toFixed(2)), z: parseFloat(p.z.toFixed(2)) });
            setRot({ x: R2D(r.x), y: R2D(r.y), z: R2D(r.z) });
            setArm(R2D(chevron.arm1.rotation.z));
        };
        gsap.ticker.add(update);
        return () => gsap.ticker.remove(update);
    }, [chevron]);

    // ── Push to chevron ──────────────────────────────────────────────────────
    const applyPos = (axis, v) => {
        chevron.root.position[axis] = v;
        setPos(p => ({ ...p, [axis]: v }));
    };
    const applyRot = (axis, v) => {
        chevron.root.rotation[axis] = D2R(v);
        setRot(r => ({ ...r, [axis]: v }));
    };
    const applyArm = (v) => {
        chevron.arm1.rotation.z =  D2R(v);
        chevron.arm2.rotation.z = -D2R(v);
        setArm(v);
    };

    if (!chevron) return null;

    const trackStyle = {
        display: 'grid', gridTemplateColumns: '14px 1fr 56px',
        alignItems: 'center', gap: '6px', marginBottom: '4px',
    };
    const labelStyle = (color) => ({
        fontSize: '10px', fontWeight: '700', color, textAlign: 'center',
    });
    const numStyle = {
        background: '#1a1d28', border: '1px solid #2a2d38', borderRadius: '3px',
        color: '#c8ccd8', fontFamily: 'monospace', fontSize: '14px',
        padding: '2px 4px', width: '100%', textAlign: 'right',
    };
    const sectionStyle = {
        fontSize: '9px', letterSpacing: '0.2em', color: '#4a4f63',
        margin: '8px 0 5px', paddingBottom: '4px',
        borderBottom: '1px solid #2a2d38',
    };

    const Track = ({ label, color, value, min, max, step = 0.1, onChange }) => (
        <div style={trackStyle}>
            <span style={labelStyle(color)}>{label}</span>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onMouseDown={() => activeRef.current = label}
                onMouseUp={()   => activeRef.current = null}
                onChange={e => onChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: color }}
            />
            <input
                type="number" min={min} max={max} step={step}
                value={value}
                onFocus={() => activeRef.current = label}
                onBlur={()  => activeRef.current = null}
                onChange={e => onChange(parseFloat(e.target.value))}
                style={numStyle}
            />
        </div>
    );

    return (
        <div style={{
            position: 'fixed', inset, width: '250px', height: 'fit-content',
            background: '#0d0f14', border: '1px solid #2a2d38',
            borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px',
            color: '#c8ccd8', zIndex: 9999, width: '280px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)', userSelect: 'none',
            overflow: 'hidden', pointerEvents: 'auto',
        }}>
            {/* Title */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', background:'#13161f', borderBottom:'1px solid #2a2d38' }}>
                <span style={{ fontSize:'14px', color:'#4d9fff' }}>⬡</span>
                <span style={{ flex:1, letterSpacing:'0.15em', fontSize:'10px', color:'#7a7f94' }}>CHEVRON DEV</span>
            </div>

            <div style={{ padding: '8px 12px' }}>

                {/* Position */}
                <div style={sectionStyle}>POSITION</div>
                <Track label="X" color="#ff4d6d" value={pos.x} min={-50} max={50}  onChange={v => applyPos('x', v)} />
                <Track label="Y" color="#39ff80" value={pos.y} min={-50} max={50}  onChange={v => applyPos('y', v)} />
                <Track label="Z" color="#4d9fff" value={pos.z} min={-100} max={30} onChange={v => applyPos('z', v)} />

                {/* Rotation */}
                <div style={sectionStyle}>ROTATION °</div>
                <Track label="X" color="#ff4d6d" value={rot.x} min={-180} max={180} step={1} onChange={v => applyRot('x', v)} />
                <Track label="Y" color="#39ff80" value={rot.y} min={-180} max={180} step={1} onChange={v => applyRot('y', v)} />
                <Track label="Z" color="#4d9fff" value={rot.z} min={-180} max={180} step={1} onChange={v => applyRot('z', v)} />

                {/* Arm */}
                <div style={sectionStyle}>ARM ANGLE °</div>
                <Track label="A" color="#f5c542" value={arm} min={0} max={90} step={0.5} onChange={applyArm} />

            </div>
        </div>
    );
}