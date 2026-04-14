import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Scene, { calloutAnimation } from '@/components/Scene';

gsap.registerPlugin(ScrollTrigger);

export default () => {
    const containerRef = useRef(null);

    const chevronRef = useRef(null);
    const sceneRef   = useRef(null);

    return (
        <section className="callouts_container" ref={containerRef}>
            <div className="max-content" style={{position: 'relative', overflow: 'visible'}}>
                <Scene 
                // debug={1} 
                width="100vw" 
                height="100%" 
                inset="0 0 0 0"
                onReady={({ chevron, scene })  => {
                    calloutAnimation(chevron, scene, containerRef);
                }} />
                <div className="callout_wrapper callout_wrapper--1" data-color="#9d4edd" data-color-hoop="#9d4edd">
                    <div className="circle-outline"></div>
                    <div className="circle-color">
                        {/* <h2>Stop apologizing for your link and start flaunting it.</h2> */}
                        <h2>Build instant credibility with a world-class design</h2>
                    </div>
                    <div className='copy-wrapper'>
                        <p>Anyone can take a photo, but there comes a time when you need a photographer. A professional with the vision, equipment, and experience to capture the moment.
                        </p>
                        <p>We don't do "templates." We engineer custom digital storefronts built around your specific features and services. When we're finished, your peers and clients will make no mistake about who built your site: an expert who understands that your online presence is synonymous with reputation.
                        </p>
                    </div>
                </div>

                <div className="callout_wrapper callout_wrapper--2" data-color="#9ef01a" data-color-hoop="#9ef01a">
                    <div className="circle-outline"  ></div>
                    <div className="circle-color" >
                        <h2>Stop hoping for sales Start engineering for them</h2>
                    </div>
                    <div className='copy-wrapper'>
                        <p>Social media makes buying ads easy, but without data, you aren't marketing: you're gambling. We specialize in data-driven campaigns that turn views into value.</p>
                        <p>Are you in an industry we haven't conquered yet? <b>You get 50% off your discovery invoice.</b> We get the experience; you get the results.</p>
                    </div>
                </div>

                <div className="callout_wrapper callout_wrapper--3" data-color="#ba181b" data-color-hoop="#ba181b">
                    <div className="circle-outline"></div>
                    <div className="circle-color" >
                        <h2>We translate your ideas into every digital language.</h2>
                    </div>
                    <div className='copy-wrapper'>
                        <p>
                            Our technical expertise goes far beyond websites. We are fullstack developers, capable of crafting any kind of software you desire.
                        </p>
                        <p>
                            Mobile App development, Software Development, AI Integrations. Nothing is foreign to us.
                        </p>
                    </div>
                </div>

                {/* <div className="callout_wrapper" data-color="#ba181b" data-color-hoop="#ba181b">
                    <div className="circle-outline"></div>
                    <div className="circle-color" >
                        <h2>Tech fails. We don't</h2>
                    </div>
                    <div className='copy-wrapper'>
                        <p>There is nothing more frustrating than a "simple" tech issue stalling a sale or halting a deadline.
                        </p>
                        <p>We patch problems before they happen.</p>
                    </div>
                </div> */}

            </div>
        </section>
    )
}


const D2R = d => d * Math.PI / 180;