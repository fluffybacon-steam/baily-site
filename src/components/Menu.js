import Link from 'next/link'
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/dist/MorphSVGPlugin";
gsap.registerPlugin(MorphSVGPlugin);
// gsap.registerPlugin(MorphSVGPlugin) 

export default function Menu() {
  const [isDark, setIsDark] = useState(false);
  const iconRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    if (iconRef.current) {
      const rays = [
        "#ray1",
        "#ray2",
        "#ray3",
        "#ray4",
        "#ray5",
        "#ray6",
        "#ray7",
        "#ray8",
      ].map(sel => iconRef.current.querySelector(sel));

      const body = iconRef.current.querySelector("#body");

      // Store timeline in ref
      tlRef.current = gsap.timeline({ paused: true })
        // Morph sun core into moon
        .to(body, {
          duration: 0.5,
          morphSVG: {
            shape: "M 206.0187 -678.8225 C 206.0187 -565.0415 113.781 -472.8038 0 -472.8038 C -113.781 -472.8038 -206.0187 -565.0415 -206.0187 -678.8225 C -206.0187 -790.6035 -113.781 -884.8412 0 -884.8412 C -170 -734 27 -526 206.0187 -678.8225 z"
          },
          strokeWidth: 32,
          scale: 1.5,
          transformOrigin: "center center",
          ease: "power1.inOut"
        }, 0)
        // Rays fade/scale out
        .to(rays, {
          duration: 0.4,
          scale: 0,
          opacity: 0,
          transformOrigin: "center center",
          ease: "power1.inOut"
        }, 0)
        .duration(0.35);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDark);
  }, [isDark]);

  const toggleMode = () => {
    setIsDark(prev => {
      const newState = !prev;
      if (tlRef.current) {
        if (newState) {
          tlRef.current.play();
        } else {
          tlRef.current.reverse();
        }
      }
      return newState;
    });
  };

  return (
    <div id='masthead'>
      <div
        className="color-mode"
        onClick={toggleMode}
        style={{ cursor: "pointer" }}
      >
        <svg ref={iconRef} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
          <path
            transform="rotate(45)"
            id="body"
            style={{
              fill: 'transparent',
              stroke: '#000000',
              strokeWidth: '62.6467',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            d="M206.01871,-678.82251 C206.01871,-565.04152 113.78099,-472.8038 0,-472.8038 -113.78099,-472.8038 -206.01871,-565.04152 -206.01871,-678.82251 -206.01871,-792.6035 -113.78099,-884.84122 0,-884.84122 113.78099,-884.84122 206.01871,-792.6035 206.01871,-678.82251 z"
          />
          <path
            transform="rotate(90)"
            style={{
              fill: '#fff9f9',
              stroke: '#000000',
              strokeWidth: '44.8281',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            id="ray1"
            d="M-818.72456,-497.73236 C-818.72456,-485.91073 -818.72456,-474.08911 -818.72456,-462.26748 -843.92872,-462.26748 -869.13288,-462.26748 -894.33704,-462.26748 -894.33704,-474.08911 -894.33704,-485.91073 -894.33704,-497.73236 -869.13288,-497.73236 -843.92872,-497.73236 -818.72456,-497.73236 z"
          />
          <path
            transform="rotate(135)"
            style={{
              fill: '#fff9f9',
              stroke: '#000000',
              strokeWidth: '44.8281',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            id="ray2"
            d="M-1021.61832,-13.66123 C-1021.61832,-1.83961 -1021.61832,9.98202 -1021.61832,21.80365 -1046.82248,21.80365 -1072.02664,21.80365 -1097.2308,21.80365 -1097.2308,9.98202 -1097.2308,-1.83961 -1097.2308,-13.66123 -1072.02664,-13.66123 -1046.82248,-13.66123 -1021.61832,-13.66123 z"
          />
          <path
            style={{
              fill: '#fff9f9',
              stroke: '#000000',
              strokeWidth: '44.8281',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            id="ray3"
            d="M895.96014,-499.50366 C895.96014,-487.68203 895.96014,-475.86041 895.96014,-464.03878 870.75598,-464.03878 845.55182,-464.03878 820.34766,-464.03878 820.34766,-475.86041 820.34766,-487.68203 820.34766,-499.50366 845.55182,-499.50366 870.75598,-499.50366 895.96014,-499.50366 z"
          />
          <path
            transform="rotate(45)"
            style={{
              fill: '#fff9f9',
              stroke: '#000000',
              strokeWidth: '44.8281',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            id="ray4"
            d="M410.16109,-694.88385 C410.16109,-683.06222 410.16109,-671.2406 410.16109,-659.41897 384.95693,-659.41897 359.75277,-659.41897 334.54861,-659.41897 334.54861,-671.2406 334.54861,-683.06222 334.54861,-694.88385 359.75277,-694.88385 384.95693,-694.88385 410.16109,-694.88385 z"
          />
          <path
            transform="rotate(90)"
            style={{
              fill: '#fff9f9',
              stroke: '#000000',
              strokeWidth: '44.8281',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            id="ray5"
            d="M-65.66294,-497.73236 C-65.66294,-485.91073 -65.66294,-474.08911 -65.66294,-462.26748 -90.8671,-462.26748 -116.07126,-462.26748 -141.27542,-462.26748 -141.27542,-474.08911 -141.27542,-485.91073 -141.27542,-497.73236 -116.07126,-497.73236 -90.8671,-497.73236 -65.66294,-497.73236 z"
          />
          <path
            transform="rotate(135)"
            style={{
              fill: '#fff9f9',
              stroke: '#000000',
              strokeWidth: '44.8281',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            id="ray6"
            d="M-268.55665,-13.66123 C-268.55665,-1.83961 -268.55665,9.98202 -268.55665,21.80365 -293.76081,21.80365 -318.96497,21.80365 -344.16913,21.80365 -344.16913,9.98202 -344.16913,-1.83961 -344.16913,-13.66123 -318.96497,-13.66123 -293.76081,-13.66123 -268.55665,-13.66123 z"
          />
          <path
            style={{
              fill: '#fff9f9',
              stroke: '#000000',
              strokeWidth: '44.8281',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            id="ray7"
            d="M142.89848,-499.50366 C142.89848,-487.68203 142.89848,-475.86041 142.89848,-464.03878 117.69432,-464.03878 92.49016,-464.03878 67.286,-464.03878 67.286,-475.86041 67.286,-487.68203 67.286,-499.50366 92.49016,-499.50366 117.69432,-499.50366 142.89848,-499.50366 z"
          />
          <path
            transform="rotate(45)"
            style={{
              fill: '#fff9f9',
              stroke: '#000000',
              strokeWidth: '44.8281',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            id="ray8"
            d="M-342.90052,-694.88385 C-342.90052,-683.06222 -342.90052,-671.2406 -342.90052,-659.41897 -368.10468,-659.41897 -393.30884,-659.41897 -418.513,-659.41897 -418.513,-671.2406 -418.513,-683.06222 -418.513,-694.88385 -393.30884,-694.88385 -368.10468,-694.88385 -342.90052,-694.88385 z"
          />
        </svg>

      </div>
      <a className='say-hello button-pill' href='/contact' rel='follow'>Say Hello</a>
    </div>
  )
}
