import {useEffect, useRef} from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import { useGSAP } from '@gsap/react';
import ServiceList from "@/components/ServiceList";
import {page_transition} from '@/lib/helper.js';
import { useRenderScene } from '@/context/RenderSceneContext';


const Services = () => {
    const articleRef = useRef(null);
    const { sceneRef, chevronRef } = useRenderScene();
    // const iconRef = useRef(null);

    useGSAP(() => {
        console.log("useGSAP running!");

    }, { dependencies: [] })
    
    return(
        <article ref={articleRef}>
            <h1>Our Services</h1>
            <hr />
            <ServiceList />
        </article>
    )   
}
export default Services;