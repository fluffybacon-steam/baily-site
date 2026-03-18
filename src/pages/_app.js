import '@/styles/globals.scss';
import React, { useEffect } from 'react';
import Menu from '@/components/Menu';
import Footer from '@/components/Footer';
import Scene from '@/components/Scene';
import {gsap} from 'gsap';
import ScrollSmoother from "gsap/dist/ScrollSmoother";
gsap.registerPlugin(ScrollSmoother);

export default function App({ Component, pageProps }) {

  useEffect(() => {
    // Hide for dev right now
    //
    // if (typeof window !== "undefined") {
    //   if (!ScrollSmoother.get()) {
    //     ScrollSmoother.create({
    //       smooth: 0.5,
    //       effects: true,
    //       wrapper: "#smooth-wrapper",
    //       content: "#smooth-content",
    //     });
    //   }
    // }
  }, []);

  return (
    <>
      {<Scene />}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Menu />
          <main id='page'>
            <Component {...pageProps}/>
          </main>
          <Footer />
        </div>
      </div>
      {/* <div id='coverup'></div>
      <div id="tooltip"></div> */}
    </>
  )

}
