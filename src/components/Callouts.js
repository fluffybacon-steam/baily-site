import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useChevron } from '@/context/ChevronContext';

gsap.registerPlugin(ScrollTrigger);

export default () => {
    const containerRef = useRef(null);
    const { chevron, scene } = useChevron() ?? {};

    useEffect(() => {
        if (!chevron || !scene) return;

        // chevron.setRotation(null,null,0);

        const wrappers = containerRef.current.querySelectorAll('.callout_wrapper');

        wrappers.forEach((wrapper) => {
            const circle_outline = wrapper.querySelector('.circle-outline');
            const circle_color = wrapper.querySelector('.circle-color');
            const copy = wrapper.querySelector('.copy-wrapper');
            const heading = circle_color.querySelector('h2');

            if(!heading) return;
            console.log("heading",heading);
            
            const circle_bg_color = getComputedStyle(wrapper).getPropertyValue('--bg').trim();
            const circle_rect = circle_outline.getBoundingClientRect();

            const circle_final_stop = 0.5 * circle_rect.width;

            const targetZ = chevron.getZForPixelHeight(circle_rect.height * 0.5);
            console.log('looky here', targetZ, circle_rect.height);
            const targetPos = scene.getElementWorldPosition(circle_outline, {
                anchor: 'center',
                z: targetZ
            });

            // Initial state
            gsap.set(circle_color, {
                x: -(circle_rect.width),
                '--bg': "transparent",
                clipPath:  `inset(0px -${circle_rect.width}px 0% 0% round ${circle_rect.height}px)`
            });

            gsap.set(heading, {
                x: -(heading.offsetWidth),
            });

            console.log("wrapper",wrapper);
            console.log('offsetParent:', wrapper.offsetParent);
            // Timeline with Scrub
            let cachedPos = { x: 0, y: 0 };

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: wrapper,
                    start: `top-=${circle_rect.height} center`, // Starts when wrapper is near bottom
                    end: "bottom center",   // Ends when wrapper is near top
                    scrub: true,         // Smooth 1-second catch-up
                    pin: false,
                    markers:true,
                    onRefresh: () => {
                        const pos = scene.getElementWorldPosition(circle_outline, {
                            anchor: 'center',
                            z:      targetZ,
                        });
                        if (pos) cachedPos = pos;
                        tl.invalidate(); // tell GSAP to re-read the function values
                    },
                }
            })


            //Fly chervon into circle and out

            .to(chevron.root.position, {
                x:        () => cachedPos.x,
                y:        () => cachedPos.y,
                duration: 1,
                ease: 'none',
            }, 0)

            // .to(chevron.root.rotation, {
            //     y: D2R(45),
            //     duration: 1,
            //     ease: 'none',
            // }, 0)

            .to(circle_color,{ 
                x: -circle_final_stop, 
                '--bg': circle_bg_color, 
                duration: 0.8,
                ease: "power4.in"
            })

            .to(heading, {
                x: circle_final_stop,
                duration: 1,
            })

            .fromTo(copy,{
                opacity: 0,
                y:-20,
            }, {
                opacity: 1,
                y:0,
                duration: 1,
            })

        });

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [chevron, scene]);

    return (
        <div className="callouts_container" ref={containerRef}>
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