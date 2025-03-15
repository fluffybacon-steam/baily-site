import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/all';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(MorphSVGPlugin);
import {useRef } from 'react';



const HeroText = ({text}) => {
    const svgRef = useRef(null);
    const attributes = {fill: 'white', stroke: 'white'};
    const options = {x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};
     

    useGSAP(()=>{
        if(svgRef.current){
            MorphSVGPlugin.convertToPath(svgRef.current.querySelector("text"));
        }
    }, {scope: svgRef, dependencies: [text]})

    if(text !== ''){
        return (
            <svg ref={svgRef} viewBox="0 0 100 100">
                <text x="0" y="20" >Testing</text>
            </svg>
        )
    }
}

export default HeroText;