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

import BrandLogo from '../../src/icons/brand-logo.svg';
import FacebookIcon from '../../src/icons/instagram.svg';
import InstagramIcon from '../../src/icons/facebook.svg';

console.log('BrandLogo',BrandLogo);

export default function Footer() {
  return (
    <footer id='colophon'>
        <SocialCircle 
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
                }
            ]}
        />
        <div className='contact-info'>
            <a className='email' href='mailto:baily@hohmandigital.com'>baily@hohmandigital.com</a>
            <a className='phone' href='tel:+17174550894'>(717) 455-0894</a>
            <div className='copyright'>© Copyright 2025 Hohman Digital LLC</div>
        </div>
    </footer>
  )
}

const SocialCircle = ({socials}) =>{
    const pathRef = useRef(null);
    const count = socials.length;
    const spacing = 75 / count; // simple equal spacing

    useGSAP(()=>{
        const expandDur = 1;
        const rollDur = 5;

        console.log('LOOK AT ME',socials);
        if(pathRef.current && socials.length > 0){
           console.log(pathRef.current,pathRef.current.parentElement);
            
           const footer_tl = gsap.timeline({
               scrollTrigger: {
                   trigger: pathRef.current.parentElement,
                   start: "top bottom",
                   end: "bottom bottom",
                   scrub: false,
                   markers:true,
                   toggleActions: 'play none none none'

               },
           })
           footer_tl.addLabel('expand').addLabel('rollOut')
           
           const socials_links = document.querySelectorAll('.social-link');

           footer_tl.to(socials_links[0],{
                       motionPath: {
                           path: pathRef.current,
                           align: pathRef.current,
                           alignOrigin: [0.5, 0.5],
                           start:0,
                           end:0.75,
                       },
                       duration: 1,
                   });
           
           footer_tl.to(pathRef.current, {
               attr: {
                   d: `
                   m 0,100
                   h 100
                   c 0,0 -50,-100 -100,0
                   z
                   `,
                },
                duration: expandDur,
            });
            
            
                    
            // let flip_flag = false;
            // let degree_spacing = 1;
            // socials_links.forEach((social, index) =>{
            //     if(index === 0) {
            //         //only pull up
            //     } else {
            //         //roll down sites
            //         let offset;
            //         if(flip_flag){
            //             offset = -(spacing * degree_spacing);
            //             degree_spacing += 1;
            //             flip_flag = false;
            //         } else {
            //             offset = spacing * degree_spacing;
            //             flip_flag = true;
            //         }
            //         console.log(index,offset);
    
            //         footer_tl.to(social,{
            //             motionPath: {
            //                 path: "M0,100 Q50,0 100,100",
            //                 align: pathRef.current,
            //                 alignOrigin: [0.5, 0],
            //                 start:0.5,
            //                 end:0.5 + offset,
            //             },
            //             // transformOrigin: "50% 50%",
            //             duration: rollDur,
            //         }, 'rollOut');
            //     }

            //     footer_tl.to(social,{
            //         motionPath: {
            //             path: '#lineUp',
            //             align: '#lineUp',
            //             alignOrigin: [0.5, 0],
            //             start:0,
            //             end: 1
            //             // end:0.5 + offset,
            //         },
            //         duration: expandDur,
            //     }, 'expand');
                


            //     // MotionPathHelper.create(tween);
            // });
        }
    }, { scope: pathRef, dependencies: [socials] })


    return(
        <div className='social-circle'>
            <svg preserveAspectRatio='none' viewBox="0 0 100 100" version="1.1" id='shape'>
                <path ref={pathRef} fill="#2b7d00" stroke="#f01616" strokeWidth="1" d="
                        m 0,100
                        h 100
                        c 0,0 -50,-10 -100,0
                        z  " 
                />
            </svg>
            <a 
                href='/'
                target="_self" 
                rel="noopener noreferrer" 
                className='social-link'
                aria-label="home"
            >
                <img src={BrandLogo.src} />
            </a>
            {/* {socials.map((social, i) => {
                return (
                    <a 
                        key={i} 
                        href={social.link || "#"} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className='social-link'
                        aria-label={social.text}
                    >
                        <img src={social.icon.src} />
                    </a>
                );
            })} */}
        </div>
    )
}
