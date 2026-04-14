import '@/styles/globals.scss';
import React, { useRef, useState } from 'react';
import Menu from '@/components/Menu';
import Footer from '@/components/Footer';
import { gsap } from 'gsap';
import ScrollSmoother from 'gsap/dist/ScrollSmoother';
import TopologyBackground from '@/3dcomponents/TopologyBackground';
import Scene from '@/components/Scene';
import { ChevronSceneContext } from '@/context/ChevronSceneContext';
import { ColumnWorldControls } from '@/3dcomponents/ColumnWorldControls.jsx';
import { fireColumnAnimation } from '@/components/Scene.js';
gsap.registerPlugin(ScrollSmoother);

export default function App({ Component, pageProps }) {
    const sceneRef   = useRef(null);
    const chevronRef = useRef(null);
    const [columnWorld, setColumnWorld] = useState(null);

    // ── Receives the live ChevronScene + Chevron once Scene has mounted ───────
    // Both refs are populated before any child component can fire a transition,
    // so there is no race condition.
    const handleReady = ({ scene, chevron }) => {
        sceneRef.current   = scene;
        chevronRef.current = chevron;

        // Start invisible — navItemToPageAnimation makes it visible when needed
        chevron.root.visible = false;
        if(window.location.pathname === "/"){
            fireColumnAnimation(scene, setColumnWorld)
        }
    };


    // useEffect(() => {

    // }, []);

    return (
        <ChevronSceneContext.Provider value={{ sceneRef, chevronRef }}>

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
            {columnWorld && <ColumnWorldControls world={columnWorld} />}

        </ChevronSceneContext.Provider>
    );
}