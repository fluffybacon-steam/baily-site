import { Red_Rose } from 'next/font/google'
import styles from '@/styles/Home.module.scss'
import React, {useEffect, useRef } from 'react';

// import Link from 'next/link';
// import { useRouter } from 'next/router';
import NavItem from '@/components/NavItem'

import HeroText from '@/components/HeroText';
import SplitText from "@/components/SplitText";

import OscillatingCircle from '@/components/OscillatingCircle';
import Callouts from '@/components/Callouts';

import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

import ScrollTrigger from "gsap/dist/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const rose = Red_Rose({
  weight: 'variable',  // You can define a range of font weights (e.g., 100 to 900)
  style: 'normal',    // You can define the font style (e.g., normal, italic)
  subsets: ['latin'],
})

export default function Home() {
  const navRef = useRef(null);

  useGSAP(()=>{
    console.log("useGSAP has ran!");
    const nav = navRef.current;
    console.log('nav',nav)
    if(nav){
      const navLinks = nav.querySelectorAll('a');
      const tl = gsap.timeline({
          scrollTrigger: {
            // markers:true,
            trigger: nav,
            pin: true, 
            start: "top 25%", 
            end: `+=500`, 
            scrub: 1, 
            pinSpacing:   true,
            onRefresh: () => {
                // ScrollTrigger creates a .pin-spacer wrapper — make it visible
                const pinSpacer = nav.closest('.gsap-pin-spacer');
                if (pinSpacer) pinSpacer.style.overflow = 'visible';
            },
          },
      });
      animateNav(tl, nav,navLinks);
    }
  },{ dependencies:[navRef] });

  return (
    <>
        {/* <HeroText text={'Hohman Digital'}/> */}
        {/* <div style={{height: '500px'}}></div> */}
        <Callouts />
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
            styles={styles}
            url="/about"
            title="About"
            excerpt="Learn about me and all the hats I wear"
            icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z"/></svg>}
            grid_area="1 / 1 / 2 / 2"
          />
          <NavItem 
            number={2}
            styles={styles}
            url="/portfolio"
            title="Portfolio"
            icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z"/></svg>}
            excerpt="Take a look at the things I've done"
            grid_area="1 / 2 / 2 / 3"
          />
          <NavItem 
            number={3}
            styles={styles}
            url="/services"
            title="Services"
            icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M756-120 537-339l84-84 219 219-84 84Zm-552 0-84-84 276-276-68-68-28 28-51-51v82l-28 28-121-121 28-28h82l-50-50 142-142q20-20 43-29t47-9q24 0 47 9t43 29l-92 92 50 50-28 28 68 68 90-90q-4-11-6.5-23t-2.5-24q0-59 40.5-99.5T701-841q15 0 28.5 3t27.5 9l-99 99 72 72 99-99q7 14 9.5 27.5T841-701q0 59-40.5 99.5T701-561q-12 0-24-2t-23-7L204-120Z"/></svg>}
            excerpt="All the things I can do & provide"
            grid_area="2 / 1 / 3 / 2"
          />
          <NavItem 
            number={4}
            styles={styles}
            url="/blog"
            title="Blog"
            icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h440l200 200v440q0 33-23.5 56.5T760-120H200Zm0-80h560v-400H600v-160H200v560Zm80-80h400v-80H280v80Zm0-320h200v-80H280v80Zm0 160h400v-80H280v80Zm-80-320v160-160 560-560Z"/></svg>}
            excerpt="Collection of my thoughts and 2 cents"
            grid_area="2 / 2 / 3 / 3"
          />
        </div>
        <div style={{height: '400px', fontSize:'2rem', display:'flex', justifyContent:"center", flexDirection: "column"}}>
          {/* <OscillatingCircle /> */}
          <SplitText
            text="Development Ongoing..."
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
          <br/>
           <SplitText
            text="Coming Soon!"
            delay={20}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: -40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
          />
          <div className='debug-target'></div>
        </div>
    </>
  )
}

const animateNav = (tl, nav, navLinks) => {
    const gridGap = getPropertyValue(nav, '--gap');

    const topLeft    = nav.querySelector('.shadowBox-top-left');
    const topRight    = nav.querySelector('.shadowBox-top-right');
    const rightTop = nav.querySelector('.shadowBox-right-top');
    const leftTop   = nav.querySelector('.shadowBox-left-top');
    const rightBottom  = nav.querySelector('.shadowBox-right-bottom');
    const leftBottom   = nav.querySelector('.shadowBox-left-bottom');
    const bottomLeft = nav.querySelector('.shadowBox-bottom-left');
    const bottomRight = nav.querySelector('.shadowBox-bottom-right');

    // ── Each side grows from its own edge ─────────────────────────────────────
    // Top — grows rightward from left
    tl.fromTo(topLeft,    { width: '0%', '--progress': '100%' }, { width: '100%', '--progress': '0%', ease: 'none' }, 'top');
    tl.fromTo(topRight,    { width: '0%','--progress': '100%'  }, { width: '100%', '--progress': '0%', ease: 'none' }, 'top');

    tl.fromTo(leftTop,   { height: 'calc(0% - var(--br)/2)','--progress': '100%' }, { height: 'calc(100% - var(--br)/2)', '--progress': '20%', ease: 'none' }, 'sides-top');
    tl.fromTo(rightTop,  { height: 'calc(0% - var(--br)/2)','--progress': '100%' }, { height: 'calc(100% - var(--br)/2)', '--progress': '20%', ease: 'none' }, 'sides-top');

    tl.to(leftTop,   { borderRadius: 0, ease: 'none','--progress': '0%', duration:0 }, 'sides-bottom');
    tl.to(rightTop,  { borderRadius: 0, ease: 'none','--progress': '0%', duration:0 }, 'sides-bottom');

    tl.fromTo(leftBottom,   { height: '0%','--progress': '100%' }, { height: '100%','--progress': '0%', ease: 'none' }, 'sides-bottom');
    tl.fromTo(rightBottom,  { height: '0%','--progress': '100%' }, { height: '100%','--progress': '0%', ease: 'none' }, 'sides-bottom');

    tl.fromTo(bottomLeft, { width: 'calc(0% - var(--br)/2)','--progress': '100%'  }, { width: 'calc(100% - var(--br)/2)','--progress': '0%',  ease: 'none' }, 'bottom');
    tl.fromTo(bottomRight, { width: 'calc(0% - var(--br)/2)','--progress': '100%'  }, { width: 'calc(100% - var(--br)/2)','--progress': '0%',  ease: 'none' }, 'bottom');

    // ── Reveal links ──────────────────────────────────────────────────────────
    tl.add(gsap.to(nav,      { gap: gridGap }),                      'gap');
    tl.add(gsap.to(navLinks, { opacity: 1, pointerEvents: 'auto' }), 'gap');
    tl.add(gsap.to('.shadowBox', { opacity: 0 }), 'gap');

    tl.to({}, { duration: 5 });

    return tl;
};

function getPropertyValue(element, property_name) {
  const styles = getComputedStyle(element);
  return styles.getPropertyValue(property_name).trim();
}