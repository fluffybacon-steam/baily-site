import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import SplitText from "gsap/dist/SplitText";
gsap.registerPlugin(SplitText);

import ScrollTrigger from "gsap/dist/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// import styles from '../src/styles/hero.module.scss';
// import Logo from './Logo';
import Scene, { fireHeroAnimation } from '@/components/Scene.js';

const HeroText = ({ text }) => {
  const titleWrapRef = useRef(null);
  const svgRef = useRef(null);
  const headlineRef = useRef(null);
  const arrowDownRef = useRef(null);

  const chevronRef = useRef(null);
  const sceneRef   = useRef(null);
//   const textTop = text || 'Hohman Digital';

  useGSAP(() => {
    //  console.log('svgRef',svgRef.current);
    if (titleWrapRef.current && headlineRef.current) {

        // const opening_animation = craftOpeningAnimation(titleWrapRef,svgRef);
        const headline_animation = craftHeadlineAnimation(headlineRef.current);

        headline_animation.then(() => {
            console.log(titleWrapRef.current.dataset);
            titleWrapRef.current.dataset.animated = 1;
        });

        headline_animation.duration(2).play();   

        // leaving_animation.duration(6).repeat(10).play();  
        
    }
  }, { scope: svgRef, dependencies: [text] });

  return (
    <div className="hero-wrapper" style={{position: 'relative', overflow: 'visible'}}>
        <Scene inset="-50% 0 0 0" onReady={({ chevron, scene }) => {
            fireHeroAnimation(chevron, scene);
        }} />
        <div ref={titleWrapRef} className={'Hero'}>
            <h1 className="text"><span>hohman</span><span>digital</span></h1>
            <div className='ball'></div>
            {/* <Logo ref={svgRef} arrowcolor='red' gradstart='white' gradstop='green' /> */}
        </div>
        <div ref={headlineRef} className="headline">
            Building 
            <div className='spinner'>
                <span>memorable</span>
                <span>digital</span>
                <span>creative</span>
                {/* <span>engaging</span>  */}
                {/* <span>impactful</span> 
                <span>premium</span> */}
            </div>
            experiences
        </div>
        <div ref={arrowDownRef} className='arrow-down'></div>
    </div>
  );
};

const craftHeadlineAnimation = (headlineEl) => {
    const fadeInDur = 0.25
    const rollInDur = 0.25;
    const hangDur = 0.75;
    const rollOutDur = 0.15;
    // const showArrowDur = 1;

    const spinner = headlineEl.querySelector('.spinner');
    const spans = spinner.querySelectorAll('span');
    const masterTimeline = gsap.timeline({ paused: true });
    //setup
    let b_span = spans[0];
    spans.forEach(span =>{
        const width = span.offsetWidth;
        console.log("span width", width);
        b_span = (width >= b_span.offsetWidth) ? span : b_span;
    })
    spinner.style.width = b_span.offsetWidth + "px";
    spinner.style.height = b_span.offsetHeight + "px";
    spans.forEach(span =>{
        span.classList.add("initialized");
        // letter spacing
        // let spacing = 0;
        // while (span.offsetWidth < b_span.offsetWidth){
        //     span.style.letterSpacing = spacing + "px";
        //     spacing += 0.01;
        // }
    });
    
    masterTimeline.add(
        gsap.fromTo(headlineEl, 
            {
                y: '100%',
                opacity: 0
            },
            {
                y: '0%',
                opacity: 1,
                ease:'Power0.out',
                duration: fadeInDur
            }
        )
    );


    spans.forEach((span, i) => {
        const tl = gsap.timeline();

        if(i == 0){
            rollOutDur * 0.50
        }

        if(i != 0){
            // size container per word
            tl.to(spinner,{
                width: span.offsetWidth,
                duration: rollInDur * 0.5,
                ease: 'linear'
            }, '0')

            tl.addLabel("rollIn");
            tl.fromTo(span, 
                {
                transform: 'rotateX(-75deg) translateY(-100%)'
                },
                {
                transform: 'rotateX(0deg) translateY(0%)',
                transformOrigin: 'top',
                duration: rollInDur * 0.75,
                ease: "circ.out"
                }, "rollIn"
            );
            tl.fromTo(span, 
                {
                scale: 0.5
                },
                {
                scale: 1,
                duration: rollInDur * 0.5,
                ease: "sine.out"
                }, "rollIn"
            );
            tl.fromTo(span, 
                {
                opacity: 0
                },
                {
                opacity: 1,
                duration: rollInDur * 0.25,
                ease: "linear"
                }, "rollIn"
            );
        }

        //skip last word
      //  console.log('test',i,spans.length - 1)
        if(i != spans.length - 1){
            tl.addLabel("rollOut", hangDur);
            tl.to(span, 
                {
                transform: 'rotateX(75deg) translateY(300%)',
                duration: rollOutDur * 0.75,
                ease: "power1.out"
                }, "rollOut"
            );
            tl.to(span, 
                {
                scale: 0.5,
                duration: rollOutDur * 1,
                ease: "sine.in"
                }, "rollOut"
            );
            tl.to(span, 
                {
                opacity: 0,
                delay: rollOutDur * 0.5,
                duration: rollOutDur * 0.25,
                ease: "linear"
                }, "rollOut"
            );
        } 

        masterTimeline.add(tl);

        // Add this span's animation to the master timeline
    });

    // masterTimeline.add(
    //     gsap.fromTo(arrowEl, 
    //         {
    //             y:-50,
    //             opacity:0,
    //             clipPath:'inset(50% 0 0 0)'
    //         },
    //         {
    //             y:0,
    //             opacity:1,
    //             duration: showArrowDur,
    //             clipPath:'inset(0% 0 0 0)',
    //             ease: 'power2.inOut'
    //         }
    //     )
    // );
  //  console.log(masterTimeline);
    // Play the master animation when needed
    return masterTimeline;
    // return leaving_animation;
}

export default HeroText;
