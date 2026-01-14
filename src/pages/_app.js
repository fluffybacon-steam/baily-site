import '@/styles/globals.scss';
import React, { useEffect } from 'react';
import Menu from '@/components/Menu';
import Footer from '@/components/Footer';
import Particles from '@/components/Particles';
// import DotGrid from '@/components/Dotgrid.js';
import {gsap} from 'gsap';
import ScrollSmoother from "gsap/dist/ScrollSmoother";
gsap.registerPlugin(ScrollSmoother);

export default function App({ Component, pageProps }) {

  useEffect(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      if (!ScrollSmoother.get()) {
        ScrollSmoother.create({
          smooth: 0.5,
          effects: true,
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
        });
      }
    }
  }, []);

  return (
    <>
      <div style={{ width: '100%', height: '100vh', position: 'fixed' }}>
        {/* <Particles
          particleColors={['var(--ball-light)', 'var(--ball-dark)']}
          particleCount={100000}
          particleSpread={10}
          speed={0.05}
          particleBaseSize={500}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={false}
        /> */}
        {/* <DotGrid
          dotSize={10}
          gap={15}
          baseColor="#ff2e2775"
          activeColor="#5227FF"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        /> */}
      </div>
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Menu />
          <main id='page'>
            <Component {...pageProps}/>
          </main>
          {/* <Footer /> */}
        </div>
      </div>
      <div id='coverup'></div>
      <div id="tooltip"></div>
    </>
  )

}
