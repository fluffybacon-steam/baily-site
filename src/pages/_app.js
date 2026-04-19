import '@/styles/globals.scss';
import React, { useRef, useState } from 'react';
import Menu from '@/components/Menu';
import Footer from '@/components/Footer';
import { gsap } from 'gsap';
import ScrollSmoother from 'gsap/dist/ScrollSmoother';
import TopologyBackground from '@/3dcomponents/TopologyBackground';
import Scene from '@/components/Scene';
import { RenderSceneContext } from '@/context/RenderSceneContext';
gsap.registerPlugin(ScrollSmoother);

import '@/styles/Showcase3D.scss';

export default function App({ Component, pageProps }) {
    const sceneRef   = useRef(null);
    const chevronRef = useRef(null);

    // ── Receives the live RenderScene + Chevron once Scene has mounted ───────
    // Both refs are populated before any child component can fire a transition,
    // so there is no race condition.
    const handleReady = ({ scene, chevron }) => {
        sceneRef.current   = scene;
        chevronRef.current = chevron;

        // Start invisible — navItemToPageAnimation makes it visible when needed
        if(chevronRef.current){
            chevronRef.current.root.visible = false;
        }
    };


    // useEffect(() => {

    // }, []);

    return (
        <RenderSceneContext.Provider value={{ sceneRef, chevronRef }}>

            {/*
                Scene mounts its own canvas div (position:absolute).
                The fixed wrapper promotes it to a viewport overlay so it
                sits above all page content during transitions.
                pointer-events:none on both so nothing underneath is blocked.
            */}
            <div 
                id="pageChervonScene"
                style={{
                    position:      'fixed',
                    inset:         0,
                    pointerEvents: 'none',
                    zIndex:        999,
                }}
            >
                <Scene
                    // debug={1}
                    name="page"
                    chevronOpts={{ angle: 0 }}
                    width="100%"
                    height="100%"
                    inset="0px"
                    onReady={handleReady}
                />
            </div>

            <div id="smooth-wrapper">
                <div id="smooth-content">
                    <Menu />
                    <main id='page'>
                        <Component {...pageProps} />
                    </main>
                    <Footer />
                </div>
            </div>

        </RenderSceneContext.Provider>
    );
}