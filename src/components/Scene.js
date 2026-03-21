import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ChevronScene } from '@/components/ChevronScene.js';
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { ChevronContext } from '@/context/ChevronContext';

export default ({ children }) => {
    const refEl = useRef(null);
    const [chevronCtx, setChevronCtx] = useState(null);

    useEffect(() => {
        const sceneInstance = new ChevronScene(refEl.current);
        const c = sceneInstance.addChevron();

        setChevronCtx({ chevron: c, scene: sceneInstance });

        const preventScroll = (e) => e.preventDefault();
        window.addEventListener('wheel',     preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });

        const heroTl = fireHeroAnimation(c, sceneInstance);

        heroTl.then(() => {
            leaveHeroAnimation(c, sceneInstance, heroTl);
            window.removeEventListener('wheel',     preventScroll);
            window.removeEventListener('touchmove', preventScroll);
        });

        return () => {
            sceneInstance.destroy();
            ScrollTrigger.getAll().forEach(t => t.kill());
            window.removeEventListener('wheel',     preventScroll);
            window.removeEventListener('touchmove', preventScroll);
        };
    }, []);

    return (
        <ChevronContext.Provider value={chevronCtx}>
            <div ref={refEl} className='scene-wrapper' style={{ zIndex: '0', position: 'fixed', inset: '0 0 0 0' }} />
            <ChevronDevBox chevron={chevronCtx?.chevron} />
            {children}
        </ChevronContext.Provider>
    );
}

function fireHeroAnimation(chevron, scene) {
    const container = document.querySelector('.Hero');
    const text      = container.querySelector('.text');
    const ball      = container.querySelector('.ball');
    const rect      = text.getBoundingClientRect();

    // ── Pre-calculate all positions before timeline builds ──────────────────
    const magicNum1 = 0.75;
    const magicNum2 = 2;
    const magicNum3 = 10;

    const targetZ = chevron.getZForPixelHeight(rect.height * magicNum1);

    // World units → pixels at targetZ depth

    // Where the chevron lands — left of the text, vertically centered
    const chevronWidth = rect.height * magicNum1 * 0.4; // approximate world-unit width at targetZ
    const destPos = scene.getElementWorldPosition(text, {
        anchor:  'center',
        z:       targetZ,
        offsetX: -(rect.width / 2) - (chevronWidth / 2) - 10, // 10px gap
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
    console.log('offsetPct',offsetPct);

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
            y: D2R(180),
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
            x: D2R(180),
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

    return tl;
}

function leaveHeroAnimation(chevron, scene, heroTl) {
    const leaveTl = buildLeaveTimeline(chevron, scene);

    // Pause it — ScrollTrigger scrub will drive it
    leaveTl.duration(0.5).pause();

    ScrollTrigger.create({
        trigger:   'body',
        start:     'top top',
        end:       'top+=100 top',
        scrub:     false,
        // snap: true,
        markers:true,
        onEnter: () => leaveTl.play(),      // Plays when scrolling down past start
        onLeaveBack: () => leaveTl.reverse(),
    });
}

function buildLeaveTimeline(chevron, scene) {
    const targetPos = scene.getElementWorldPosition('.arrow-down', {
        anchor: 'center',
        z:      -100,
    });

    return gsap.timeline()
        .to(chevron.root.rotation, {
            x:  D2R(140),
            y:  D2R(140),
            ease: 'power1.out', //how to make this yoyo? start and stop at original values
            duration: 0.5,
        },0 )
        .to(chevron.root.position, {
            x:        targetPos.x,
            duration: 1,
            ease:     'expo.In(5)',
        }, 0.25 )
        .to(chevron.root.position, {
            y:        targetPos.y,
            z:        targetPos.z,
            duration: 1,
            ease:     'none',
        }, 0.25 )
        .to(chevron.root.rotation, {
            x:  D2R(180),
            y:  D2R(0),
            z:        D2R(0),
            duration: 1,
            ease:     'power1.out',
        }, 0.5);
}


const D2R = (d) => THREE.MathUtils.degToRad(d);


function ChevronDevBox({ chevron }) {
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
        color: '#c8ccd8', fontFamily: 'monospace', fontSize: '10px',
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
            position: 'fixed', bottom: '50px', left: '16px',
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