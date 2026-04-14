import {useEffect, useRef} from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import { useGSAP } from '@gsap/react';
import ServiceList from "@/components/ServiceList";
import {page_transition} from '@/lib/helper.js';
import { useChevronScene } from '@/context/ChevronSceneContext';


const Services = () => {
    const articleRef = useRef(null);
    const { sceneRef, chevronRef } = useChevronScene();
    // const iconRef = useRef(null);

    useGSAP(() => {
        console.log("useGSAP running!");
         if (articleRef.current) {
            const page_in_tl = page_transition(articleRef, {
                scene:   sceneRef?.current,
                chevron: chevronRef?.current,
            });
            if (page_in_tl) {
                page_in_tl.duration(2).play();
            }
        }

    }, { dependencies: [] })
    
    return(
        <article ref={articleRef} className="loading">
            <h1>Our Services</h1>
            <hr />
            <ServiceList />
        </article>
    )   
}
export default Services;