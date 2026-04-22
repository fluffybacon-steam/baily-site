import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { page_transition_last } from "@/lib/helper";
import Showcase from "@/components/Showcase.js";
import { useRenderScene } from '@/context/RenderSceneContext';

import Showcase3D from '@/components/Showcase3D';


const Portfolio = () => {
    const articleRef = useRef(null);
    // const { sceneRef, chevronRef } = useRenderScene();
    // const iconRef = useRef(null);
    useGSAP(() => {
        console.log("useGSAP running!");

    }, { dependencies: [] })



    return(
        <article ref={articleRef} >
            <h1 className="transition-target">Portfolio</h1>
            <Showcase3D />
            {/* <Showcase /> */}
        </article>
    )   
}
export default Portfolio;