
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/dist/MorphSVGPlugin";
import { useRenderScene } from '@/context/RenderSceneContext';
import {page_transition_last} from '@/lib/helper.js';
import {calculate_path} from '@/lib/helper.js';
gsap.registerPlugin(MorphSVGPlugin);
// gsap.registerPlugin(MorphSVGPlugin) 

export default function Menu() {
  const router = useRouter();
  const pathname = usePathname();
  const { sceneRef } = useRenderScene();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const iconRef = useRef(null);
  const tlRef = useRef(null);
  const mastRef = useRef(null);
  const contactRef = useRef(null)

  useEffect(() => {
    if (iconRef.current) {
      const rays = [
        "#ray1",
        // "#ray2",
        // "#ray3",
        "#ray4",
        "#ray5",
        "#ray6",
        "#ray7",
        "#ray8",
      ].map(sel => iconRef.current.querySelector(sel));
      const rayAngles = [0, 3, 4, 5, 6, 7].map(i => i * (Math.PI / 4));

      const body = iconRef.current.querySelector("#body");
      const raystar1 = iconRef.current.querySelector("#ray2");
      const raystar2 = iconRef.current.querySelector("#ray3");
      

      // Store timeline in ref
      tlRef.current = gsap.timeline({ paused: true })
        // Morph sun core into moon
        .to(body, {
          duration: 0.5,
          fill:"#fff9f9",
          morphSVG: {
            shape: "M 812.69565,-380.63279 C 757.77393,-200.99199 567.62355,-99.887271 387.9828,-154.80894 208.342,-209.73065 107.23723,-399.881 162.15892,-579.5218 c 53.95635,-176.48313 245.07211,-280.74555 424.71289,-225.82383 -341.21152,156.09407 -130.583,579.58178 225.82384,424.71284 z"
          },
          transformOrigin: "center center",
          ease: "power1.inOut"
        }, 0)
        //  Rays fade/scale out
         .to(rays, {
           duration: 0.4,
          x: (index) => Math.sin(rayAngles[index]) * -70,
          y: (index) => -Math.cos(rayAngles[index]) * -70,
          //  svgOrigin: "480 -480",
           ease: "power1.inOut"
         }, 0)
         .to(rays, {
           duration: 0.35,
           scale: 0,
           ease: "expo.in"
         }, 0)
         .to(raystar1,{
          duration: 0.5,
          stroke: 'white',
          morphSVG: {
            shape: "m 572.90288,-662.8315 42.45796,18.7557 c 10.09921,4.4313 18.03433,12.57251 22.36255,22.56868 l 17.62213,40.91218 c 1.44276,3.29769 5.9771,3.29769 7.41985,0 l 18.13738,-41.63356 c 4.43128,-10.09922 12.46944,-18.13738 22.46562,-22.46561 l 41.63354,-18.13739 c 3.19466,-1.44274 3.19466,-5.97709 0,-7.41985 l -41.63354,-18.13737 c -10.09923,-4.43129 -18.13738,-12.46946 -22.46562,-22.46562 l -18.13738,-41.63355 c -1.44275,-3.19464 -5.97709,-3.19464 -7.41985,0 l -18.13737,41.63355 c -4.4313,10.09921 -12.46946,18.13737 -22.46565,22.46562 l -41.73658,18.24043 c -3.19465,1.44274 -3.19465,5.9771 0,7.41983 z"
          },
          transformOrigin: "center center",
          // fill:""
          ease: "power1.inOut"
         }, 0)
         .to(raystar2,{
          duration: 0.5,
          stroke: 'white',
          morphSVG: {
            shape: "m 718.16429,-558.72739 33.63479,14.85809 c 8.0005,3.51043 14.28662,9.95982 17.7154,17.87869 l 13.96008,32.41023 c 1.14294,2.6124 4.735,2.6124 5.87793,0 l 14.36826,-32.9817 c 3.51042,-8.00051 9.87817,-14.36826 17.79705,-17.79704 l 32.98173,-14.36827 c 2.5307,-1.14292 2.5307,-4.73499 0,-5.87793 l -32.98173,-14.36825 c -8.00051,-3.51043 -14.36826,-9.87819 -17.79705,-17.79705 l -14.36826,-32.9817 c -1.14293,-2.53076 -4.73499,-2.53076 -5.87793,0 l -14.36825,32.9817 c -3.51043,8.0005 -9.87819,14.36825 -17.79707,17.79705 l -33.06332,14.44989 c -2.53077,1.14293 -2.53077,4.735 0,5.87792 z"
          },
          transformOrigin: "center center",
          // fill:"",
          ease: "power1.inOut"
         }, 0)
        .duration(0.35);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDark);
    if (tlRef.current) {
      if (isDark) {
        tlRef.current.play();
      } else {
        tlRef.current.reverse();
      }
    }
  }, [isDark]);

  const toggleMode = () => {
    setIsDark(prev => {
      const newState = !prev;
      return newState;
    });
  };

  useEffect(()=>{
    const scene   = sceneRef?.current;
    if (!scene) {
        console.warn('Menu.js: scene or chevron not ready');
        return;
    }

  }, [sceneRef])

  const navigateToContact = (url) =>{
    if (pathname == url) return; 
    const masthead = mastRef.current;
    const contact_button = contactRef.current;
    const scene   = sceneRef?.current;
    if (!scene ) {
        console.warn('menu: scene or chevron not ready');
        return;
    }

    let chevron = scene._chevrons.get('menu_arrow');
    if(chevron){
      chevron.visible = false;
      chevron.setAngle(45);
    } else {
      chevron = scene.addChevron('menu_arrow',{angle:45, visible: false});
    }

    chevron.root.rotation.set(0,0,D2R(180));
    const spawnZ = chevron.getZForPixelHeight(contact_button.offsetHeight);

    let start, p0, p1, p2;
    start = scene.getElementWorldPosition(contact_button, { anchor: 'center', z: spawnZ});
    p0 = scene.getElementWorldPosition(contact_button, { anchor: 'center', z: spawnZ, offsetY: contact_button.offsetHeight * 2});
    p1 = scene.getElementWorldPosition(masthead, {
      anchor:  'center',
      z:       spawnZ,
      offsetY: contact_button.offsetHeight * 4
    });
    // p2 = scene.getElementWorldPosition(masthead, {
    //   anchor:  'center',
    //   z:       spawnZ,
    //   offsetY: contact_button.offsetHeight,
    //   // offsetX: -25
    // })
    p2 = p1

    console.log('p0',p0);
    chevron.root.position.set(p0);
    chevron.root.visible = true;
    
    const tl = gsap.timeline({
      ease: "none",
      onStart: ()=>{
        scene._mountEl.parentNode.style.zIndex = '-1';
        gsap.to("#page > article > *", {
          scale: 0.5,
          y:100,
          opacity: 0,
          duration: 0.5
        }
        )
        // chevron.root.position.set(p0);
        // chevron.root.visible = true;
      },
      onComplete: ()=>{
        scene._mountEl.parentNode.style.zIndex = '999';
      }
    });
    tl.set(chevron.root.position,{
      ...start
    });
    tl.set(chevron.root,{
      visible: true
    });
    // tl.addLabel('start-flight', 0);
    tl.to(chevron.root.position, {
      ...p0,
      duration:0.25
    },0);
    tl.to(chevron.root.rotation,{
        z:D2R(90),
        ease:"power1.inOut",
        duration:0.25
    },0)
    
    // const path_duration = 1;    
    // const lead_time = 0.5;
    
    tl.add(()=>{
        document.body.classList.add("loading");
        document.body.classList.add("transitioning");
        const handleRouteComplete = () => {
          router.events.off('routeChangeComplete', handleRouteComplete);
          console.log("handleRounteComplete");
          const article = document.querySelector('article');
          page_transition_last(article, {
              scene:   sceneRef?.current,
              chevron: chevron,
          });
        };

        router.events.on('routeChangeComplete', handleRouteComplete);
        router.push(url);
    },0.25);
    // calculate_path(p0, p1, p2, chevron, tl, path_duration, lead_time);
    // tl.add(chevron.setAngle(45, { duration: 0.1, ease: 'power3.out' }), 0);
    // tl.add(()=>{
    //       console.log("called page_transition_last", document.querySelector('article'));
    //   })

    // tl.duration(1);

    // return tl;
  }


  return (
    <div id='masthead' ref={mastRef}>
      <div
        className="color-mode"
        onClick={toggleMode}
        style={{ cursor: "pointer" }}
      >
        <svg ref={iconRef} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
          <path
            id="body"
            style={{
              fill: '#fff9f900',
              stroke: '#000000',
              strokeWidth: '62.6467',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            d="m 625.67723,-334.32277 c -80.45531,80.45531 -210.89915,80.45531 -291.35446,0 -80.45531,-80.45531 -80.45531,-210.89915 0,-291.35446 80.45531,-80.45531 210.89915,-80.45531 291.35446,0 80.45531,80.45531 80.45531,210.89915 0,291.35446 z"
          />
          <path style={{ fill: '#fff9f9', stroke: '#000000', strokeWidth: '44.8281', strokeLinecap: 'round', strokeLinejoin: 'round' }} id="ray1"
            d="m 497.73236,-818.72456 c -11.82163,0 -23.64325,0 -35.46488,0 0,-25.20416 0,-50.40832 0,-75.61248 11.82163,0 23.64325,0 35.46488,0 0,25.20416 0,50.40832 0,75.61248 z" />
          <path style={{ fill: '#fff9f9', stroke: '#000000', strokeWidth: '44.8281', strokeLinecap: 'round', strokeLinejoin: 'round' }} id="ray2"
            d="m 732.05319,-712.73329 c -8.35915,-8.35915 -16.7183,-16.71831 -25.07746,-25.07746 17.82204,-17.82203 35.64407,-35.64407 53.4661,-53.4661 8.35916,8.35916 16.71831,16.71831 25.07746,25.07746 -17.82203,17.82203 -35.64407,35.64406 -53.4661,53.4661 z" />
          <path style={{ fill: '#fff9f9', stroke: '#000000', strokeWidth: '44.8281', strokeLinecap: 'round', strokeLinejoin: 'round' }} id="ray3"
            d="m 895.96014,-499.50366 c 0,11.82163 0,23.64325 0,35.46488 -25.20416,0 -50.40832,0 -75.61248,0 0,-11.82163 0,-23.64325 0,-35.46488 25.20416,0 50.40832,0 75.61248,0 z" />
          <path style={{ fill: '#fff9f9', stroke: '#000000', strokeWidth: '44.8281', strokeLinecap: 'round', strokeLinejoin: 'round' }} id="ray4"
            d="m 781.38477,-201.32939 c -8.35915,8.35915 -16.7183,16.7183 -25.07746,25.07745 -17.82203,-17.82203 -35.64406,-35.64406 -53.46609,-53.46609 8.35915,-8.35916 16.7183,-16.71831 25.07745,-25.07746 17.82204,17.82203 35.64407,35.64406 53.4661,53.4661 z" />
          <path style={{ fill: '#fff9f9', stroke: '#000000', strokeWidth: '44.8281', strokeLinecap: 'round', strokeLinejoin: 'round' }} id="ray5"
            d="m 497.73236,-65.66294 c -11.82163,0 -23.64325,0 -35.46488,0 0,-25.20416 0,-50.40832 0,-75.61248 11.82163,0 23.64325,0 35.46488,0 0,25.20416 0,50.40832 0,75.61248 z" />
          <path style={{ fill: '#fff9f9', stroke: '#000000', strokeWidth: '44.8281', strokeLinecap: 'round', strokeLinejoin: 'round' }} id="ray6"
            d="m 199.55818,-180.23828 c -8.35915,-8.35915 -16.71831,-16.7183 -25.07746,-25.07746 17.82203,-17.82203 35.64406,-35.64406 53.4661,-53.46609 8.35915,8.35915 16.71831,16.71831 25.07745,25.07745 -17.82203,17.82204 -35.64406,35.64407 -53.46609,53.4661 z" />
          <path style={{ fill: '#fff9f9', stroke: '#000000', strokeWidth: '44.8281', strokeLinecap: 'round', strokeLinejoin: 'round' }} id="ray7"
            d="m 142.89848,-499.50366 c 0,11.82163 0,23.64325 0,35.46488 -25.20416,0 -50.40832,0 -75.61248,0 0,-11.82163 0,-23.64325 0,-35.46488 25.20416,0 50.40832,0 75.61248,0 z" />
          <path style={{ fill: '#fff9f9', stroke: '#000000', strokeWidth: '44.8281', strokeLinecap: 'round', strokeLinejoin: 'round' }} id="ray8"
            d="m 248.8898,-733.82437 c -8.35916,8.35916 -16.7183,16.71831 -25.07746,25.07746 -17.82203,-17.82203 -35.64406,-35.64406 -53.46609,-53.4661 8.35915,-8.35915 16.7183,-16.7183 25.07745,-25.07745 17.82203,17.82203 35.64407,35.64406 53.4661,53.46609 z" />
        </svg>
      </div>
      <Link 
        onNavigate={(e) => {
          e.preventDefault();
          navigateToContact('/contact');
        }} 
        className={pathname != '/contact' ? 'say-hello button-pill' : 'say-hello say-hello--special button-pill'} 
        href='/contact' 
        rel='follow'
        ref={contactRef}
      >
        Say Hello
      </Link>
    </div>
  )
}


const D2R = (d) => (d * Math.PI) / 180;