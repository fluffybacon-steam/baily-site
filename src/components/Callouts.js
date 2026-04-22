import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Scene, { calloutAnimation } from '@/components/Scene';

gsap.registerPlugin(ScrollTrigger);

export default function Callouts () {
    const containerRef = useRef(null);

    const chevronRef = useRef(null);
    const sceneRef   = useRef(null);

    return (
        <section className="callouts_container" ref={containerRef}>
            <div className="max-content" style={{position: 'relative', overflow: 'hidden'}}>
                <Scene 
                // debug={1} 
                name="callouts"
                width="100vw" 
                height="100%" 
                inset="0 0 0 0"
                onReady={({ scene })  => {
                    calloutAnimation(scene, containerRef);
                }} />
                <div className="callout_wrapper callout_wrapper--1" data-color="#FF715B" data-color-hoop="#FF715B">
                    <div className="circle-outline"></div>
                    <div className="circle-color">
                        {/* <h2>Stop apologizing for your link and start flaunting it.</h2> */}
                        <h2>Build instant credibility with a world-class design</h2>
                    </div>
                    <div className='copy-wrapper'>
                        <p>Anyone can take a photo, but there comes a time when you need a photographer. A professional with the vision, equipment, and experience to capture the moment.
                        </p>
                        <p>We don&apos;t do &quot;templates.&quot; We engineer custom digital storefronts built around your specific features and services. When we&apos;re finished, your peers and clients will make no mistake about who built your site: an expert who understands that your online presence is synonymous with reputation.
                        </p>
                    </div>
                </div>

                <div className="callout_wrapper callout_wrapper--2" data-color="#F9CB40" data-color-hoop="#F9CB40">
                    <div className="circle-outline"  ></div>
                    <div className="circle-color" >
                        <h2>Stop hoping for sales Start engineering for them</h2>
                    </div>
                    <div className='copy-wrapper'>
                        <p>Social media makes buying ads easy, but without data, you aren&apos;t marketing: you&apos;re gambling. We specialize in data-driven campaigns that turn views into value.</p>
                        <p>Are you in an industry we haven&apos;t conquered yet?</p>
                        <p><b>Get 50% off your discovery invoice.</b></p>
                        <p>We get the experience; you get the results.</p>
                    </div>
                </div>

                <div className="callout_wrapper callout_wrapper--3" data-color="#BCED09" data-color-hoop="#BCED09">
                    <div className="circle-outline"></div>
                    <div className="circle-color" >
                        <h2>We translate your ideas into every digital language</h2>
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

            </div>
        </section>
    )
}


const D2R = d => d * Math.PI / 180;