import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { page_transition } from "@/lib/helper";
import Showcase from "@/components/Showcase.js";

const Portfolio = () => {
    const articleRef = useRef(null);
    const iconRef = useRef(null);

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
        <article ref={articleRef}  className="loading">
            <h1>Portfolio</h1>
            <hr />
            <Showcase />
        </article>
    )   
}
export default Portfolio;