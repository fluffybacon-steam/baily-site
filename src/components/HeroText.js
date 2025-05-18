import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import SplitText from "gsap/dist/SplitText";
gsap.registerPlugin(SplitText);

import ScrollTrigger from "gsap/dist/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// import styles from '../src/styles/hero.module.scss';
import Logo from './Logo';

const HeroText = ({ text }) => {
  const titleWrapRef = useRef(null);
  const svgRef = useRef(null);
  const headlineRef = useRef(null);
  const arrowDownRef = useRef(null);
  const textTop = text || 'Hohman Digital';

  useGSAP(() => {
    //  console.log('svgRef',svgRef.current);
    if (svgRef.current && titleWrapRef.current && headlineRef.current && arrowDownRef.current) {

        const opening_animation = craftOpeningAnimation(titleWrapRef,svgRef);
        const leaving_animation = craftHeadlineAnimation(headlineRef.current, arrowDownRef.current);


        opening_animation.then(() => {
                leaving_animation.play();
            });
        opening_animation.duration(3).play();   

        // leaving_animation.duration(6).repeat(10).play();  
        
    }
  }, { scope: svgRef, dependencies: [text] });

  return (
    <>
        <div ref={titleWrapRef} className={'Hero'}>
            <h1 className="text">{textTop}</h1>
            <Logo ref={svgRef} arrowcolor='#000' gradstart='#8f8888' gradstop='black' />
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
        <div ref={arrowDownRef} className='arrow-down'>
            <svg
                height="20"
                viewBox="0 -960 560 800"
                width="14"
                fill="currentColor"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs
                    id="defs1" />
                <path
                    d="M 280,-160 0,-440 l 56,-57 184,184 v -287 h 80 v 287 l 184,-183 56,56 z m -40,-520 v -120 h 80 v 120 z m 0,-200 v -80 h 80 v 80 z"
                    id="path1" />
            </svg>
        </div>
    </>
  );
};

