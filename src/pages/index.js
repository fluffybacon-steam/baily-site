import { Red_Rose } from 'next/font/google'
import styles from '@/styles/Home.module.scss'
import React, {useEffect, useRef } from 'react';

// import Link from 'next/link';
// import { useRouter } from 'next/router';
import AnimatedNav from '@/components/AnimatedNav'

import HeroText from '@/components/HeroText';
import SplitText from "@/components/SplitText";
import Scene from "@/components/Scene";
import { fireColumnAnimation } from '@/components/Scene';

// import OscillatingCircle from '@/components/OscillatingCircle';
import Callouts from '@/components/Callouts';

import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

import ScrollTrigger from "gsap/dist/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const rose = Red_Rose({
  weight: 'variable',  // You can define a range of font weights (e.g., 100 to 900)
  style: 'normal',    // You can define the font style (e.g., normal, italic)
  subsets: ['latin'],
})

export default function Home() {
  
  return (
    <>
        <Scene 
          name="column"
          inset="0" 
          position="fixed"
          width="100vw" 
          height="100vh" onReady={({ scene }) => {
            fireColumnAnimation(scene);
          }} 
        />
        <HeroText text={'Hohman Digital'}/>
        <Callouts />
        <AnimatedNav />
    </>
  )

}
