import {useEffect, useState, useRef} from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import { useGSAP } from '@gsap/react';
import {page_transition} from '@/lib/helper.js';
import { useChevronScene } from '@/context/ChevronSceneContext';


console.log('page_transition',page_transition);

const AboutUs = () => {
    const articleRef = useRef(null);
    const { sceneRef, chevronRef } = useChevronScene();
    // const iconRef = useRef(null);

    useGSAP(() => {
        console.log("useGSAP running!");
        if (articleRef.current && !document.body.classList.contains("loading")) {
            articleRef.current.querySelector(".mask-animation").classList.add("play");
        } else {
            setTimeout(()=>{
                console.log("set timeout ran");
                articleRef.current.querySelector(".mask-animation").classList.add("play");
            },750);
        }

    }, { dependencies: [] })

    return(
        <article ref={articleRef}>
            <h1>About Us</h1>
            <hr />
            <figure className='right' data-fade-stagger="0">
                <div className='mask-animation'>
                    <img class='stencil' width="800" height="946" alt='picture of the founder and his dog' src='/sketch_grey_image.png' />
                    <img class='color' width="800" height="946" alt='picture of the founder and his dog' src='https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/president%26co.webp' />
                </div>
                <figcaption>President of Hohman Digital, Baily Hohman, sitting with his co-president, Buzz Boy</figcaption>
            </figure>
            <div className='content-block' data-fade-stagger="0">
                <h2>Who We Are</h2>
                <p>
                    Hi! I'm <strong>Baily</strong>, founder and president of <strong>Hohman Digital LLC</strong>. 
                    My job is bring my clients' brands & ideas to the digital world.
                    Whether its launching a new business or reinventing an existing one, 
                    we make sure its not only seen... Its remembered.
                </p>
                <p>
                    We specialize in:
                </p>
                <ul className='custom-icons'>
                    <li className='web'>Frontend & Backend Website Development</li>
                    <li className='data'>Data-driven <abbr title='Pay-Per-Click'>PPC</abbr> campaigns and <abbr title="Search Engine Optimization">SEO </abbr> strategies</li>
                    <li className='ai'>Emerging <abbr title='Generative Engine Optimization'>GEO</abbr> techniques</li>
                    <li className='app'>Android & iOS Applications</li>
                </ul>
                <p>
                    We're also growing our software development capabilities and are currently training our own AI model.
                    For the larger projects that come my way, I leverage my collaborative network of freelancers to deliver at scale.
                </p>
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
        year: '~2008',
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
 
function FounderTimeline() {
    const [activeIndex, setActiveIndex] = useState(null);
    const [direction, setDirection] = useState(0);
    const [animKey, setAnimKey] = useState(0);
 
    const handleClick = (i) => {
        if (i === activeIndex) return;
        const dir = activeIndex !== null ? Math.sign(i - activeIndex) : 1;
        setDirection(dir);
        setActiveIndex(i);
        setAnimKey((k) => k + 1);
    };
 
    const enterAnim = direction >= 0 ? 'slideInUp' : 'slideInDown';
 
    return (
        <div className='timeline' data-fade-stagger="1">
            <h2>Meet the Founder</h2>

            <div className="tl-wrap">
                <div className="tl-rail">
                    <div className="tl-line" />
                    {sections.map((s, i) => (
                        <button
                            key={s.id}
                            className={`tl-node${i === activeIndex ? ' active' : ''}`}
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
                    {activeIndex !== null ? (
                        <div className="tl-section" key={animKey} style={{ animationName: enterAnim }}>
                            <h3>{sections[activeIndex].title}</h3>
                            {sections[activeIndex].content.map((p, j) => (
                                <p key={j}>{p}</p>
                            ))}
                        </div>
                    ) : (
                        <p className="tl-prompt">← Select a milestone to explore</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// function page_transition(articleRef, title_icon_offset = 25 ){
//     const coverup = document.querySelector('#coverup');
//     const transition_icon = coverup.querySelector('.icon-wrapper');
//     if(transition_icon){
//         // transition_icon?.remove();
//         const heading = articleRef.current.querySelector("h1");
//         const article_elements = Array.from(heading.parentNode.children).filter(
//             (el) => el !== heading
//         );
//         console.log("setup timeline");
//         const page_in_tl = gsap.timeline({
//             paused:true
//         })

//         //set stage
//         page_in_tl.set('#coverup', {
//                 opacity: 0
//             }, 0);

//         return page_in_tl;
//     }
// }