const craftHeadlineAnimation = (headlineEl, arrowEl) => {
    const fadeInDur = 0.25
    const rollInDur = 0.25;
    const hangDur = 0.75;
    const rollOutDur = 0.15;
    const showArrowDur = 1;

    const spinner = headlineEl.querySelector('.spinner');
    const spans = spinner.querySelectorAll('span');
    const masterTimeline = gsap.timeline({ paused: true });
    //setup
    let b_span = spans[0];
    spans.forEach(span =>{
        const width = span.offsetWidth;
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

    masterTimeline.add(
        gsap.fromTo(arrowEl, 
            {
                y:-50,
                opacity:0,
                clipPath:'inset(50% 0 0 0)'
            },
            {
                y:0,
                opacity:1,
                duration: showArrowDur,
                clipPath:'inset(0% 0 0 0)',
                ease: 'power2.inOut'
            }
        )
    );
  //  console.log(masterTimeline);
    // Play the master animation when needed
    return masterTimeline;
    // return leaving_animation;
}

const craftOpeningAnimation = (titleWrapRef,svgRef) =>{
    const opening_animation = gsap.timeline({
        paused:true,
    });

    const title = titleWrapRef.current.querySelector('h1');
    const group = svgRef.current.querySelector('#arrow');
    const circle = svgRef.current.querySelector('#circle1');
    const gradient = svgRef.current.querySelector('#radialGradient2');
    const line1 = svgRef.current.querySelector('#line1');
    const line2 = svgRef.current.querySelector('#line2');

    if (!circle || !gradient || !line2) {
        console.warn('Missing SVG elements!');
        return;
    }

    const lineX = parseFloat(line2.getAttribute('x'));
    const lineW = parseFloat(line2.getAttribute('width'));
    const lineY = parseFloat(line2.getAttribute('y'));
    const lineR = parseFloat(line2.getAttribute('ry'));
    const svgOriginX = lineX + lineW - lineR;
    const svgOriginY = lineY + lineR;

  //  console.log('Line attributes:', { lineX, lineW, lineY, lineR });
  //  console.log('Origin:', `${svgOriginX} ${svgOriginY}`);

    opening_animation.addLabel('first')
        .to(gradient, {
            rotate: 360,
            duration: 1.5,
            ease: "linear"
        }, 'first')
        .to(circle, {
            x: 46.2916,
            y: 46.3916,
            duration: 1.5,
            ease: "linear"
        }, 'first')
        .fromTo([line1,line2],
            {
                clipPath: `xywh(calc(-100% - 0px) 0px 100% 100%)`
            },
            {
                clipPath: `xywh(calc(0% - 4.5px)  0px 100% 100%)`,
                duration: 1.5,
                ease: "linear"
            }, 'first'
        )
        .fromTo(line2, 
            {
                opacity:0
            }, {
                opacity:1,
                ease: "linear",
                duration:0.01
            }, '>'
        )
        .fromTo(line2, {
            rotate: 45,
            scaleX: 0.8,
            svgOrigin: `${svgOriginX}px ${svgOriginY}px`
        }, {
            rotate: -45,
            scaleX: 1,
            duration: 0.75,
            delay:0.1,
            ease: "bounce.out"
        }, '>');
    
    // const svgWidth = svgRef.current.getBoundingClientRect().width;
    // const titleWidth = title.offsetWidth;
    // console.log('svgf offset',-1 * (titleWidth/2) + svgWidth);

    // const flipOffset = -1 * (titleWidth/2);
    opening_animation.addLabel('flip')
        .to(svgRef.current,
            {
                left: `0%`,
                height: '100%',
                scaleX: 0.1,
                // x:-1 * (titleWidth/2) + svgWidth,
            }, 'flip'
        )
        .to(svgRef.current,
            {
                "--clip-value": '11%',
                scaleX:-1,
                duration: 0.5,
            }, 'flip'
        )

    // tl.addLabel('text')
    //     .to(title)
    const split = new SplitText(title);
  //  console.log(split);
    const words = split.words;
    const chars = split.chars;

    // Animate each letter
    opening_animation.addLabel('letters', "-=0.15")
    opening_animation.fromTo(words, {
        x: -250,
        opacity: 0
    }, {
        // x: svgWidth * 0.5,
        opacity: 1,
        x:0,
        stagger: 0, // Add a slight delay between each letter
        duration: 0.33,
        delay:0,
        ease: "power1.out"
    }, "letters");

    opening_animation.to(svgRef.current, 
        {
            scaleY: 0.9,
            ease: "expo.out",
            duration: 1.5
        }, "letters"
    )

    opening_animation.fromTo(chars.splice(6), {
        opacity: 0,
        x: -50,
    }, {
        opacity: 1,
        // x: svgWidth * 0.5,
        x:0,
        delay:0.5,
        stagger: -0.05, // Add a slight delay between each letter
        duration: 0.1,
        ease: "linear"

    }, "letters");

    // opening_animation.fromTo(chars.splice(6), {
    //     opacity: 0,
    //     color: 'var(--background-color)',
    //     textShadow: "0px 0px 1px black",
    // }, {
    //     opacity: 1,
    //     color: 'black',
    //     // x: svgWidth * 0.5,
    //     delay:0.5,
    //     stagger: 0, // Add a slight delay between each letter
    //     duration: 0.5,
    //     ease: "linear"
        
    // }, "letters");


    // opening_animation.fromTo(chars.splice(6,chars.length), {
    //     opacity: 0,
    //     x: -50,
    // }, {
    //     opacity: 1,
    //     // x: svgWidth * 0.5,
    //     x:0,
    //     stagger: 0.1, // Add a slight delay between each letter
    //     duration: 0.1,
    //     ease: "back.out"
    // }, "letters");


  //  console.log('tl', opening_animation);
    return opening_animation
}

export default HeroText;
