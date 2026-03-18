import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ChevronScene } from '@/components/ChevronScene.js';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const sceneWidth = 500;
const sceneHeight = 500;


export default () => {
    const refEl      = useRef(null);
    const [chevron, setChevron] = useState(null);

    useEffect(() => {
        const sceneInstance = new ChevronScene(refEl.current);
        const c = sceneInstance.addChevron();
        setChevron(c);

        fireHeroAnimation(c, sceneInstance);
        leaveHeroAnimation(c, sceneInstance);

        return () => sceneInstance.destroy();
    }, []);

    return (
        <>
            <div ref={refEl} className='scene-wrapper' style={{ zIndex: '0', position: 'fixed', inset: '0 0 0 0' }} />
            <ChevronDevBox chevron={chevron} />
        </>
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

function leaveHeroAnimation(chevron, scene){
    const scrollTl = gsap.timeline({
        scrollTrigger: {
            trigger:    'body',
            start:      'top top',
            end:        'top+=100 top',
            markers:   true,
            scrub:      1,         // ties animation progress directly to scroll position
            ease: 'power1.inOut'
        }
    });

    scrollTl
        .to(chevron.root.rotation, {
            // x:  D2R(180),
            // y : D2R(180),
            z:        D2R(0),  // +90 from wherever hero animation left it (180°)
            ease: 'power1.inOut',
            duration:1
        }, 0)
        .to(chevron.root.position, {
            x: 0,
            y: 0,
            z:        chevron.root.position.z - 50,
            ease: 'power1.inOut',
            duration:1
        }, 0)
        .to(chevron.root.rotation, {
            y:     D2R(90),
            ease: 'power1.inOut',
            duration:1
        }, 0.5);

        // Project world origin to screen — should give (0.5, 0.5) i.e. exact center
        const v = new THREE.Vector3(0, 0, 0);
        v.project(window.sceneCamera);
        console.log('v values',v.x, v.y); // should be 0, 0 (NDC center)
    
}


const D2R = (d) => THREE.MathUtils.degToRad(d);


function ChevronDevBox({ chevron }) {
    const [state, setState] = useState(null);

    useEffect(() => {
        if (!chevron) return;

        const update = () => {
            const p = chevron.root.position;
            const r = chevron.root.rotation;
            setState({
                px: p.x.toFixed(2), py: p.y.toFixed(2), pz: p.z.toFixed(2),
                rx: THREE.MathUtils.radToDeg(r.x).toFixed(1),
                ry: THREE.MathUtils.radToDeg(r.y).toFixed(1),
                rz: THREE.MathUtils.radToDeg(r.z).toFixed(1),
                a1: THREE.MathUtils.radToDeg(chevron.arm1.rotation.z).toFixed(1),
            });
        };

        gsap.ticker.add(update);
        return () => gsap.ticker.remove(update);
    }, [chevron]);

    if (!state) return null;

    return (
        <div style={{
            position:   'fixed',
            bottom:     '50px',
            left:       '16px',
            background: 'rgba(0,0,0,0.85)',
            color:      '#00ff88',
            fontFamily: 'monospace',
            fontSize:   '12px',
            padding:    '10px 14px',
            borderRadius: '6px',
            zIndex:     9999,
            lineHeight: '1.8',
            pointerEvents: 'none',
        }}>
            <div style={{ color: '#888', marginBottom: '4px', letterSpacing: '0.1em' }}>CHEVRON</div>
            <div><span style={{color:'#ff4d6d'}}>X</span> {state.px}  <span style={{color:'#39ff80'}}>Y</span> {state.py}  <span style={{color:'#4d9fff'}}>Z</span> {state.pz}</div>
            <div style={{ color: '#888', fontSize: '10px' }}>position</div>
            <div><span style={{color:'#ff4d6d'}}>X</span> {state.rx}°  <span style={{color:'#39ff80'}}>Y</span> {state.ry}°  <span style={{color:'#4d9fff'}}>Z</span> {state.rz}°</div>
            <div style={{ color: '#888', fontSize: '10px' }}>rotation</div>
            <div><span style={{color:'#f5c542'}}>ARM</span> {state.a1}°</div>
            <div style={{ color: '#888', fontSize: '10px' }}>arm angle</div>
        </div>
    );
}