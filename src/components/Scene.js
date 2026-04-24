import { ColumnWorld } from '@/3dcomponents/ColumnWorld';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { RenderScene } from '@/3dcomponents/RenderScene.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createPortal } from 'react-dom';
import { Fog }    from '@/3dcomponents/Fog.js';
import { Mirror, createRainbowMirror} from '@/3dcomponents/Mirror.js';

gsap.registerPlugin(ScrollTrigger);

const Scene = ({ debug, onReady, chevronOpts = {}, width = '100vw', height = '100vh', inset = "0px", position="absolute", name = ""}) => {
    const canvasRef   = useRef(null);
    // const [chevron, setChevron] = useState(null);

    useEffect(() => {
        const sceneInstance = new RenderScene(canvasRef.current);

        // const c = sceneInstance.addChevron(chevronOpts);
        // setChevron(c);

        // onReady?.({ chevron: c, scene: sceneInstance });
        onReady?.({ scene: sceneInstance });

        return () => {
            sceneInstance.destroy();
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <>
            <div
                ref={canvasRef}
                name={name}
                className='scene-wrapper'
                style={{ zIndex: 0, position: position, pointerEvents: 'none', 
                    width, height, inset,
                }}
                >
            </div>
        </>
    );
}

export default Scene;

function createHoneycombSphere(radius, detail = 3) {
    const ico = new THREE.IcosahedronGeometry(radius, detail);
    const pos = ico.attributes.position;
    const faceCount = pos.count / 3;

    // 1. Compute face centroids
    const centroids = [];
    for (let i = 0; i < faceCount; i++) {
        const a = i * 3;
        const b = i * 3 + 1;
        const c = i * 3 + 2;

        const cx = (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3;
        const cy = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;
        const cz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3;

        const len = Math.sqrt(cx * cx + cy * cy + cz * cz);
        centroids.push(new THREE.Vector3(
            (cx / len) * radius,
            (cy / len) * radius,
            (cz / len) * radius,
        ));
    }

    // 2. Build edge → adjacent-faces map
    const edgeMap = new Map();
    for (let i = 0; i < faceCount; i++) {
        const verts = [i * 3, i * 3 + 1, i * 3 + 2];
        for (let j = 0; j < 3; j++) {
            const va = verts[j];
            const vb = verts[(j + 1) % 3];
            // Round to avoid floating-point key mismatches
            const keyA = `${pos.getX(va).toFixed(5)},${pos.getY(va).toFixed(5)},${pos.getZ(va).toFixed(5)}`;
            const keyB = `${pos.getX(vb).toFixed(5)},${pos.getY(vb).toFixed(5)},${pos.getZ(vb).toFixed(5)}`;
            const key = keyA < keyB ? keyA + '|' + keyB : keyB + '|' + keyA;
            if (!edgeMap.has(key)) edgeMap.set(key, []);
            edgeMap.get(key).push(i);
        }
    }

    // 3. Dual edges: connect centroids of each pair of adjacent faces
    const points = [];
    for (const [, faces] of edgeMap) {
        if (faces.length === 2) {
            points.push(centroids[faces[0]], centroids[faces[1]]);
        }
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    ico.dispose();
    return geo;
}


export function fireHologramAnimation(renderScene) {

    const waitForTransition = (document.body.classList.contains("loading")) ? 1 : 0;

    const scene = renderScene.scene;
    const container = renderScene._mountEl;
    const wrapper = renderScene._mountEl.parentNode;
    const wrapperHeight = wrapper.offsetHeight;
    const wrapperWidth = wrapper.offsetWidth;

    const ballSize = 1;
    const targetZ = renderScene.getZForWorldWidth(ballSize, wrapperHeight * 0.25);
    const targetHOOPZ = renderScene.getZForWorldWidth(ballSize, wrapperHeight * 0.20);

    // ── Hoop at bottom of scene ───────────────────────────────
    const hoop = renderScene.addHoop('portal-hoop', { radiusPx: 1, z: targetZ });
    hoop.setRotation(90, 0, 0); // lumen points up Y
    const bottomPos = renderScene.getElementWorldPosition(wrapper, { anchor: 'bottom', z: targetHOOPZ});
    hoop.setPosition(bottomPos.x, bottomPos.y, targetHOOPZ);
    hoop.enablePortal();

    const hoopTargetRadius = (wrapperWidth * 0.33) / 2;

    // ── Ball (stencil-clipped to portal) ──────────────────────
    const ballMat = new THREE.MeshBasicMaterial({
        color: 0x00aeef,
        transparent: true,
        opacity: 1,
        stencilWrite: true,
        stencilFunc: THREE.EqualStencilFunc,
        stencilRef: hoop._stencilRef,
        stencilFail: THREE.KeepStencilOp,
        stencilZFail: THREE.KeepStencilOp,
        stencilZPass: THREE.KeepStencilOp,
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(ballSize / 2, 20, 20), ballMat);
    ball.position.set(bottomPos.x, bottomPos.y - 5, targetZ);
    ball.scale.set(0,0,0);
    scene.add(ball);

    // ── Honeycomb wireframe shell ─────────────────────────────
    const honeycombGeo = createHoneycombSphere(ballSize / 2 * 1.01, 3);
    const honeycombMat = new THREE.LineBasicMaterial({
        color: 0x00aeef,
        transparent: true,
        opacity: 0,
        depthWrite: false,
    });
    const honeycomb = new THREE.LineSegments(honeycombGeo, honeycombMat);
    const hc_target = renderScene.getZForWorldWidth(ballSize, wrapperWidth * 0.5);
    honeycomb.position.set(0, 0, targetZ);
    scene.add(honeycomb);

    gsap.to(honeycomb.rotation, {
        y: Math.PI * 2,
        duration: 16,
        ease: 'none',
        repeat: -1,
    });

    // ── Timeline ──────────────────────────────────────────────
    const tl_holo = gsap.timeline();
    const hoopProxy = { radius: 1 };

    // Phase 1: Hoop expands open at bottom
    tl_holo.to(hoopProxy, {
        radius: hoopTargetRadius,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => hoop.setRadiusPx(hoopProxy.radius),
    }, 0);

    tl_holo.to(ball.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1,
        ease: 'power1.out',
    }, 0.4);

    tl_holo.to(ball.position, {
        x: 0,
        y: 0,
        z: targetZ,
        duration: 1,
        ease: 'back.out(1)',
        onUpdate: function () {
            // Kill stencil once ball rises past hoop center
            if (ball.position.y >= bottomPos.y) {
                ballMat.stencilWrite = false;
                ballMat.stencilFunc = THREE.AlwaysStencilFunc;
                ballMat.needsUpdate = true;
            }
        },
    }, 0.4);

    // Phase 3: Solid ball fades out, honeycomb fades in
    tl_holo.to(ballMat, {
        opacity: 0,
        duration: 0.1,
        ease: 'none',
    }, 1.6);

    tl_holo.to(honeycombMat, {
        opacity: 1,
        duration: 0,
        ease: 'none',
        onComplete: () => {
            honeycombMat.depthWrite = true;
        },
    }, 1.6);

    tl_holo.to(honeycomb.position, {
        z: hc_target,
        ease: 'back.out(1.8)',
        duration: 1,
    }, 1.6);

    // Phase 4: Shrink hoop and hide as honeycomb expands
    tl_holo.to(hoopProxy, {
        radius: 1,
        duration: 0.8,
        ease: 'power2.in',
        onUpdate: () => hoop.setRadiusPx(hoopProxy.radius),
        onComplete: () => {
            hoop.root.visible = false;
            // hoop.disablePortal();
        },
    }, 1.6);

    tl_holo.duration(2).delay(waitForTransition);
    return tl_holo;
}

// export function fireHologramAnimation(renderScene) {

//     const scene  = renderScene.scene;
//     const container = renderScene._mountEl;
//     const wrapper = renderScene._mountEl.parentNode;
//     const wrapperHeight = wrapper.offsetHeight;
//     console.log('container', container);

//     const chevron = renderScene.addChevron('chevron');
//     chevron.root.rotation.set(0, 0, D2R(-90));

//     const targetZ = chevron.getZForPixelHeight(wrapperHeight * 0.5);
//     const startPos = renderScene.getElementWorldPosition(wrapper, { anchor: "left", z: targetZ });
//     const endPos = renderScene.getElementWorldPosition(wrapper, { anchor: "right", z: targetZ });
//     chevron.root.position.set(startPos.x, startPos.y, targetZ);

//     const chevronPixelHeight = wrapperHeight * 0.5;
//     const chevronWorldHeight = 15 + 2 * 2;
//     const pxPerUnit = chevronPixelHeight / chevronWorldHeight;

//     const ballSize = (wrapperHeight * 0.5) / 3.978 / pxPerUnit;
//     const ballFinalSize = ballSize * 2.5;
//     const scaleRatio = ballFinalSize / ballSize;

//     // Solid core sphere — fades out as honeycomb appears
//     const ballMat = new THREE.MeshBasicMaterial({ color: 0x00aeef, transparent: true, opacity: 1 });
//     const ball = new THREE.Mesh(new THREE.SphereGeometry(ballSize / 2, 20, 20), ballMat);
//     ball.position.set(0, 0, targetZ);
//     scene.add(ball);

//     // Honeycomb wireframe shell (dual of subdivided icosahedron)
//     const honeycombGeo = createHoneycombSphere(ballSize / 2 * 1.01, 3);
//     const honeycombMat = new THREE.LineBasicMaterial({
//         color: 0x00aeef,
//         transparent: true,
//         opacity: 0,
//     });
//     const honeycomb = new THREE.LineSegments(honeycombGeo, honeycombMat);
//     const hc_target = renderScene.getZForWorldWidth(ballSize, wrapper.offsetWidth * 0.5);
//     honeycomb.position.set(0, 0, targetZ);
//     scene.add(honeycomb);

//     gsap.to(honeycomb.rotation, {
//         y: Math.PI * 2,
//         duration: 16,
//         ease: 'none',
//         repeat: -1,
//     }, 1.0)

//     const tl_holo = gsap.timeline();

    
//     chevron.material1.transparent = true;
//     chevron.material2.transparent = true;
//     // Chevron flies across
//     tl_holo.to(chevron.root.position, {
//         x: endPos.x,
//         duration: 1,
//         ease: 'none',
//     }, 0)

//     .to(chevron.root.position, {
//         x: endPos.x * 2,
//         duration: 0.25,
//         ease: 'none',
//         onComplete: ()=>{
//             chevron.root.visible = false;
//         }
//     }, 1)

//     // Ball pops in as chevron passes center
//     .to(ballMat, {
//         opacity: 0,
//         duration: 0.1,
//         ease: 'none',
//     }, 0.5)

//     .to(honeycombMat, {
//         opacity: 1,
//         duration: 0.1,
//         ease: 'none',
//     }, 0.5)

//     .to(honeycomb.position, {
//         z: hc_target,
//         ease:'back.out(1.8)',
//         duration: 1
//     }, 0.5)


//     return tl_holo;
// }
 
export function fireColumnAnimation(scene) {
    const camera  = scene.camera;
    const mountEl = scene._mountEl;
    // const maxContent = document.querySelector(".max-content");
    const targetPosition = scene.getElementWorldPosition('.hero-wrapper > .max-content', { anchor: "center", z: 0});


    mountEl.parentNode.style.zIndex = -1;
    scene.scene.children[1].intensity  = 2.0;
    scene.scene.children[2].intensity  = 1.0;
    // scene._ambientLight.intensity  = 0;

    const rad_min = (window.innerWidth > 768) ? 35 : 10;
    const rad_max = (window.innerWidth > 768) ? 37 : 12;
    const orb_size = (window.innerWidth > 768) ? 1 : 0.25
    const comet_center = (window.innerWidth > 768) ? { x: 0, y: 0, z: -(camera.position.z/2) } : targetPosition 

    const comet1 = scene.addOrb('comet1', {
        center: comet_center,
        radius: Math.random() * (rad_max - rad_min) + rad_min,
        radiusY: Math.random() * (rad_max - rad_min) + rad_min,             
        frequency: 0.15,
        clockwise: true,
        tilt: { x: 0, y: 0 },   // tilted orbit plane
        color: '#00ff00',
        size: orb_size,
        intensity: 1000,
        // trailLength: 5,
        // trailDuration: 0.2,
    });


    const comet2 = scene.addOrb('comet2', {
        center: comet_center,
        radius: Math.random() * (rad_max - rad_min) + rad_min,
        radiusY: Math.random() * (rad_max - rad_min) + rad_min,    
        frequency: 0.1,
        clockwise: true,
        tilt: { x: 45, y: 0},   // tilted orbit plane
        color: 'red',
        size: orb_size,
        intensity: 1000,
        // trailLength: 20,
        // trailDuration: 0.02,
    });

    const comet3 = scene.addOrb('comet3', {
        center: comet_center,
        radius: Math.random() * (rad_max - rad_min) + rad_min,
        radiusY: Math.random() * (rad_max - rad_min) + rad_min,    
        frequency: 0.15,
        clockwise: false,
        tilt: { x: -45, y: -45 },   // tilted orbit plane
        color: 'blue',
        size: orb_size,
        intensity: 1000,
        // trailLength: 0,
        // trailDuration: 0,
    });

    const comets = [comet1,comet2,comet3];

    const fog = new Fog(scene, {
        type: 'exponential',
        color: '#fffff',
        density: 0.00,
        near : -50,
        far : 50,
        syncBackground: false,  // keep your transparent alpha background
    });

    let leaveTl;
    let cubes = [];
    // if (window.innerWidth > 768) {
        const cube_z = scene.getZForOrbitPercent(35, 0.5);

        const cube_zlayer_offset = 10;
        const cube_layers = 5;
        const cube_size_dist = {start: 3, end: 5};

        const start_z = cube_z*2 - (cube_zlayer_offset * (cube_layers - 1)) / 2;
        for (let i = 1; i <= cube_layers; i++){
            const z_position = start_z + (i * cube_zlayer_offset);

            const p_mag = 20;
            const pivotOffset = (i % 2) ? p_mag : 0 ;
            console.log('pivotOffset',pivotOffset, (i % 2));

            cubes.push(
                scene.addCube('cube1_'+i, {
                size: Math.random() * (cube_size_dist.end - cube_size_dist.start) + cube_size_dist.start,
                color: '#ffffff',
                opacity: 0.6,
                position: { x: -p_mag, y: -pivotOffset, z: z_position },
                // endPosition: { x: 20, y: 20, z: 10 },
                // duration: 20,
                // ease: 'power1.inOut',
                tumble: true,                         
                tumbleSpeed: { x:2, y:4, z: 5 },  
                })
            )
            
            cubes.push(
                scene.addCube('cube2_'+i, {
                size: Math.random() * (cube_size_dist.end - cube_size_dist.start) + cube_size_dist.start,
                color: '#ffffff',
                opacity: 0.6,
                position: { x: p_mag, y: pivotOffset, z: z_position },
                // endPosition: { x: 20, y: -15, z: 10 },
                // duration: 20,
                // ease: 'power1.inOut',
                tumble: true,                         
                tumbleSpeed: { x:2, y:4, z: -5 },  
                })
            )

            cubes.push( 
                scene.addCube('cube3_'+i, {
                size: Math.random() * (cube_size_dist.end - cube_size_dist.start) + cube_size_dist.start,
                color: '#ffffff',
                opacity: 0.6,
                position: { x: pivotOffset, y: -p_mag, z: z_position },
                // endPosition: { x: 20, y: -15, z: 10 },
                // duration: 20,
                // ease: 'power1.inOut',
                tumble: true,                         
                tumbleSpeed: { x:-2, y:4, z: 5 },  
                })
            )

            cubes.push( 
                scene.addCube('cube4_'+i, {
                size: 2,
                color: '#ffffff',
                opacity: 0.6,
                position: { x: -pivotOffset, y: p_mag, z: z_position },
                // endPosition: { x: 20, y: -15, z: 10 },
                // duration: 20,
                // ease: 'power1.inOut',
                tumble: true,                         
                tumbleSpeed: { x:2, y: -4, z: 5 },  
                })
            )

        }

        cubes.forEach((cube) => {
            const pos = cube.root.position;
            const jitter_xy = 5;
            const jitter_z = 2;
            pos.x += (Math.random() - 0.5) * jitter_xy * 2;
            pos.y += (Math.random() - 0.5) * jitter_xy * 2;
            pos.z += (Math.random() - 0.5) * jitter_z;
        });

        const radius = 15
        const strength = 100
        cubes.forEach((cube) => {
            const pos = cube.root.position;
            const dist = Math.sqrt(pos.x ** 2 + pos.y ** 2);
            if (dist > radius) return;

            const baseAngle = Math.atan2(pos.y, pos.x) || (Math.random() * Math.PI * 2);
            const angle = baseAngle + (Math.random() - 0.5) * 1.2;

            const push = strength * (1 - dist / radius);
            cube.setVelocity({
                x: Math.cos(angle) * push,
                y: Math.sin(angle) * push,
                z: 0,
            });
        });



    const hero_wrapper_height = document.querySelector('.hero-wrapper')?.offsetHeight ?? '50vh';
    leaveTl = gsap.timeline({
        scrollTrigger: {
            trigger: 'html',
            start: 'top 0%',
            end: `top+=${hero_wrapper_height}px 50%`,
            scrub: 1,
            // markers:1,
        },
        onLeave: ()=>{
            comets.forEach(comet =>{
                comet.root.visible = false;
            })
        },
        onEnterBack: ()=>{
            comets.forEach(comet =>{
                comet.root.visible = true;
            })
        }
    });
    
    // const maxContentEl = document.querySelector('.callouts_container > .max-content');
    // const targetPixelWidth = maxContentEl.offsetWidth;

    leaveTl
        .to(camera.position, { 
            z: -(camera.position.z), 
            duration: 1,
            ease: 'none',

        }, 0)
        .to(camera.rotation, {
            z: D2R(90),
            duration: 1,
            ease: 'none',
        }, 0)

        leaveTl.to([comet2._pivot.rotation,comet3._pivot.rotation],{
            x: D2R(0),
            duration: 1,
        },0)

    // } else {
    //     const cube_mobile = scene.addCube('cubespecial', {
    //         size: 5,
    //         color: '#ffffff',
    //         opacity: 0.6,
    //         position: targetPosition,
    //         tumble: true,                         
    //         tumbleSpeed: { x:5, y:10, z: 5 },  
    //     });

    //     const hero_wrapper = document.querySelector('.hero-wrapper');
    //     leaveTl = gsap.timeline({
    //         scrollTrigger: {
    //             trigger: 'html',
    //             start: 'top 0%',
    //             end: `top+=${hero_wrapper.offsetHeight}px 25%`,
    //             scrub: 1,
    //             markers:1,
    //         },
    //     });
    //     leaveTl
    //         .to(camera.position, { 
    //             y: 10,
    //             z: 10, 
    //             duration: 1,
    //             ease: 'none',

    //         }, 0)
    //         .to(camera.position, {
    //             z: -50,
    //             duration: 1,
    //             ease: 'none',
    //         }, 0)
    // }



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
// export function fireHeroAnimation(chevron, scene, heroWrapRef) {
export function fireHeroAnimation(scene, heroWrapRef) {
    console.log("fireHeroAnimation",heroWrapRef.current);
    if (!heroWrapRef.current) return false;

    const camera = scene.camera;
    
    const chevron = scene.addChevron("logo");


    // ── DOM references ──────────────────────────────────────────────────────
    const container = heroWrapRef.current.querySelector('.logo');
    const text      = container.querySelector('.text');
    // const ball      = container.querySelector('.ball');
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

    //  scene.scene.fog = new THREE.Fog( '#2d388a', targetZ-10, 100);

    // At targetZ, the chevron's world height maps to this many pixels
    const chevronPixelHeight = rect.height * magicNum1;
    console.log("chevronPixelHeight",chevronPixelHeight)
    const chevronWorldHeight = 15 + 2 * 2; // c_height + c_radius * 2 (defaults from Chevron)
    const pxPerUnit = chevronPixelHeight / chevronWorldHeight;

    // Ball should appear 3.978x smaller
    const ballTargetPixelHeight = chevronPixelHeight / 3.978;

    const ballSize = (rect.height * magicNum1) / 3.978 / (chevronPixelHeight / (15 + 2 * 2));
    const ballMat = new THREE.MeshBasicMaterial({ color: 0x00aeef, wireframe: true });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(ballSize / 2, 6, 6), ballMat);
    ball.position.set(destPos.x + ballSize + 1, destPos.y + magicNum2, targetZ);
    scene.scene.add(ball);

    // const solidMat = new THREE.MeshBasicMaterial({ color: 0x00aeef, transparent: true, opacity: 0 });
    // const solidBall = new THREE.Mesh(new THREE.SphereGeometry(ballSize / 2, 32, 32), ballMat);
    // ball.add(solidBall);

    // ── Set stage ───────────────────────────────────────────────────────────
    chevron.setRotation(0, 0, 90);
    chevron.setPosition(startPos.x, startPos.y, startPos.z);

    const currentOffset = parseFloat(
        getComputedStyle(container).getPropertyValue('--flip-offset') || '0'
    );
    const targetOffset = currentOffset + rect.height/2 * magicNum1;

    // ── Hero entry timeline ─────────────────────────────────────────────────
    const tl = gsap.timeline();

    tl  // Chevron opens its arms
        .add(
            chevron.open(), { duration: 0.7 }
        , 0)

        .to(ball.rotation, {
            y: Math.PI/8 ,
            ease: 'none',
            duration: 1.4,
        },0 )

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
            onComplete: () =>{
                text.style.clipPath = `inset(0 0 0 0%)`;
            }
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
        // .fromTo(ball,
        //     { left: 'calc(0px - var(--ball-size))' },
        //     {
        //         left: `calc(${container.offsetWidth / 2 - targetOffset}px - var(--ball-size))`,
        //         duration: 0.5,
        //         ease:     'power3.out',
        //     },
        // 1.4)

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

        .add(()=> {
            ballMat.wireframe = false
            ball.geometry.dispose();
            ball.geometry = new THREE.SphereGeometry(ballSize / 2, 32, 32);
        }, 1.45);

        // .to(solidMat, {
        //     opacity: 1,
        //     duration: 0.5,
        //     ease: 'power2.inOut',
        //     onComplete: () => {
        //         ballMat.wireframe = false;
        //         ball.remove(solidBall);
        //         solidMat.dispose();
        //     }
        // }, 1.6);

        // Ball grows
        // .fromTo(ball,
        //     { '--ball-size': '0cqw' },
        //     { '--ball-size': '4cqw', duration: 0.5, ease: 'power3.out' },
        // 1.6);

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
    // tl.then(() => {
    //     window.removeEventListener('wheel',     preventScroll);
    //     window.removeEventListener('touchmove', preventScroll);
    // });

    return tl;
}

// export function calloutAnimation(chevron, scene, containerRef) {
export function calloutAnimation(scene, containerRef) {
    if (!containerRef.current) return;

    const chevron = scene.addChevron();

    const callouts = containerRef.current.querySelectorAll('.callout_wrapper');
    const isMobile = window.innerWidth < 768;

    const callout_tl = gsap.timeline({
        scrollTrigger: {
            trigger: containerRef.current,
            start:   "top 75%",
            end:     "bottom 33%",
            scrub:   2,
            // markers: true,
        }
    });

    // Desktop-only: tighten the circle-color pills to the text width
    if (!isMobile) {
        const tightenCircleColors = () => {
            callouts.forEach(wrapper => {
                const h2 = wrapper.querySelector('.circle-color h2');
                const circleColor = wrapper.querySelector('.circle-color');
                if (!h2 || !circleColor) return;

                circleColor.style.width = '';

                requestAnimationFrame(() => {
                    const range = document.createRange();
                    range.selectNodeContents(h2);
                    const textRect = range.getBoundingClientRect();
                    const padding = parseFloat(getComputedStyle(circleColor).paddingLeft)
                                + parseFloat(getComputedStyle(circleColor).paddingRight);
                    circleColor.style.width = `${Math.ceil(textRect.width + padding + textRect.height)}px`;
                });
            });
        };
        tightenCircleColors();
        window.addEventListener('resize', tightenCircleColors);
    } else {
        scene.destroy();
    }

    // ── Shared helpers ─────────────────────────────────────────────────────────

    const getCalloutEls = (wrapper) => {
        const index = wrapper.className.match(/callout_wrapper--(\d+)/)?.[1];
        return {
            circle_outline: wrapper.querySelector('.circle-outline'),
            circle_color:   wrapper.querySelector('.circle-color'),
            copy:           wrapper.querySelector('.copy-wrapper'),
            heading:        wrapper.querySelector('.circle-color h2'),
            color:          wrapper.dataset.color,
            hoop_color:     getComputedStyle(document.body).getPropertyValue(`--callout-${index}-color`).trim(),
        };
    };

    const getCalloutPositions = (circle_outline, circle_color, targetZ, circle_rect) => ({
        startPos:        scene.getElementWorldPosition(circle_outline, { anchor: 'left',   z: targetZ }),
        centerPos:       scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: targetZ }),
        endPos:          scene.getElementWorldPosition(circle_outline, { anchor: 'right',  z: targetZ }),
        textTargetRight: scene.getElementWorldPosition(circle_color,   { anchor: 'right',  z: targetZ, offsetX: -circle_rect.width / 2 }),
        textTargetLeft:  scene.getElementWorldPosition(circle_color,   { anchor: 'left',   z: targetZ, offsetX: circle_rect.width / 2 }),
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // DESKTOP ANIMATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    const animateCallout0_desktop = (wrapper) => {
        const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
        if (!heading) return;

        const circle_rect = circle_outline.getBoundingClientRect();
        const targetZ     = chevron.getZForPixelHeight(circle_rect.height * 0.75);
        const hoop        = scene.addHoop('ring_0', { radiusPx: 80, tubePx: 2, z: targetZ, color: hoop_color });

        const { startPos, centerPos, endPos, textTargetRight } = getCalloutPositions(circle_outline, circle_color, targetZ, circle_rect);
        const offCenterPos = scene.getElementWorldPosition(circle_outline, { anchor: 'start', z: targetZ, offsetX: -circle_rect.width });

        gsap.set(circle_color, {
            x:        -circle_rect.width,
            // '--bg':   'transparent',
            opacity: 0,
            clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
        });
        gsap.set(heading, { x: -heading.offsetWidth });

        hoop.setPosition(centerPos.x, centerPos.y, centerPos.z);
        hoop.setSize(circle_rect.width, circle_rect.height);
        chevron.setAngle(27.5);

        hoop.enablePortal();
        hoop.clipChevron(chevron);
        // hoop.root.visible = false;

        chevron.setPosition(startPos.x, startPos.y, startPos.z);
        chevron.setRotation(0, 0, -90);

        const blindCount = 8;
        const blindRect = circle_color.getBoundingClientRect();
        const blindWidth = (blindRect.width) / blindCount * 1.5;

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
            .add(chevron.setAngle(45, { duration: 1, ease: "expo.in" }), 0)
            .fromTo(chevron.root.position,
                { x: offCenterPos.x, y: offCenterPos.y, z: offCenterPos.z },
                { x: endPos.x,       y: endPos.y,       z: endPos.z,       duration: 1, ease: 'power2.in' },
                0
            )
            .to({}, {
                duration: 0.001,
                onStart:           () => hoop.releaseChevron(chevron),
                onReverseComplete: () => hoop.clipChevron(chevron),
            }, 0.95)
            .to(chevron.root.position, { x: textTargetRight.x, duration: 2, ease: 'none' }, 1)
            // .to(circle_color, { '--bg': hoop_color, duration: 0.5, ease: 'power1.inOut' }, 1)
            .to(circle_color,{ opacity: 1, duration: 0.5, ease: 'power1.inOut' }, 1)
            .to(circle_color, {
                clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
                x: -circle_rect.width / 2,
                duration: 1,
                ease: 'none'
            }, 1)
            .to(heading, { x: 0 + circle_rect.width / 3 }, 2)
            .fromTo(circle_outline.querySelector("svg"), { x:'100%'},{ x:'0%', duration: 0.5}, 2)

        blindEls.forEach(({ el }, i) => {
            callout_tl.fromTo(el,
                { rotateZ: 45, scaleX: 0 },
                { rotateZ: 0, scaleX: 2, duration: 1.2, ease: 'power4.inOut' },
                2 + i * 0.1
            );
        });

        callout_tl.fromTo(copy,
            { y: -50, opacity: 0 },
            { y: 0,   opacity: 1 },
            3
        )
        .to(chevron.root.rotation, { z: D2R(-180), x: D2R(-31), ease: 'none', duration: 0.30 }, 2.85)
        .to(chevron.root.position, { z: chevron.root.position.z - 10, ease: 'none', duration: 0.15 }, 2.85);
    };

    const animateCallout1_desktop = (wrapper) => {
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
            // '--bg':   'transparent',
            opacity: 0,
            clipPath: `inset(0px 0px 0% ${circle_rect.width}px round ${circle_rect.height}px)`,
        });
        gsap.set(heading, { x: heading.offsetWidth });

        hoop.setPosition(centerPos.x, centerPos.y, in_plane_targetZ);

        const colCount = 13;
        const colGap = -1;
        const colRect = circle_color.getBoundingClientRect();
        const colWidth = (colRect.width - colGap * (colCount - 1)) / colCount;

        const colEls = Array.from({ length: colCount }, (_, i) => {
            const el = document.createElement('div');
            const fromAbove = i % 2 === 0;
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
            .to(chevron.root.position, { x: behind_centerPos.x, y: behind_centerPos.y, z: behind_targetZ, duration: 1 }, 3)
            .to(chevron.root.rotation, { x: D2R(-90), duration: 0.25 }, 3.75)
            .to(chevron.root.position, { x: centerPos.x, y: centerPos.y, z: in_plane_targetZ, duration: 0.15 }, 4)
            .to(chevron.root.rotation, { y: D2R(45), duration: 0.15 }, 4)
            .add(chevron.setAngle(27.5, { duration: 0.15 }), 4.15)
            .to(chevron.root.rotation, { z: D2R(180), x: D2R(-90), duration: 0, ease: 'power2.out' }, 4.15)
            .to(chevron.root.rotation, { x: D2R(0), y: D2R(0), z: D2R(90), duration: 0.15, ease: 'power2.out' }, 4.15)
            .add(chevron.setAngle(45, { duration: 0.4 }), 4.3)
            .to(chevron.root.position, { x: textTargetLeft.x, duration: 1.85, ease: 'none' }, 4.15)
            .to(chevron.root.rotation, { x: D2R(180), duration: 1, ease: 'power2.inOut' }, 4.85)
            // .to(circle_color, { '--bg': hoop_color, duration: 0.5, ease: 'power1.inOut' }, 4.15)
            .to(circle_color, { opacity: 1, duration: 0.5, ease: 'power1.inOut' }, 4.15)
            .to(circle_color, {
                clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
                x: circle_rect.width / 2,
                duration: 1,
                ease: 'none'
            }, 4.15)
            .to(heading, { x: 0 - circle_rect.width / 3 }, 5)
            .fromTo(circle_outline.querySelector("svg"), { x:'-100%'},{ x:'0%', duration: 0.5}, 5)

        colEls.slice().reverse().forEach(({ el, fromAbove }, i) => {
            callout_tl.fromTo(el,
                { y: fromAbove ? '-100%' : '100%' },
                { y: '0%', duration: 1.5, ease: 'power3.inOut' },
                4.5 + i * 0.12
            );
        });

        callout_tl.fromTo(copy,
            { y: -50, opacity: 0 },
            { y: 0,   opacity: 1 },
            6
        )
        .to(chevron.root.rotation, { z: D2R(0), y: D2R(-5), ease: 'none', duration: 0.30 }, 5.85);
    };

    const animateCallout2_desktop = (wrapper) => {
        const { circle_outline, circle_color, heading, copy, color, hoop_color } = getCalloutEls(wrapper);
        if (!heading) return;

        const circle_rect      = circle_outline.getBoundingClientRect();
        const in_plane_targetZ = chevron.getZForPixelHeight(circle_rect.height * 0.75);
        const behind_targetZ   = in_plane_targetZ - 20;

        const hoop = scene.addHoop('ring_2', { radiusPx: 80, tubePx: 2, z: in_plane_targetZ, color: hoop_color });
        hoop.setSize(circle_rect.width, circle_rect.height);

        const { centerPos } = getCalloutPositions(circle_outline, circle_color, in_plane_targetZ, circle_rect);
        const behind_centerPos = scene.getElementWorldPosition(circle_outline, { anchor: 'center', z: behind_targetZ, offsetY: circle_rect.height });

        gsap.set(circle_color, {
            x:        -circle_rect.width,
            // '--bg':   'transparent',
            opacity: 0,
            clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
        });
        gsap.set(heading, { x: -heading.offsetWidth });

        hoop.setPosition(centerPos.x, centerPos.y, in_plane_targetZ);
        hoop.enablePortal();

        const circleCount = 15;
        const freq = 3;
        const amplitude = 0.35;

        const circleEls = Array.from({ length: circleCount }, (_, i) => {
            const t = i / (circleCount - 1);
            const x = t * 100;
            const y = 50 + amplitude * 100 * Math.sin(t * freq * Math.PI * 2);
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
            .to(chevron.root.position, { x: behind_centerPos.x, y: behind_centerPos.y, z: behind_targetZ, duration: 1 }, 6)
            .add(chevron.setAngle(27.5, { duration: 1 }), 6)
            .to({}, {
                duration: 0.001,
                onStart:           () => hoop.clipChevron(chevron),
                onReverseComplete: () => hoop.releaseChevron(chevron),
            }, 6.35)
            // .to(circle_color, { '--bg': color, duration: 0.5, ease: 'power1.inOut' }, 6)
            .to(circle_color, { opacity: 1, duration: 0.5, ease: 'power1.inOut' }, 6)
            .to(circle_color, {
                clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
                x: -circle_rect.width / 2,
                duration: 1,
                ease: 'none'
            }, 6)
            .to(heading, { x: 0 + circle_rect.width / 3 }, 7)
            .fromTo(circle_outline.querySelector("svg"), { x:'100%'},{ x:'0%', duration: 0.5}, 7)
            .fromTo(copy,
                { y: -50, opacity: 0 },
                { y: 0,   opacity: 1 },
                8
            );

        circleEls.forEach(({ el, dur }) => {
            callout_tl.fromTo(el, { scale: 0 }, { scale: 3, duration: dur, ease: 'power4.inOut' }, 7.5);
            callout_tl.fromTo(el, { x: -150 },  { x: 0,     duration: dur, ease: 'none' },          7.5);
        });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // MOBILE ANIMATIONS  (no chevron — pure DOM pill reveals)
    // ═══════════════════════════════════════════════════════════════════════════
    //
    // Timeline layout per callout (3s bucket each):
    //   t+0.0 → pill paints from offscreen (duration 1)
    //   t+0.5 → decorative fill cascade (blinds / columns / bubbles)
    //   t+1.0 → heading slides into view (duration 1)
    //   t+2.0 → copy fades up (duration 1)
    //
    // Callout 0: 0–3   |   Callout 1: 3–6   |   Callout 2: 6–9
    // ═══════════════════════════════════════════════════════════════════════════

    const animateCallout0_mobile = (wrapper) => {
        const { circle_outline, circle_color, heading, copy, color } = getCalloutEls(wrapper);
        if (!heading) return;

        const circle_rect = circle_outline.getBoundingClientRect();

        gsap.set(circle_color, {
            x:        -circle_rect.width,
            '--bg':   color,
            clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
        });
        gsap.set(heading, { x: -heading.offsetWidth, paddingRight: circle_rect.width / 4, });

        // Diagonal blind fill (left-to-right)
        const blindCount = 8;
        const blindRect  = circle_color.getBoundingClientRect();
        const blindWidth = (blindRect.width) / blindCount * 1.5;

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
            // Paint the pill left → right
            .to(circle_color, {
                clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
                x: 0,
                duration: 1,
                ease: 'none'
            }, 0)
            // Heading slides in from the left
            .to(heading, { x: 0 + circle_rect.width / 4, duration: 1 }, 1);

        // Blinds cascade left-to-right
        blindEls.forEach(({ el }, i) => {
            callout_tl.fromTo(el,
                { rotateZ: 45, scaleX: 0 },
                { rotateZ: 0, scaleX: 2.5, duration: 1.2, ease: 'power4.inOut' },
                0.5 + i * 0.1
            );
        });

        // Copy reveal
        callout_tl.fromTo(copy,
            { y: -50, opacity: 0 },
            { y: 0,   opacity: 1 },
            2
        );
    };

    const animateCallout1_mobile = (wrapper) => {
        const { circle_outline, circle_color, heading, copy, color } = getCalloutEls(wrapper);
        if (!heading) return;

        const circle_rect = circle_outline.getBoundingClientRect();

        gsap.set(circle_color, {
            x:        circle_rect.width,
            '--bg':   color,
            clipPath: `inset(0px 0px 0% ${circle_rect.width}px round ${circle_rect.height}px)`,
        });
        gsap.set(heading, { x: heading.offsetWidth, paddingLeft: circle_rect.width / 4, });

        // Vertical column fill — alternating from above/below
        const colCount = 13;
        const colGap   = -1;
        const colRect  = circle_color.getBoundingClientRect();
        const colWidth = (colRect.width - colGap * (colCount - 1)) / colCount;

        const colEls = Array.from({ length: colCount }, (_, i) => {
            const el = document.createElement('div');
            const fromAbove = i % 2 === 0;
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
            // Paint the pill right → left
            .to(circle_color, {
                clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
                x: 0,
                duration: 1,
                ease: 'none'
            }, 3)
            // Heading slides in from the right
            .to(heading, { x: 0 - circle_rect.width / 4, duration: 1 }, 4);

        // Columns drop in, right-to-left cascade
        colEls.slice().reverse().forEach(({ el, fromAbove }, i) => {
            callout_tl.fromTo(el,
                { y: fromAbove ? '-100%' : '100%' },
                { y: '0%', duration: 1.5, ease: 'power3.inOut' },
                3.5 + i * 0.08
            );
        });

        // Copy reveal
        callout_tl.fromTo(copy,
            { y: -50, opacity: 0 },
            { y: 0,   opacity: 1 },
            5
        );
    };

    const animateCallout2_mobile = (wrapper) => {
        const { circle_outline, circle_color, heading, copy, color } = getCalloutEls(wrapper);
        if (!heading) return;

        const circle_rect = circle_outline.getBoundingClientRect();

        gsap.set(circle_color, {
            x:        -circle_rect.width,
            '--bg':   color,
            clipPath: `inset(0px ${-circle_rect.width}px 0% 0% round ${circle_rect.height}px)`,
        });
        gsap.set(heading, { x: -heading.offsetWidth, paddingRight: circle_rect.width / 4 });

        // Sinusoidal row of expanding bubbles
        const circleCount = 15;
        const freq        = 3;
        const amplitude   = 0.35;

        const circleEls = Array.from({ length: circleCount }, (_, i) => {
            const t = i / (circleCount - 1);
            const x = t * 100;
            const y = 50 + amplitude * 100 * Math.sin(t * freq * Math.PI * 2);
            const size = 30 + Math.random() * 90; // smaller range for mobile pill
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
            return { el, dur: 2 + Math.random() * 1.5 };
        });

        callout_tl
            // Paint the pill left → right
            .to(circle_color, {
                clipPath: `inset(0px 0px 0% 0px round ${circle_rect.height}px)`,
                x: 0,
                duration: 1,
                ease: 'none'
            }, 6)
            // Heading slides in from the left
            .to(heading, { x: 0 + circle_rect.width / 4, duration: 1 }, 7);

        // Bubbles expand and drift
        circleEls.forEach(({ el, dur }) => {
            callout_tl.fromTo(el, { scale: 0 }, { scale: 3, duration: dur, ease: 'power4.inOut' }, 6.5);
            callout_tl.fromTo(el, { x: -150 },  { x: 0,     duration: dur, ease: 'none' },          6.5);
        });

        // Copy reveal
        callout_tl.fromTo(copy,
            { y: -50, opacity: 0 },
            { y: 0,   opacity: 1 },
            8
        );
    };

    // ── Dispatch ───────────────────────────────────────────────────────────────

    const handlers = isMobile
        ? [animateCallout0_mobile, animateCallout1_mobile, animateCallout2_mobile]
        : [animateCallout0_desktop, animateCallout1_desktop, animateCallout2_desktop];

    callouts.forEach((wrapper, index) => {
        handlers[index]?.(wrapper);
    });

    return () => {
        callout_tl.scrollTrigger?.kill();
        callout_tl.kill();

        // Remove dynamically injected blind/column/circle elements
        callouts.forEach((wrapper) => {
            wrapper.querySelectorAll('.circle-color > div').forEach((el) => el.remove());
            // Reset inline styles gsap applied
            const circleColor = wrapper.querySelector('.circle-color');
            const heading = wrapper.querySelector('.circle-color h2');
            const copy = wrapper.querySelector('.copy-wrapper');
            [circleColor, heading, copy].forEach((el) => {
                if (el) gsap.set(el, { clearProps: 'all' });
            });
        });

        // Remove hoops from scene
        ['ring_0', 'ring_1', 'ring_2'].forEach((name) => {
            scene.removeHoop?.(name);
        });

        if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    };
}


const D2R = (d) => THREE.MathUtils.degToRad(d);

// function ChevronDevBox({ chevron, inset = "50px 10px 0 0" }) {
//     const [pos, setPos]     = useState({ x: 0, y: 0, z: 0 });
//     const [rot, setRot]     = useState({ x: 0, y: 0, z: 0 });
//     const [arm, setArm]     = useState(45);
//     const activeRef         = useRef(null);

//     const D2R = d => d * Math.PI / 180;
//     const R2D = r => parseFloat((r * 180 / Math.PI).toFixed(1));
//     useEffect(() => {
//         const handleMouseUp = () => { activeRef.current = null; };
//         const handleTouchEnd = () => { activeRef.current = null; };
//         window.addEventListener('mouseup', handleMouseUp);
//         window.addEventListener('touchend', handleTouchEnd);
//         return () => {
//             window.removeEventListener('mouseup', handleMouseUp);
//             window.removeEventListener('touchend', handleTouchEnd);
//         };
//     }, []);

//     useEffect(() => {
//         if (!chevron) return;
//         const update = () => {
//             // ← THE FIX: don't clobber state while the user is dragging/typing
//             if (activeRef.current) return;

//             const p = chevron.root.position;
//             const r = chevron.root.rotation;
//             setPos({ x: parseFloat(p.x.toFixed(2)), y: parseFloat(p.y.toFixed(2)), z: parseFloat(p.z.toFixed(2)) });
//             setRot({ x: R2D(r.x), y: R2D(r.y), z: R2D(r.z) });
//             setArm(R2D(chevron.arm1.rotation.z));
//         };
//         gsap.ticker.add(update);
//         return () => gsap.ticker.remove(update);
//     }, [chevron]);

//     const applyPos = (axis, v) => { chevron.root.position[axis] = v; setPos(p => ({ ...p, [axis]: v })); };
//     const applyRot = (axis, v) => { chevron.root.rotation[axis] = D2R(v); setRot(r => ({ ...r, [axis]: v })); };
//     const applyArm = (v) => { chevron.arm1.rotation.z = D2R(v); chevron.arm2.rotation.z = -D2R(v); setArm(v); };

//     if (!chevron) return null;

//     const trackStyle  = { display: 'grid', gridTemplateColumns: '14px 1fr 56px', alignItems: 'center', gap: '6px', marginBottom: '4px' };
//     const labelStyle  = (color) => ({ fontSize: '10px', fontWeight: '700', color, textAlign: 'center' });
//     const numStyle    = { background: '#1a1d28', border: '1px solid #2a2d38', borderRadius: '3px', color: '#c8ccd8', fontFamily: 'monospace', fontSize: '14px', padding: '2px 4px', width: '100%', textAlign: 'right' };
//     const sectionStyle = { fontSize: '9px', letterSpacing: '0.2em', color: '#4a4f63', margin: '8px 0 5px', paddingBottom: '4px', borderBottom: '1px solid #2a2d38' };

//     const Track = ({ label, color, value, min, max, step = 0.1, onChange }) => (
//     <div style={trackStyle}>
//         <span style={labelStyle(color)}>{label}</span>
//         <input
//             type="range" min={min} max={max} step={step} value={value}
//             onMouseDown={() => activeRef.current = label}
//             onTouchStart={() => activeRef.current = label}
//             onChange={e => onChange(parseFloat(e.target.value))}
//             style={{ width: '100%', accentColor: color }}
//         />
//         <input
//             type="number" min={min} max={max} step={step}
//             value={value}
//             onFocus={() => activeRef.current = label}
//             onBlur={()  => { activeRef.current = null; }}
//             onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
//             style={numStyle}
//         />
//     </div>
// );

//     // Portal renders outside the pointer-events:none scene wrapper
//     return createPortal(
//         <div style={{
//             position: 'fixed', inset, width: '280px', height: 'fit-content',
//             background: '#0d0f14', border: '1px solid #2a2d38',
//             borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px',
//             color: '#c8ccd8', zIndex: 9999,
//             boxShadow: '0 8px 32px rgba(0,0,0,0.6)', userSelect: 'none',
//             overflow: 'hidden', pointerEvents: 'auto',
//         }}>
//             <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', background:'#13161f', borderBottom:'1px solid #2a2d38' }}>
//                 <span style={{ fontSize:'14px', color:'#4d9fff' }}>⬡</span>
//                 <span style={{ flex:1, letterSpacing:'0.15em', fontSize:'10px', color:'#7a7f94' }}>CHEVRON DEV</span>
//             </div>

//             <div style={{ padding: '8px 12px' }}>
//                 <div style={sectionStyle}>POSITION</div>
//                 <Track label="X" color="#ff4d6d" value={pos.x} min={-50} max={50}  onChange={v => applyPos('x', v)} />
//                 <Track label="Y" color="#39ff80" value={pos.y} min={-50} max={50}  onChange={v => applyPos('y', v)} />
//                 <Track label="Z" color="#4d9fff" value={pos.z} min={-100} max={30} onChange={v => applyPos('z', v)} />

//                 <div style={sectionStyle}>ROTATION °</div>
//                 <Track label="X" color="#ff4d6d" value={rot.x} min={-180} max={180} step={1} onChange={v => applyRot('x', v)} />
//                 <Track label="Y" color="#39ff80" value={rot.y} min={-180} max={180} step={1} onChange={v => applyRot('y', v)} />
//                 <Track label="Z" color="#4d9fff" value={rot.z} min={-180} max={180} step={1} onChange={v => applyRot('z', v)} />

//                 <div style={sectionStyle}>ARM ANGLE °</div>
//                 <Track label="A" color="#f5c542" value={arm} min={0} max={90} step={0.5} onChange={applyArm} />
//             </div>
//         </div>,
//         document.body
//     );
// }