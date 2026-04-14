import Link from 'next/link';
import { useRouter } from 'next/router';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef } from 'react';
import { useChevronScene } from '@/context/ChevronSceneContext';
import {page_transition} from '@/lib/helper.js';

const D2R = (d) => (d * Math.PI) / 180;

export default function AnimatedNav() {
    const navRef = useRef(null);

    // ── Scroll-driven border animation ───────────────────────────────────────
    useGSAP(() => {
        console.log('useGSAP has ran!');
        const nav = navRef.current;
        if (nav) {
            const navLinks = nav.querySelectorAll('a');
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: nav,
                    pin: true,
                    start: 'top 25%',
                    end: `bottom 25%`,
                    scrub: 2,
                    pinSpacing: true,
                    snap: {
                        snapTo: [0, 0.7, 1], // adjust 0.8 to whatever normalized position the "gap" label lands at
                        duration: 0.5,
                        ease: 'power1.inOut',
                    },
                    onRefresh: () => {
                        const pinSpacer = nav.closest('.gsap-pin-spacer');
                        if (pinSpacer) pinSpacer.style.overflow = 'visible';
                    },
                },
            });
            animateNav(tl, nav, navLinks);
        }
    }, { dependencies: [navRef] });

    return (
        <div className='animated-nav' ref={navRef}>
            <div className='shadowBox shadowBox-top-left' />
            <div className='shadowBox shadowBox-top-right' />
            <div className='shadowBox shadowBox-bottom-left' />
            <div className='shadowBox shadowBox-bottom-right' />
            <div className='shadowBox shadowBox-left-top' />
            <div className='shadowBox shadowBox-left-bottom' />
            <div className='shadowBox shadowBox-right-top' />
            <div className='shadowBox shadowBox-right-bottom' />
            <NavItem
                number={1}
                url="/about"
                title="About"
                excerpt="Learn about me and all the hats I wear"
                icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z" /></svg>}
                grid_area="1 / 1 / 2 / 2"
            />
            <NavItem
                number={2}
                url="/portfolio"
                title="Portfolio"
                icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z" /></svg>}
                excerpt="Take a look at the things I've done"
                grid_area="1 / 2 / 2 / 3"
            />
            <NavItem
                number={3}
                url="/services"
                title="Services"
                icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M756-120 537-339l84-84 219 219-84 84Zm-552 0-84-84 276-276-68-68-28 28-51-51v82l-28 28-121-121 28-28h82l-50-50 142-142q20-20 43-29t47-9q24 0 47 9t43 29l-92 92 50 50-28 28 68 68 90-90q-4-11-6.5-23t-2.5-24q0-59 40.5-99.5T701-841q15 0 28.5 3t27.5 9l-99 99 72 72 99-99q7 14 9.5 27.5T841-701q0 59-40.5 99.5T701-561q-12 0-24-2t-23-7L204-120Z" /></svg>}
                excerpt="All the things I can do & provide"
                grid_area="2 / 1 / 3 / 2"
            />
            <NavItem
                number={4}
                url="/blog"
                title="Blog"
                icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h440l200 200v440q0 33-23.5 56.5T760-120H200Zm0-80h560v-400H600v-160H200v560Zm80-80h400v-80H280v80Zm0-320h200v-80H280v80Zm0 160h400v-80H280v80Zm-80-320v160-160 560-560Z" /></svg>}
                excerpt="Collection of my thoughts and 2 cents"
                grid_area="2 / 2 / 3 / 3"
            />
            <div class='foreword'>
                <SplitText
                    text="Ready to explore?"
                    delay={20}
                    duration={0.4}
                    ease="power2.out"
                    splitType="chars"
                    from={{ opacity: 0, y: 40 }}
                    to={{ opacity: 1, y: 0 }}
                    threshold={0.1}
                    rootMargin="-100px"
                    textAlign="center"
                />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

const NavItem = (props) => {
    const router = useRouter();

    // Scene and chevron come from the global context set up in _app.js —
    // this is the exact same instance the devbox controls.
    const { sceneRef, chevronRef } = useChevronScene();

    const handleClick = (event) => {
        event.preventDefault();
        navItemToPageAnimation(props.number, props.url, props.flyMidpoint ?? null);
    };

    useEffect(()=>{
      const scene   = sceneRef?.current;
      const chevron = chevronRef?.current;

      if (!scene || !chevron) {
          console.warn('navItemToPageAnimation: scene or chevron not ready');
          return;
      }

      chevron.snapAngle(0);
      chevron.root.visible = false;

    }, [sceneRef, chevronRef])

    /**
     * @param {number}  number
     * @param {string}  url
     * @param {{ x: number, y: number, z: number } | null} midpoint
     * @returns {gsap.core.Timeline}
     */
    function navItemToPageAnimation(number, url, midpoint = null) {
        const target       = document.querySelector(`a[data-num="${number}"]`);
        const main         = document.querySelector('main');
        const masthead     = document.querySelector('#masthead');
        const animated_nav = document.querySelector('.animated-nav');
 
        const scene   = sceneRef?.current;
        const chevron = chevronRef?.current;
 
        if (!scene || !chevron) {
            console.warn('navItemToPageAnimation: scene or chevron not ready');
            return;
        }
 
        target.classList.add('active');
        const otherLinks = [...animated_nav.querySelectorAll('a')].filter(el => el !== target);
        const paddingPx  = parseFloat(getComputedStyle(target).getPropertyValue('--padding') || '0');
 
        let p0, p1, p2;

        const dirZ = (from, to) => Math.atan2(to.y - from.y, to.x - from.x) - Math.PI / 2;

      // Quadratic bezier interpolation between two world points via a control point
      const quadBezier = (p0, ctrl, p1, t) => ({
          x: (1-t)**2 * p0.x  +  2*(1-t)*t * ctrl.x  +  t**2 * p1.x,
          y: (1-t)**2 * p0.y  +  2*(1-t)*t * ctrl.y  +  t**2 * p1.y,
          z: (1-t)**2 * p0.z  +  2*(1-t)*t * ctrl.z  +  t**2 * p1.z,
      });

      // Perpendicular control point offset from the midpoint of a segment
      // arcAmount: world-unit bulge. Positive = left of travel direction.
      const quadBezierTangent = (p0, ctrl, p2, t) => {
          const dx = 2*(1-t)*(ctrl.x - p0.x) + 2*t*(p2.x - ctrl.x);
          const dy = 2*(1-t)*(ctrl.y - p0.y) + 2*t*(p2.y - ctrl.y);
          const dz = 2*(1-t)*(ctrl.z - p0.z) + 2*t*(p2.z - ctrl.z);
          return { x: dx, y: dy, z: dz };
      };
 
        const tl = gsap.timeline({});
 
        const CHEVRON_RATIO = 4.75;
        const collapseW     = paddingPx * 2;
        const collapseH     = collapseW * CHEVRON_RATIO;

        
        tl.to(target, {
          width:    collapseW,
          height:   collapseH,
          padding:  0,
          duration: 0.4,
          ease:     'power1.in',
          onComplete: ()=>{
              chevron.root.visible = true;
              chevron.root.rotation.y = D2R(120);
              target.style.opacity = 0;
            }
        }, 0);

        tl.to(otherLinks, {
            y: 200,
            opacity: 0,
            rotate: () => (Math.random() * 30) - 15,
            duration: 0.4,
        }, 0)
 
        const mainRect     = main?.getBoundingClientRect()     ?? { left: 0 };
        const mastheadRect = masthead?.getBoundingClientRect() ?? { left: 0 };

        const spawnZ = chevron.getZForPixelHeight(collapseH);
        const spawnMidZ = chevron.getZForPixelHeight(collapseH/3);
        
        p0 = { ...scene.getElementWorldPosition(target, { anchor: 'center', z: spawnZ, offsetY: -(target.offsetHeight - collapseH)/2    }) };
        p1 = scene.getElementWorldPosition(masthead, {
          anchor:  'bottom-center',
          z:       spawnMidZ,
          offsetY: mastheadRect.height * Math.random(),
          offsetX: mastheadRect.width/2 * Math.random()
        });
        p2 = scene.getElementWorldPosition(masthead, {
          anchor:  'bottom-left',
          z:       spawnZ,
          offsetX: mainRect.left - mastheadRect.left,
        });
 

        tl.addLabel('start-flight', 0.4);

        tl.add(chevron.setAngle(45, { duration: 0.4, ease: 'power3.inOut' }), 'start-flight');
        
        tl.to(chevron.root.position, { 
          x: p0.x, y: p0.y, z: p0.z, ease: 'none',  duration: 0
        }, 'start-flight');


        const tan0  = quadBezierTangent(p0, p1, p2, 0);
        const xyLen0 = Math.sqrt(tan0.x**2 + tan0.y**2);
        const initZ  = Math.atan2(tan0.y, tan0.x) - Math.PI / 2;
        const initX  = -Math.atan2(tan0.z, xyLen0);

        tl.to(chevron.root.rotation, { x: initX, y: 0, z: initZ, ease:'none', duration: 0.1}, 'start-flight');
        
        const PROXY_DURATION       = 3;    
        const finalRotationLeadTime = 0.5;

        const shortestAngle = (from, to) => {
            let delta = (to - from) % (Math.PI * 2);
            if (delta >  Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;
            return from + delta;
        };

        const proxy = { t: 0 };

        tl.to(proxy, {
            t: 1,
            duration: PROXY_DURATION,
            ease: 'power2.inOut',
            // onStart: ()=>{
            //     document.body.classList.add("loading");
            //     document.body.classList.add("transitioning");
            //     router.push(url);
            // },
            onUpdate() {
                const pos   = quadBezier(p0, p1, p2, proxy.t);
                const tan   = quadBezierTangent(p0, p1, p2, proxy.t);
                const xyLen = Math.sqrt(tan.x**2 + tan.y**2);

                Object.assign(chevron.root.position, pos);

                const tangentZ = Math.atan2(tan.y, tan.x) - Math.PI / 2;
                const tangentX = -Math.atan2(tan.z, xyLen);

                // How far into the lead window are we? 0 = tangent only, 1 = final only
                const timeRemaining = (1 - proxy.t) * PROXY_DURATION;
                const blend = finalRotationLeadTime > 0
                    ? Math.max(0, 1 - timeRemaining / finalRotationLeadTime)
                    : 0;

                chevron.root.rotation.x = tangentX + (shortestAngle(tangentX, D2R(0))  - tangentX) * blend;
                chevron.root.rotation.z = tangentZ + (shortestAngle(tangentZ, D2R(90)) - tangentZ) * blend;
            },
            onComplete: ()=>{
                page_transition(document.querySelector('article'), {
                scene:   sceneRef?.current,
                chevron: chevronRef?.current,
            })
            }
        });
        tl.add(()=>{
            document.body.classList.add("loading");
            document.body.classList.add("transitioning");
            router.push(url);
        },`<+=${PROXY_DURATION/2}`);

        tl.duration(1.25);
 
        return tl;
    }

    return (
        <Link
            href={props.url}
            data-num={props.number}
            style={{ gridArea: props.grid_area }}
            onClick={handleClick}
        >
            <h2>{props.title}</h2>
            <div className='icon-wrapper'>{props.icon}</div>
            <p>{props.excerpt}</p>
        </Link>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const animateNav = (tl, nav, navLinks) => {
    const gridGap = getPropertyValue(nav, '--gap');

    const topLeft     = nav.querySelector('.shadowBox-top-left');
    const topRight    = nav.querySelector('.shadowBox-top-right');
    const rightTop    = nav.querySelector('.shadowBox-right-top');
    const leftTop     = nav.querySelector('.shadowBox-left-top');
    const rightBottom = nav.querySelector('.shadowBox-right-bottom');
    const leftBottom  = nav.querySelector('.shadowBox-left-bottom');
    const bottomLeft  = nav.querySelector('.shadowBox-bottom-left');
    const bottomRight = nav.querySelector('.shadowBox-bottom-right');

    const chars = nav.querySelectorAll('.foreword .split-char');

    gsap.set(navLinks, { pointerEvents: 'none' });

    // 0s — text fade in
    tl.fromTo(chars,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', stagger: 0.04 },
        0
    );

    // 2–3s — top borders
    tl.fromTo(topLeft,  { width: '0%', '--progress': '100%' }, { width: '100%', '--progress': '0%', duration: 1, ease: 'none' }, 2);
    tl.fromTo(topRight, { width: '0%', '--progress': '100%' }, { width: '100%', '--progress': '0%', duration: 1, ease: 'none' }, 2);

    // 3–4s — sides top
    tl.fromTo(leftTop,  { height: 'calc(0% - var(--br)/2)', '--progress': '100%' }, { height: 'calc(100% - var(--br)/2)', '--progress': '20%', duration: 1, ease: 'none' }, 3);
    tl.fromTo(rightTop, { height: 'calc(0% - var(--br)/2)', '--progress': '100%' }, { height: 'calc(100% - var(--br)/2)', '--progress': '20%', ease: 'none', duration: 1 }, 3);

    // 4–5s — sides bottom + text fade out
    tl.to(chars, { opacity: 0, scale:0, duration: 1 }, 5);

    tl.to(leftTop,  { borderRadius: 0, '--progress': '0%', duration: 0, ease: 'none' }, 4);
    tl.to(rightTop, { borderRadius: 0, '--progress': '0%', duration: 0, ease: 'none' }, 4);

    tl.fromTo(leftBottom,  { height: '0%', '--progress': '100%' }, { height: '100%', '--progress': '0%', duration: 1, ease: 'none' }, 4);
    tl.fromTo(rightBottom, { height: '0%', '--progress': '100%' }, { height: '100%', '--progress': '0%', duration: 1, ease: 'none' }, 4);

    // 5–6s — bottom borders
    tl.fromTo(bottomLeft,  { width: 'calc(0% - var(--br)/2)', '--progress': '100%' }, { width: 'calc(100% - var(--br)/2)', '--progress': '0%', duration: 1, ease: 'none' }, 5);
    tl.fromTo(bottomRight, { width: 'calc(0% - var(--br)/2)', '--progress': '100%' }, { width: 'calc(100% - var(--br)/2)', '--progress': '0%', duration: 1, ease: 'none' }, 5);

    // 6–8s — reveal nav links
    tl.to(nav, { gap: gridGap, duration: 2 }, 6);
    tl.to(navLinks, { opacity: 1, duration: 2 }, 6);
    tl.to('.shadowBox', { opacity: 0, duration: 2 }, 6);
    tl.to(navLinks, { pointerEvents: 'auto', duration: 0 }, 8);

    // hold
    tl.to({}, { duration: 5 }, 8);

    return tl;
};

function getPropertyValue(element, property_name) {
    const styles = getComputedStyle(element);
    return styles.getPropertyValue(property_name).trim();
}

const SplitText = ({ text, className = "", textAlign = "center" }) => {
    const ref = useRef(null);

    return (
        <p
            ref={ref}
            className={`split-parent ${className}`}
            style={{ textAlign, overflow: "hidden" }}
        >
            {text.split("").map((char, i) => (
                <span
                    key={i}
                    className="split-char"
                    style={{ display: "inline-block", opacity: 0 }}
                >
                    {char === " " ? "\u00A0" : char}
                </span>
            ))}
        </p>
    );
};