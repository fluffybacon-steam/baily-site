import Head from 'next/head'
import Image from 'next/image'
import { Red_Rose } from 'next/font/google'
import styles from '@/styles/Home.module.scss'
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import HeroText from '../../components/HeroText';
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { useRouter } from 'next/router';
gsap.registerPlugin(ScrollTrigger);

const rose = Red_Rose({ subsets: ['latin'] })

export default function Home() {
  const navRef = useRef(null);
  console.log("Home render");

  useEffect(()=>{
    console.log('navRef.current.children',navRef.current?.children);
    if(navRef.current && navRef.current.querySelectorAll('a').length === 4 && !navRef.current.classList.contains('initialized')){
      console.log("trigger animate",navRef.current, !navRef.current.classList.contains('initialized'));
      animateNav(navRef.current);
    }
  },[navRef])

  return (
    <>
      <main className={`${styles.main} ${rose.className}`}>
          <HeroText text={'Example'}/>
          <nav ref={navRef}>
            <NavItem
              number={1}
              styles={styles}
              url="/about"
              title="About"
              excerpt="Learn about me and the hats I wear"
              grid_area="1 / 1 / 2 / 2"
            />
            <NavItem 
              number={2}
              styles={styles}
              url="/portfolio"
              title="Portfolio"
              excerpt="Take a look at the things I've done"
              grid_area="1 / 2 / 2 / 3"
            />
            <NavItem 
              number={3}
              styles={styles}
              anchor="/printing"
              title="3D Printing"
              excerpt="Model design and plastic extruding"
              grid_area="2 / 1 / 3 / 2"
            />
            <NavItem 
              number={4}
              styles={styles}
              anchor="/connect"
              title="Connect"
              excerpt="Let's chat"
              grid_area="2 / 2 / 3 / 3"
            />
          </nav>
          <div style={{'height' : '500px'}}></div>
      </main>
    </>
  )
}
const NavItem = (props) => {
  const router = useRouter();

  const linkRef = useRef(null);
  const BoxTop = useRef(null);
  const BoxRight = useRef(null);
  const BoxBottom = useRef(null);
  const BoxLeft = useRef(null);

  useEffect(() => {
    const viewport = {
      'width' : window.innerWidth,
      'height' : window.innerHeight
    }
    const boxport = {
      'width' : document.querySelector('nav > a').clientWidth,
      'height' : document.querySelector('nav > a').clientHeight,
    }

    return () => {
      console.log("unmount");
      //tl.destroy();
    }
  },[]);

  const handleClick = (event, props) => {
    console.log("handleClick",event,props);
    event.preventDefault();
    navItemToPageAnimation(props.number, props.url);
  }

  function navItemToPageAnimation(number, url){
    [BoxTop.current, BoxRight.current, BoxLeft.current, BoxBottom.current].forEach((box) => {
      if (box) {
        box.style.opacity = '0'; // Set final opacity
      }
    });
    
    // Set border widths
    if (linkRef.current) {
      linkRef.current.style.borderWidth = `var(--padding)`;
      linkRef.current.style.padding = `calc(var(--padding) * 1)`;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
  
      // Get the element's bounding rectangle and dimensions
      const rect = linkRef.current.getBoundingClientRect();
      const elementWidth = rect.width;
      const elementHeight = rect.height;

      const targetX = (viewportWidth - elementWidth) / 2 - rect.left;
      const targetY = (viewportHeight - elementHeight) / 2 - rect.top;

      //Freeze scroll
      document.body.style.overflow = 'hidden';
  
      const tl = gsap.timeline({
        duration:0.25,
        onComplete: (e) => {
          console.log('onComplete',e, router, url);
          router.push(url);
        }
      });
      tl.to(linkRef.current,{
        x:targetX,
        y:targetY,
        scaleX: -1,
      }, 0);
      tl.to(linkRef.current.querySelectorAll('*'), {
        opacity:0,
        duration:0
      }, '<');
      //Magic number 8 (0.33 of 1em);
      const magicNum = parseFloat(getPropertyValue(document.body, 'font-size')) * 0.33;
      tl.to(linkRef.current, {
        width:`calc(200% + 1em)`,
        x:targetX - magicNum,
      }, '<');
    }
    
  }

  return (
    <>
      <Link 
        ref={linkRef}
        href={'#'} 
        data-num={props.number} 
        style={{gridArea:props.grid_area}}
        onClick={(e) => handleClick(e,props)}
      >
        <h2>{props.title}</h2>
        <p>{props.excerpt}</p>
      </Link>
      <div ref={BoxTop} data-num={props.number} className={`${props.styles["shadowBox"]} ${props.styles["shadowBox-top"]}`} style={{ gridArea: props.grid_area }}></div>
      <div ref={BoxRight} data-num={props.number} className={`${props.styles["shadowBox"]} ${props.styles["shadowBox-right"]}`} style={{ gridArea: props.grid_area }}></div>
      <div ref={BoxBottom} data-num={props.number} className={`${props.styles["shadowBox"]} ${props.styles["shadowBox-bottom"]}`} style={{ gridArea: props.grid_area }}></div>
      <div ref={BoxLeft} data-num={props.number} className={`${props.styles["shadowBox"]} ${props.styles["shadowBox-left"]}`} style={{ gridArea: props.grid_area }}></div>
    </>
  )
}

