import handsome_boy_3 from "/public/baily_profile_picture.png";
import handsome_boy_2 from "/public/baily_pro_frame2.png";
import handsome_boy_1 from "/public/baily_pro_frame1.png";
import sprite from "/public/baily_sprite_sheet.png";

import Image from "next/image";
import {useRef} from 'react';
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import { useGSAP } from "@gsap/react";
import { deprecations } from "sass";

export default function ProfilePic() {
    const picRef = useRef(null);

    useGSAP(() => {
        if (picRef.current) {
            const pic = picRef.current.querySelector(".profile-pic");
            const welcome = picRef.current.querySelector(".welcome-message");
            const film = picRef.current.querySelector(".film-roll");

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: picRef.current,
                    start: "top 50%",
                    end: "center 50%",
                    scrub: false,
                    toggleActions: "play none none reverse"
                }
            });

            tl.fromTo(pic,{
                x: '100%',
                opacity: 0
            }, {
                x: 0,
                opacity: 1,
                duration: 0.25,
                ease:"power1.out"
            },0)

             tl.fromTo(film,{
                backgroundPosition: "90% 5px",
            }, {
                backgroundPosition: "100% 5px",
                duration: 0.25,
                ease:"power1.inOut"
            },0)

            
            tl.to(film,{
                backgroundPosition: "0% 5px",
                ease: "steps(2)",
                duration: 0.5
            }, 0.25);

            const jump = 15;
            const magic_num = -0.2;
            tl.fromTo(film, {
                y:`${jump}%`,
                // clipPath:'inset(0 0 0 0);(50% at 50% 35%)',
                clipPath:`inset(0 var(--br) ${jump}% var(--br) round 0px 0px 100% 100% )`
            },{
                y:0,
                // clipPath: 'circle(50% at 50% 50%)',
                clipPath: `inset(0 var(--br) ${magic_num}% var(--br) round 0px 0px 100% 100% )`,
                ease: "power1.inOut",
                duration: 0.5
            }, 0.25);

            tl.fromTo(welcome,{
                // y:50,
                rotate:'25deg',
                opacity: 0
            }, {
                // y:0,
                rotate:'0deg',
                opacity: 1,
                duration: 0.65,
                ease:"power2.out"
            }, 0.5)
        }
    }, { scope: picRef, dependencies: [] });
    
    return (
        <div ref={picRef} className="profile-pic-wrapper">
            <div className="profile-pic">
                <div class="film-roll" style={{'backgroundImage': `url(${sprite.src})`}}>
                </div>
            </div>
            <div className="welcome-message">
                <p className="hello">Hello!</p>
                <h2 className="title">I'm Baily Hohman <span className="subtitle">Lead Developer and President of Hohman Digital LLC</span></h2>
                <p>I empower small businesses with high-performance websites that look <span class='shiny-text'>stunning</span> and turn visitors into customers.</p>
            </div>
        </div>
    )
}