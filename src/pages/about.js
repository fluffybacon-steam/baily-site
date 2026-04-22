import {useEffect, useState, useRef} from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import { useGSAP } from '@gsap/react';
import {page_transition_last} from '@/lib/helper.js';
// import { useRenderScene } from '@/context/RenderSceneContext';
// import OfficeSection from '@/components/Office';
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import ScrollToPlugin from "gsap/dist/ScrollToPlugin";
import Scene from "@/components/Scene";
import { fireHologramAnimation } from '@/components/Scene';
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);


console.log('page_transition_last',page_transition_last);

const AboutUs = () => {
    const articleRef = useRef(null);
    // const { sceneRef, chevronRef } = useRenderScene();
    // const iconRef = useRef(null);

    useGSAP(() => {
        console.log("useGSAP running!");
        if (articleRef.current) {
            gsap.fromTo('.mask-animation .stencil', 
                { 
                    // Force the starting position
                    webkitMaskPosition: "0% 0%", 
                    maskPosition: "0% 0%" 
                },
                {
                    scrollTrigger: {
                        trigger: '.mask-animation',
                        toggleActions: 'play none none none',
                        start: "center 50%",
                        // markers: true, // Debug tip: uncomment this to see the start line
                    },
                    // Animate both for cross-browser compatibility
                    webkitMaskPosition: "100% 0%",
                    maskPosition: "100% 0%",
                    
                    ease: "steps(9)", // Ensure your sprite has 10 frames if using 9 steps
                    duration: 1,
                }
            );
        }
    }, { scope: articleRef, dependencies: [] })

    return(
        <article ref={articleRef}>
            <h2 class='transition-target'>About Us</h2>
            <div className="about-hero" data-fade-stagger="0">
                <div class='hero-content'>
                    <h1>Your End-to-End Digital Partner</h1>
                    <p>
                        We are dedicated to your growth and committed to delivering excellence on every project. 
                        Our team turns complex technical challenges into seamless solutions that simplify your 
                        operations and empower your business.
                    </p>
                </div>
                <div class='hero-image' data-fade-stagger="0.5">
                    <Scene 
                        name="mobius"
                        inset="-25% -25%" 
                        position="absolute"
                        width="150%" 
                        height="150%" onReady={({ scene }) => {
                            fireHologramAnimation(scene);
                        }} 
                        />
                </div>
            </div>
            <div className='split-block' >
                <div class='copy copy--shrink' data-fade-stagger="0.5">
                    <h2>Who We Are</h2>
                    <p>
                        Founded by Baily Hohman, Hohman Digital LLC is more than just a development shop. 
                        Our mission is to help small businesses establish and grow their digital space. 
                        We make sure your idea or product isn&apos;t just seen... it&apos;s remembered.
                    </p>
                    <p>
                        Check out some of our work below
                    </p>
                    <Link class='button-pill' href='/portfolio'>Portfolio</Link>
                </div>
                <div className='specialities' data-fade-stagger="0.75">
                    <div class='card web'>
                        <h3>Websites</h3>
                        <p>Frontend & Backend System built for scale and permanence.</p>
                    </div>
                    <div class='card growth'>
                        <h3>Growth Strategy</h3>
                        <p>Data-driven PPC, SEO, and emerging GEO techniques.</p>
                    </div>
                    <div class='card native'>
                        <h3>Native Applications</h3>
                        <p>Performant iOS and Android apps that users love.</p>
                    </div>
                     <div class='card ai'>
                        <h3>AI Integration</h3>
                        <p>Streamline processes with the latest technology.</p>
                    </div>
                </div>
            </div>
            <div className='split-block' data-fade-stagger="1">
                <figure >
                    <div className='mask-animation'>
                        <img class='stencil' width="800" height="946" alt='picture of the founder and his dog' src='/sketch_grey_image.png' />
                        <img class='color' width="800" height="946" alt='picture of the founder and his dog' src='https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/president%26co.webp' />
                    </div>
                    <figcaption>President of Hohman Digital, Baily Hohman, sitting with his co-president, Buzz Boy</figcaption>
                </figure>
                <div className="copy copy--grow" data-fade-stagger="0">
                    <h2>Meet the Founder</h2>
                    <p>
                        Hi! I&apos;m <strong>Baily</strong>, founder and president of <strong>Hohman Digital LLC</strong>. 
                        My job is bring my clients&apos; brands & ideas to the digital world.
                        Whether its launching a new business or reinventing an existing one, 
                        I will be there to help.
                    </p>
                    <p>
                        I specialize in:
                    </p>
                    <ul className='custom-icons'>
                        <li className='web'>Frontend & Backend Website Development</li>
                        <li className='data'>Data-driven <abbr title='Pay-Per-Click'>PPC</abbr> campaigns and <abbr title="Search Engine Optimization">SEO </abbr> strategies</li>
                        <li className='ai'>Emerging <abbr title='Generative Engine Optimization'>GEO</abbr> techniques</li>
                        <li className='app'>Android & iOS Applications</li>
                    </ul>
                    <p>
                        We&apos;re also growing our software development capabilities and are currently training our own AI model.
                        For the larger projects that come my way, I leverage my collaborative network of freelancers to deliver at scale.
                    </p>
                </div>
            </div>
            <FounderTimeline />
        </article>
    )   
}
export default AboutUs;


