import Head from 'next/head'
import Image from 'next/image'
import { Red_Rose } from 'next/font/google'
import styles from '@/styles/Home.module.scss'
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import HeroText from '@/components/HeroText';
import { useRouter } from 'next/router';
import ScrollTrigger from "gsap/dist/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const rose = Red_Rose({
  weight: 'variable',  // You can define a range of font weights (e.g., 100 to 900)
  style: 'normal',    // You can define the font style (e.g., normal, italic)
  subsets: ['latin'],
})

export default function Home() {
  const navRef = useRef(null);
//  console.log("Home render");

  useEffect(()=>{
  //  console.log('navRef.current.children',navRef.current?.children);
    if(navRef.current && navRef.current.querySelectorAll('a').length === 4 && !navRef.current.classList.contains('initialized')){
    //  console.log("trigger animate",navRef.current, !navRef.current.classList.contains('initialized'));
      animateNav(navRef.current);
    }
  },[navRef])

  return (
    <>
        <HeroText text={'Hohman Digital'}/>
        <div className='animated-nav' ref={navRef}>
          <NavItem
            number={1}
            styles={styles}
            url="/about"
            title="About"
            excerpt="Learn about me and all the hats I wear"
            icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z"/></svg>}
            grid_area="1 / 1 / 2 / 2"
          />
          <NavItem 
            number={2}
            styles={styles}
            url="/portfolio"
            title="Portfolio"
            icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z"/></svg>}
            excerpt="Take a look at the things I've done"
            grid_area="1 / 2 / 2 / 3"
          />
          <NavItem 
            number={3}
            styles={styles}
            url="/services"
            title="Services"
            icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M756-120 537-339l84-84 219 219-84 84Zm-552 0-84-84 276-276-68-68-28 28-51-51v82l-28 28-121-121 28-28h82l-50-50 142-142q20-20 43-29t47-9q24 0 47 9t43 29l-92 92 50 50-28 28 68 68 90-90q-4-11-6.5-23t-2.5-24q0-59 40.5-99.5T701-841q15 0 28.5 3t27.5 9l-99 99 72 72 99-99q7 14 9.5 27.5T841-701q0 59-40.5 99.5T701-561q-12 0-24-2t-23-7L204-120Z"/></svg>}
            excerpt="All the things I can do & provide"
            grid_area="2 / 1 / 3 / 2"
          />
          <NavItem 
            number={4}
            styles={styles}
            url="/blog"
            title="Blog"
            icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h440l200 200v440q0 33-23.5 56.5T760-120H200Zm0-80h560v-400H600v-160H200v560Zm80-80h400v-80H280v80Zm0-320h200v-80H280v80Zm0 160h400v-80H280v80Zm-80-320v160-160 560-560Z"/></svg>}
            excerpt="Collection of my thoughts and 2 cents"
            grid_area="2 / 2 / 3 / 3"
          />
        </div>
        <div style={{height: '300px'}}></div>
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


  const handleClick = (event, props) => {
  //  console.log("handleClick",event,props);
    event.preventDefault();
    router.push(props.url);
    // navItemToPageAnimation(props.number, props.url);
  }

  function navItemToPageAnimation(number, url){
    [BoxTop.current, BoxRight.current, BoxLeft.current, BoxBottom.current].forEach((box) => {
      if (box) {
        box.style.opacity = '0'; // Set final opacity
      }
    });

    // Set border widths
    if (linkRef.current) {


      const icon = linkRef.current.querySelector('.icon-wrapper');
      const main = document.querySelector('main');
      const masthead = document.querySelector('#masthead');

      const iconRect = icon.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const mastRect = masthead.getBoundingClientRect();

      const cloneIcon = icon.cloneNode(true);

      console.log('iconRect',iconRect);

      const magicNum = 0;

      gsap.set(cloneIcon,
        {
          position: 'fixed',
          top  : `${iconRect.top - magicNum}px`,
          left : `${iconRect.left}px`,
          height: `${iconRect.height}px`,
          // opacity: 0
        }
      )
      gsap.set(cloneIcon.querySelector('svg'),
        {
          height:  `100%`,
          width: 'auto',
        }
      )

      document.querySelector('#__next').appendChild(cloneIcon);


      const to_page_tl = gsap.timeline({ 
        paused: true,
        onComplete: (e) => {
          console.log('onComplete',e, router, url);
          router.push(url, undefined, { shallow: true });
        }
      });
      
      to_page_tl.to(document.querySelector('main'),{
        opacity: 0,
        duration: 0.5
      }, 'fade')


      to_page_tl.to(cloneIcon,{
        opacity: 1,
        marginTop: '1rem',
        height: '100px',
        left: `${mainRect.left}px`,
        top: `${mastRect.height}px`,
        duration:2,
        ease: 'power1.inOut'
      }, 'move')

      to_page_tl.to(cloneIcon,{
        rotation: -15,
        duration: 1.5,
        ease: 'expo.inOut'
      }, 'move-=0.5')

      .to(cloneIcon, {
        rotation:  2,
        duration:   1,
        ease:      'none'
      }, 'move+=1')

      .to(cloneIcon, {
        rotation:  0,
        duration:   0.5,
        ease:      'none'
      },);

      router.push(url);

      // to_page_tl.duration(2).play();

    }
    
  }

//  console.log(props);

  return (
    <>
      <Link 
        ref={linkRef}
        href={props.url} 
        data-num={props.number} 
        style={{gridArea:props.grid_area}}
        // onClick={(e) => handleClick(e,props)}
      >
        <h2>
          {props.title}
        </h2>
        <div className='icon-wrapper'>{props.icon}</div>
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

  let tl = gsap.timeline({
    paused:true,
    scrollTrigger: {
      markers:true,
      trigger: nav,
      pin: true, 
      start: "top 25%", 
      end: `+=500`, 
      scrub: 1, 
      // anticipatePin: 1
    },
  });

  const borderGirth = getPropertyValue(nav, '--padding');
  const gridGap = getPropertyValue(nav, '--gap');

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
    Boxes1[1].style.width = borderGirth/2;
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
        width: borderGirth/2
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: borderGirth,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes1[2].classList.contains('animated')){
    Boxes1[2].classList.add('animated');
    Boxes1[2].style.placeSelf = 'end start';
    Boxes1[2].style.height =  borderGirth/2;
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
        height: borderGirth/2
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: borderGirth,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes2[3].classList.contains('animated')){
    Boxes2[3].classList.add('animated');
    Boxes2[3].style.placeSelf = 'start start';
    Boxes2[3].style.width = borderGirth/2;
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
        width: borderGirth/2
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: borderGirth,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes2[2].classList.contains('animated')){
    Boxes2[2].classList.add('animated');
    Boxes2[2].style.placeSelf = 'end end';
    Boxes2[2].style.height =  borderGirth/2;
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
        height: borderGirth/2
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: borderGirth,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes3[0].classList.contains('animated')){
    Boxes3[0].classList.add('animated');
    Boxes3[0].style.placeSelf = 'start start';
    Boxes3[0].style.height =  borderGirth/2;
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
        height: borderGirth/2
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: borderGirth,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes3[1].classList.contains('animated')){
    Boxes3[1].classList.add('animated');
    Boxes3[1].style.placeSelf = 'end end';
    Boxes3[1].style.width = borderGirth/2;
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
        width: borderGirth/2
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: borderGirth,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes4[0].classList.contains('animated')){
    Boxes4[0].classList.add('animated');
    Boxes4[0].style.placeSelf = 'start end';
    Boxes4[0].style.height =  borderGirth/2;
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
        height: borderGirth/2
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        height: borderGirth,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  }
  if(!Boxes4[3].classList.contains('animated')){
    Boxes4[3].classList.add('animated');
    Boxes4[3].style.placeSelf = 'end start';
    Boxes4[3].style.width = borderGirth/2;
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
        width: borderGirth/2
        //translate:`${0}px -${box_offset.top}px`,
      },
      { 
        width: borderGirth,
        //translate:`0px 0px`,
        ease:'none',
      }
    ), 'gap'
    );
  //  console.log(gridGap);
    tl.add(gsap.to('.animated-nav', {gap: gridGap}),'gap');
    tl.add(gsap.to('.animated-nav a', {opacity: 1}),'gap');
    // tl.add(gsap.to('.animated-nav a', { '--gap': 0 }),'gap');
    // tl.add(gsap.to('.animated-nav a', { height:'calc(100% + var(--gap))', width:'calc(100% + var(--gap))', ease:'steps(1)'}),'gap');
    // tl.add(gsap.to('.animated-nav a', { opacity: 1, ease:'linear'}));
  }

  //Gap
  if(tl.labels == {}){
    tl.destroy();
  } else {
    tl.to({}, { duration: 2});
  }

  return tl;
}


function getPropertyValue(element, property_name) {
  const styles = getComputedStyle(element);
  return styles.getPropertyValue(property_name).trim();
}