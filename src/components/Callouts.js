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
        <div className="callouts_container" ref={containerRef} style={{position: 'relative', overflow: 'visible'}}>
            <Scene debug={1} width="100vw" height="100%" onReady={({ chevron, scene })  => {
                calloutAnimation(chevron, scene, containerRef);
            }} />
            <div className="callout_wrapper">
                <div className="circle-outline"></div>
                <div className="circle-color">
                    <h2>Buy a website designed and developed for you</h2>
                </div>
                <div className='copy-wrapper'>
                    <p>Today anyone can make a website today, just as anyone can snap a photo with their phone. But there comes the time when you need a photographer: A professional with the equipment and experience to create the most value.
                    </p>
                    <p>We design and develop custom websites as a profession. Built with the features & services you require. With us, your peers and clients will make no mistake who built your digital storefront: An expert.
                    </p>
                </div>
            </div>

            <div className="callout_wrapper">
                <div className="circle-outline"></div>
                <div className="circle-color">
                    <h2>Buy a website designed and developed for you</h2>
                </div>
                <div className='copy-wrapper'>
                    <p>Today anyone can make a website today, just as anyone can snap a photo with their phone. But there comes the time when you need a photographer: A professional with the equipment and experience to create the most value.
                    </p>
                    <p>Today anyone can make a website today, just as anyone can snap a photo with their phone. But there comes the time when you need a photographer: A professional with the equipment and experience to create the most value.
                    </p>
                    <p>We design and develop custom websites as a profession. Built with the features & services you require. With us, your peers and clients will make no mistake who built your digital storefront: An expert.
                    </p>
                </div>
            </div>

            {/* <div className="callout_wrapper">
                <div className="circle-outline"></div>
                <div className="circle-color">
                    <div className='copy-wrapper'>
                        <h2>Be seen by more with online advertising</h2>
                        <p>
                            Advertising online makes it easier than ever to reach your target audience. 
                            It's also never been easier to waste funds doing so. Google, Meta and Reddit advertising 
                            dashboards are engineered to encourage overspending.
                        </p>
                        <p>
                            We handle the technical settings and optimize the money you spend. We'll take the guess work out campaigns and deliver the results you desire
                        </p>
                    </div>
                </div>
            </div>

            <div className="callout_wrapper">
                <div className="circle-outline"></div>
                <div className="circle-color">
                    <div className='copy-wrapper'>
                        <h2>Full-stack development for any challenges</h2>
                        <p>
                            Websites are just the beginning. At our core, we are a problem solving company who utilizes software to support practical solutions. Whether it's mobile app development or deep-dive technical analysis, I am your technical partner for everything digital.
                        </p>
                    </div>
                </div>
            </div> */}
        </div>
    )
}


const D2R = d => d * Math.PI / 180;