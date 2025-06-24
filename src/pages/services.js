import {useEffect, useRef} from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import { useGSAP } from '@gsap/react';
import ServiceList from "@/components/ServiceList";
import {page_transition} from '@/lib/helper.js';


const Services = () => {
    const articleRef = useRef(null);
    // const iconRef = useRef(null);

    useGSAP(() => {
        console.log("useGSAP running!");
        if(articleRef.current 
            // && articleRef.current.classList.contains("loading")
        ){
            console.log("fetching animation to play...");
            // articleRef.current.classList.remove("loading");
            const page_in_tl = page_transition(articleRef);
            console.log("page_in_tl",page_in_tl); 
            if(page_in_tl){
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