const animateNav = (nav) =>{
  nav.classList.add("initialized");

  const dur = 0.25;
  let tl = gsap.timeline({
    paused:true,
    scrollTrigger: {
      markers:true,
      trigger: nav,
      pin: true, 
      start: "top 25%", 
      end: `+=200`, 
      scrub: 1, 
      // anticipatePin: 1
    },
  });



  const Boxes1 = nav.querySelectorAll('div[data-num="1"]');
  const Boxes2 = nav.querySelectorAll('div[data-num="2"]');
  const Boxes3 = nav.querySelectorAll('div[data-num="3"]');
  const Boxes4 = nav.querySelectorAll('div[data-num="4"]');
  ///Top
  if(!Boxes1[0].classList.contains('animated')){
    Boxes1[0].classList.add('animated');
    Boxes1[0].style.placeSelf = 'start end';
    tl.add(gsap.fromTo(Boxes1[0], 
      { 
        width:`0%`,
        //translate:`-${box_offset.left}px -${box_offset.top}px`,
      },
      { 
        width: `100%`, 
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'top',
    );
  }
  if(!Boxes2[0].classList.contains('animated')){
    Boxes2[0].classList.add('animated');
    Boxes2[0].style.placeSelf = 'start start';
    tl.add(gsap.fromTo(Boxes2[0], 
      { 
        width:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'top'
    );
  }
  //Top Sides
  if(!Boxes1[3].classList.contains('animated')){
    Boxes1[3].classList.add('animated');
    Boxes1[3].style.placeSelf = 'start start';
    tl.add(gsap.fromTo(Boxes1[3], 
      { 
        height:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'top-side'
    );
  }
  if(!Boxes2[1].classList.contains('animated')){
    Boxes2[1].classList.add('animated');
    Boxes2[1].style.placeSelf = 'start end';
    tl.add(gsap.fromTo(Boxes2[1], 
      { 
        height:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'top-side'
    );
  }
  //Bottom-side
  if(!Boxes3[3].classList.contains('animated')){
    Boxes3[3].classList.add('animated');
    Boxes3[3].style.placeSelf = 'start start';
    tl.add(gsap.fromTo(Boxes3[3], 
      { 
        height:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'bottom-side'
    );
  }
  if(!Boxes4[1].classList.contains('animated')){
    Boxes4[1].classList.add('animated');
    Boxes4[1].style.placeSelf = 'start end';
    tl.add(gsap.fromTo(Boxes4[1], 
      { 
        height:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'bottom-side'
    );
  }
  //Bottom
  if(!Boxes3[2].classList.contains('animated')){
    Boxes3[2].classList.add('animated');
    Boxes3[2].style.placeSelf = 'end start';
    tl.add(gsap.fromTo(Boxes3[2], 
      { 
        width:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'bottom'
    );
  }
  if(!Boxes4[2].classList.contains('animated')){
    Boxes4[2].classList.add('animated');
    Boxes4[2].style.placeSelf = 'end end';
    tl.add(gsap.fromTo(Boxes4[2], 
      { 
        width:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'bottom'
    );
  }
  //inner
  if(!Boxes1[1].classList.contains('animated')){
    Boxes1[1].classList.add('animated');
    Boxes1[1].style.width ='5px';
    Boxes1[1].style.placeSelf = 'start end';    tl.add(gsap.fromTo(Boxes1[1], 
      { 
        height:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'inner'
    );
    tl.add(gsap.fromTo(Boxes1[1], 
      { 
        width:'5px'
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width:'10px',
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes1[2].classList.contains('animated')){
    Boxes1[2].classList.add('animated');
    Boxes1[2].style.placeSelf = 'end start';
    Boxes1[2].style.height = '5px';
    tl.add(gsap.fromTo(Boxes1[2], 
      { 
        width:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'inner'
    );
    tl.add(gsap.fromTo(Boxes1[2], 
      { 
        height:'5px'
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height:'10px',
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes2[3].classList.contains('animated')){
    Boxes2[3].classList.add('animated');
    Boxes2[3].style.placeSelf = 'start start';
    Boxes2[3].style.width ='5px';
    tl.add(gsap.fromTo(Boxes2[3], 
      { 
        height:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'inner'
    );
    tl.add(gsap.fromTo(Boxes2[3], 
      { 
        width:'5px'
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width:'10px',
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes2[2].classList.contains('animated')){
    Boxes2[2].classList.add('animated');
    Boxes2[2].style.placeSelf = 'end end';
    Boxes2[2].style.height = '5px';
    tl.add(gsap.fromTo(Boxes2[2], 
      { 
        width:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'inner'
    );
    tl.add(gsap.fromTo(Boxes2[2], 
      { 
        height:'5px'
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height:'10px',
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes3[0].classList.contains('animated')){
    Boxes3[0].classList.add('animated');
    Boxes3[0].style.placeSelf = 'start start';
    Boxes3[0].style.height = '5px';
    tl.add(gsap.fromTo(Boxes3[0], 
      { 
        width:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'inner'
    );
    tl.add(gsap.fromTo(Boxes3[0], 
      { 
        height:'5px'
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height:'10px',
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes3[1].classList.contains('animated')){
    Boxes3[1].classList.add('animated');
    Boxes3[1].style.placeSelf = 'end end';
    Boxes3[1].style.width ='5px';
    tl.add(gsap.fromTo(Boxes3[1], 
      { 
        height:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'inner'
    );
    tl.add(gsap.fromTo(Boxes3[1], 
      { 
        width:'5px'
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width:'10px',
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes4[0].classList.contains('animated')){
    Boxes4[0].classList.add('animated');
    Boxes4[0].style.placeSelf = 'start end';
    Boxes4[0].style.height = '5px';
    tl.add(gsap.fromTo(Boxes4[0], 
      { 
        width:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'inner'
    );
    tl.add(gsap.fromTo(Boxes4[0], 
      { 
        height:'5px'
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height:'10px',
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes4[3].classList.contains('animated')){
    Boxes4[3].classList.add('animated');
    Boxes4[3].style.placeSelf = 'end start';
    Boxes4[3].style.width ='5px';
    tl.add(gsap.fromTo(Boxes4[3], 
      { 
        height:`0%`,
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: `100%`,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'inner'
    );
    tl.add(gsap.fromTo(Boxes4[3], 
      { 
        width:'5px'
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width:'10px',
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
    tl.add(gsap.to('nav', {gap:'1em'}),'gap');
    tl.add(gsap.to('nav a', {opacity:'1'}),'gap');
  }

  //Gap
  if(tl.labels == {}){
    tl.destroy();
  } else {
    //tl.duration(2);
    //tl.play();
  }
  return tl;
}


function getPropertyValue(element, property_name) {
  const styles = getComputedStyle(element);
  return styles.getPropertyValue(property_name).trim();
}