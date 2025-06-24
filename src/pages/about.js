import {useEffect, useRef} from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import { useGSAP } from '@gsap/react';
import {page_transition} from '@/lib/helper.js';

console.log('page_transition',page_transition);

const AboutUs = () => {
    const articleRef = useRef(null);
    // const iconRef = useRef(null);

    useGSAP(() => {
        console.log("useGSAP running!");
        if(articleRef.current 
            // && articleRef.current.classList.contains("loading")
        ){
            console.log("fetching animation to play...");
            // articleRef.current.classList.remove("loading");
            const page_in_tl = page_transition(articleRef);
            console.log("page_in_tl",page_in_tl); 
            if(page_in_tl){
                page_in_tl.duration(2).play();
            }
        }

    }, { dependencies: [] })

    return(
        <article ref={articleRef} className="loading">
            <h1>About Us</h1>
            <hr />
            <figure class='right'>
                <img width="800" height="946" alt='picture of the founder and his dog' src='https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/president%26co.webp' />
                <figcaption>President of Hohman Digital, Baily Hohman, sitting with his co-president, Buzz Boy</figcaption>
            </figure>
            <div class='content-block'>
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
                <ul class='custom-icons'>
                    <li class='web'>Frontend & Backend Website Development</li>
                    <li class='data'>Data-driven <abbr title='Pay-Per-Click'>PPC</abbr> campaigns and <abbr title="Search Engine Optimization">SEO </abbr> strategies</li>
                    <li class='ai'>Emerging <abbr title='Generative Engine Optimization'>GEO</abbr> techniques</li>
                    <li class='app'>Android & iOS Applications</li>
                </ul>
                <p>
                    We're also growing our software development capabilities and are currently training our own AI model.
                    For the larger projects that come my way, I leverage my collaborative network of freelancers to deliver at scale.
                </p>
            </div>
            <div class='content-block'>
                <h2>Meet the Founder</h2>
                <h3>The Curious Coder</h3>
                <p>
                    I first began writing code around the age of 11. 
                    This first consisted of simple Batch scripts, motivated by a desire to understand computers at their core. 
                    Naturally, the scope of these home projects grew and a skill developed.
                    By the time I graduated Highschool, I was developing full Windows applications in C# and designing basic websites in HTML & CSS.
                    My parents assumed I would pursue Comp Sci in College, but my growing curiosity for anatomy took me in a different direction.
                </p>
                <h3>The Scientist Years</h3>
                <p>
                    I earned my Bachelors of Science in Biotechnology at Penn State University, with minors in Chemistry and Microbiology.
                    Even while diving into life sciences, I stayed close to my roots in code.
                </p>
                <p>
                    During undergraduate, I assisted the university's Department of Anthropology with 
                    <a href='https://academic.oup.com/gbe/article/9/7/1978/4037174' rel='nofollow'> bioinformatic research.</a> After college, I joined <strong>Eurofins Lancaster Labs</strong> as a Microbiologist. Trading my keyboard for a lab coat, at least temporarily.
                </p>
                <h3>The Turning Point</h3>
                <p>
                    While at Eurofins, I built a custom scheduling application in Visual Basic to replace the outdated, error-prone paper system.
                    My team was grateful and I was proud of my work.
                    However, in doing so I came to realization that I enjoyed the coding far more than anything I was doing in the lab.</p>
                <p>
                    So I made the leap. I quit my job and set out to reinvent myself as a Web Developer.
                </p>
                <h3>Agency Roots to Entrepreneurial Growth</h3>
                <p>
                    I found my next chapter at <a href='https://donovanadv.com/'>Donovan Advertising,</a> 
                    where I honed my skills in web development and design under the mentorship of seasoned creatives. 
                    I also learned about the essentials of branding, digital strategy, and marketing psychology. 
                    It was an incredible training ground and I got to work with some amazing brands & people. 
                </p>
                <p>
                    But eventually, I knew it was time to build something of my own. 
                    So in 2025, I left Donovan and launched Hohman Digital LLC, a digital services company. 
                </p>
            </div>
        </article>
    )   
}
export default AboutUs;

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