const sections = [
    {
        id: 'curious-coder',
        title: 'The Curious Coder',
        year: '2008',
        content: [
            `I first began writing code around the age of 11. This first consisted of simple Batch scripts, motivated by a desire to understand computers at their core. Naturally, the scope of these home projects grew and a skill developed. By the time I graduated Highschool, I was developing full Windows applications in C# and designing basic websites in HTML & CSS. My parents assumed I would pursue Comp Sci in College, but my growing curiosity for anatomy took me in a different direction.`,
        ],
    },
    {
        id: 'scientist',
        title: 'The Scientist Years',
        year: '2015',
        content: [
            `I earned my Bachelors of Science in Biotechnology at Penn State University, with minors in Chemistry and Microbiology. Even while diving into life sciences, I stayed close to my roots in code.`,
            `During undergraduate, I assisted the university's Department of Anthropology with bioinformatic research. After college, I joined Eurofins Lancaster Labs as a Microbiologist. Trading my keyboard for a lab coat, at least temporarily.`,
        ],
    },
    {
        id: 'turning-point',
        title: 'The Turning Point',
        year: '2019',
        content: [
            `While at Eurofins, I built a custom scheduling application in Visual Basic to replace the outdated, error-prone paper system. My team was grateful and I was proud of my work. However, in doing so I came to realization that I enjoyed the coding far more than anything I was doing in the lab.`,
            `So I made the leap. I quit my job and set out to reinvent myself as a Web Developer.`,
        ],
    },
    {
        id: 'agency-roots',
        title: 'Agency Roots to Entrepreneurial Growth',
        year: '2025',
        content: [
            `I found my next chapter at Donovan Advertising, where I honed my skills in web development and design under the mentorship of seasoned creatives. I also learned about the essentials of branding, digital strategy, and marketing psychology. It was an incredible training ground and I got to work with some amazing brands & people.`,
            `But eventually, I knew it was time to build something of my own. So in 2025, I left Donovan and launched Hohman Digital LLC, a digital services company.`,
        ],
    },
];
 
// Ensure these are registered at the top of your file or app entry

function FounderTimeline() {
    const timelineRef = useRef(null);
    const lineFillRef = useRef(null);
    const sectionRefs = useRef([]);
    const stRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useGSAP(() => {
        const wrap = timelineRef.current.querySelector('.tl-wrap');
        const snapPoints = sections.map((_, i) => i / (sections.length - 1));

        gsap.set(lineFillRef.current, { scaleY: 0, transformOrigin: 'top center' });
        const clamp = gsap.utils.clamp(0, 1);
        stRef.current = ScrollTrigger.create({
            trigger: wrap,
            start: 'top center',
            end: 'bottom center',
            scrub: 2,
            // snap: {
            //     snapTo: snapPoints,
            //     duration: { min: 0.2, max: 0.5 },
            //     ease: 'power1.inOut',
            // },
            onUpdate: (self) => {
                gsap.set(lineFillRef.current, { 
                 scaleY: clamp(self.progress * 1.25) 
                });

                const idx = Math.round(self.progress * (sections.length - 1));
                setActiveIndex((prev) => (prev !== idx ? idx : prev));
            },
        });
    }, { scope: timelineRef, dependencies: [] });

    const handleClick = (index) => {
        const st = stRef.current;
        if (!st) return;

        const progress = index / (sections.length - 1);
        const scrollPos = st.start + progress * (st.end - st.start);

        gsap.to(window, {
            scrollTo: scrollPos,
            duration: 0.8,
            ease: 'power2.inOut',
        });
    };

    return (
        <div className="timeline" data-fade-stagger="1" ref={timelineRef}>
            <h2>Our History</h2>

            <div className="tl-wrap">
                <div className="tl-rail">
                    <div className="tl-line">
                        <div className="tl-line-fill" ref={lineFillRef} />
                    </div>
                    {sections.map((s, i) => (
                        <button
                            key={s.id}
                            className={`tl-node${i <= activeIndex ? ' active' : ''}`}
                            style={{ top: `${(i / (sections.length - 1)) * 100}%` }}
                            onClick={() => handleClick(i)}
                        >
                            <span className="tl-dot" />
                            <span className="tl-label">
                                <span className="tl-year">{s.year}</span>
                                <span className="tl-title">{s.title}</span>
                            </span>
                        </button>
                    ))}
                </div>

                <div className="tl-content">
                    {sections.map((s, i) => (
                        <div
                            className={`tl-section${i === activeIndex ? ' active' : ''}`}
                            key={s.id} // was s.i — bug fix
                            ref={(el) => (sectionRefs.current[i] = el)}
                        >
                            <h3>{s.title}</h3>
                            {s.content.map((p, j) => (
                                <p key={j}>{p}</p>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
