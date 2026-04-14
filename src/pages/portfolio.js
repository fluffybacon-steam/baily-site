import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { page_transition } from "@/lib/helper";
import Showcase from "@/components/Showcase.js";
import { useChevronScene } from '@/context/ChevronSceneContext';

const Portfolio = () => {
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
        <article ref={articleRef}  className="loading">
            <h1>Portfolio</h1>
            <hr />
            <Showcase />
        </article>
    )   
}
export default Portfolio;