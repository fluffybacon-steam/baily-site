
// File: components/Footer.js
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {useRef} from 'react';

import MotionPathHelper from 'gsap/dist/MotionPathHelper';
gsap.registerPlugin(MotionPathHelper) 

import MotionPathPlugin from 'gsap/dist/MotionPathPlugin';
gsap.registerPlugin(MotionPathPlugin);

import ScrollTrigger from "gsap/dist/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

import HomeLogo  from '../../src/icons/home.svg';
import FacebookIcon  from '../../src/icons/instagram.svg';
import InstagramIcon from '../../src/icons/facebook.svg';
import LinkedInIcon  from '../../src/icons/LinkedIn.svg';
import GitHubIcon from '../../src/icons/github.svg';
import FooterLogo  from '../../src/icons/footer-logo.svg';

// console.log('BrandLogo',BrandLogo);
const socials=[
    // {
    //     text : 'facebook',
    //     link : '',
    //     icon : FacebookIcon,
    // }, 
    // {
    //     text : 'instagram',
    //     link : '',
    //     icon : InstagramIcon,
    // },
    {
        text : "linkedIn",
        link: '',
        icon: LinkedInIcon
    }, 
    {
        text : "github",
        link: '',
        icon: GitHubIcon
    }
]

export default function Footer() {
  return (
    <footer id='colophon'>
        {/* <SocialCircle 
            socials={[
                {
                    text : 'facebook',
                    link : '',
                    icon : FacebookIcon,
                }, 
                {
                    text : 'instagram',
                    link : '',
                    icon : InstagramIcon,
                },
                {
                    text : "linkedIn",
                    link: '',
                    icon: LinkedInIcon
                }, 
                {
                    text : "github",
                    link: '',
                    icon: GitHubIcon
                }
            ]}
        /> */}
        <div className="footer-menu">
            <div class='links'>
                <Link
                    href='/privacy'
                    target="_self" 
                    rel="noopener noreferrer" 
                    className='social-link'
                    aria-label="home"
                >
                    Privacy Policy
                </Link>
            </div>
            <div class='socials'>
                {socials.map((social, i) => {
                    return (
                        <a 
                            key={i} 
                            href={social.link || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className='social-link'
                            aria-label={social.text}
                        >
                        <social.icon />
                        </a>
                    );
                })}
            </div>
        </div>
        <div className='text-wrapper'>
            <div className='contact-info'>
                <a className='email' href='mailto:baily@hohmandigital.com'>baily@hohmandigital.com</a>
                <a className='phone' href='tel:+17178750386'>(717) 875-0386</a>
            </div>
            {/* <div className='copyright'>© Copyright 2026 Hohman Digital LLC</div> */}
            <Link
                    href='/'
                    target="_self" 
                    rel="noopener noreferrer" 
                    className='social-link'
                    aria-label="home"
                >
                <FooterLogo id='footerLogo' viewBox="0 0 882 162"/>
            </Link>
        </div>
    </footer>
  )
}

const SocialCircle = ({socials}) =>{
    const elevatorRef = useRef(null);
    const pathRef = useRef(null);
    const footerRef = useRef(null);
    // const testRef = useRef(null);
    const count = socials.length;
    const spacing = 33 / count; // simple equal spacing

    // useGSAP(()=>{

    //     const expandDur = 0.5;
    //     // const overlap = 0.5;
    //     const rollDur = 2;

    //     // console.log('LOOK AT ME',socials);
    //     if(pathRef.current && !pathRef.current.parentNode.classList.contains('animated') && socials.length > 0){
    //     //    const shrink = document.querySelector('#colophon .text-wrapper');
    //        const socials_links = document.querySelectorAll('.social-link');
    //     //    const expand_tl = gsap.timeline({
    //     //     //    paused: true,
    //     //     //    repeat:20,
    //     //        scrollTrigger: {
    //     //            trigger: pathRef.current.parentElement,
    //     //            start: "top 80%",
    //     //            end: "center 70%",
    //     //            scrub: false,
    //     //            markers:false,
    //     //            toggleActions: 'play none none none',
    //     //        },
    //     //    })
    //        const footer_tl = gsap.timeline({
    //         //    repeat:20,
    //            scrollTrigger: {
    //                trigger: pathRef.current.parentElement.parentElement.parentElement,
    //                start: "center bottom",
    //                end: "bottom bottom",
    //                scrub: 1,
    //             //    markers:true,
    //                toggleActions: 'play none none none',
    //             },
    //             onComplete: () => {
    //                 console.log("pathRef.current.parentNode.",pathRef.current.parentNode);
    //                 pathRef.current.parentNode.classList.add("animated");
    //             }
    //        })
    //     //    footer_tl.addLabel('expand',0).addLabel('rollOut',expandDur * overlap);
           
           

    //        footer_tl.to(pathRef.current, {
    //            attr: {
    //                d: `
    //                M0,100 C0,0 100,0 100,100
    //                `,
    //             },
    //             duration: expandDur,
    //         },0);
            
    //         // footer_tl.fromTo(shrink,{
    //         //     height: "200%"
    //         // },{
    //         //     height: "100%",
    //         //     duration: expandDur,
    //         // },0)
                    
    //         let flip_flag = false;
    //         let degree_spacing = 1.5;
    //         socials_links.forEach((social, index) =>{
                
    //             if(index === 0 ) {
    //                 //only pull up
    //                 footer_tl.to(socials_links[0],{
    //                     motionPath: {
    //                         path: elevatorRef.current,
    //                         align: elevatorRef.current,
    //                         alignOrigin: [0.5, 0.5],
    //                         start:0,
    //                         end:1,
    //                     },
    //                     zIndex: 1,
    //                     scale:1.25,
    //                     duration: expandDur,
    //                 },0);
    //             } else {
    //                 //roll down sites
    //                 let offset;
    //                 if(flip_flag){
    //                     offset = -(spacing * degree_spacing);
    //                     degree_spacing += degree_spacing;
    //                     flip_flag = false;
    //                 } else {
    //                     offset = spacing * degree_spacing;
    //                     flip_flag = true;
    //                 }
    //                 offset = offset/100;
    //                 console.log(index,offset);

    //                 // footer_tl.set(social,{
    //                 //     opacity:0,
    //                 // });

    //                 footer_tl.fromTo(social,
    //                     {
    //                        opacity:0, 
    //                     },{
    //                     opacity:1,
    //                     duration:0,
    //                     ease:"steps(1)"
    //                 },expandDur);
    //                 footer_tl.to(social,{
    //                     motionPath: {
    //                         path: '#finalPath',
    //                         align: '#finalPath',
    //                         alignOrigin:[0.5,0.5],
    //                         start:0.5,
    //                         end:0.5 + offset
    //                     },
    //                     ease: 'power3.out',
    //                     duration: rollDur,
    //                 },expandDur);
                    
    //             }
    //         })

    //         footer_tl.duration(3);
    //     }
    // }, { scope: footerRef, dependencies: [socials] })


    return(
        <div className='social-circle' ref={footerRef}>
            <svg preserveAspectRatio='none' viewBox="0 0 100 100" version="1.1" id='shape'>
                <circle id='my_dom_element' rx="3" ry="3"></circle>
                <path id='finalPath' fill="transparent" stroke="transparent" strokeWidth="1" d="
                        M0,100 C0,0 100,0 100,100
                        " 
                />
                <path ref={pathRef} fill="var(--footer-background)" stroke="transparent" strokeWidth="1" d="
                        M0,100 C0,100 100,100 100,100
                        " 
                />
                <path 
                    ref={elevatorRef}
                    strokeWidth="1"
                    stroke="transparent"
                    d="
                        m 50,100
                        V 25
                    " 
                />
            </svg>
            <Link
                href='/'
                target="_self" 
                rel="noopener noreferrer" 
                className='social-link'
                aria-label="home"
            >
                {/* <img src={BrandLogo} /> */}
                <HomeLogo />
            </Link>
            {socials.map((social, i) => {
                return (
                    <a 
                        key={i} 
                        href={social.link || "#"} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className='social-link'
                        aria-label={social.text}
                    >
                       <social.icon />
                    </a>
                );
            })}
        </div>
    )
}
