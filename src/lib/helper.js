import {gsap} from 'gsap';

const D2R = (d) => (d * Math.PI) / 180;

export function page_transition_last(articleRef, { scene, chevron } = {} ) {
    console.log("articleRef happening?", articleRef);
    if(!articleRef) return
    // const preventScroll = (e) => e.preventDefault();
    // window.addEventListener('wheel',     preventScroll, { passive: false });
    // window.addEventListener('touchmove', preventScroll, { passive: false });
    const heading          = articleRef.querySelector('.transition-target');
    const article_elements = heading.parentNode.querySelectorAll("[data-fade-stagger]");
    const tl = gsap.timeline({ 
        onStart(){
            document.body.classList.remove("transitioning");
            document.querySelector("#colophon").style = '';
        },
        onComplete() {
            console.log("TIMELINE COMPLETE");
            document.body.classList.remove("loading");
            // window.removeEventListener('wheel',     preventScroll);
            // window.removeEventListener('touchmove', preventScroll);
        }
    });

    // Chevron is sitting at p2, z:90 — animate it out first
    // const chevron = scene.getObjectByProperty('nav_arrrow');
    if (chevron) {
        const targetZ = chevron.getZForPixelHeight(heading.offsetHeight);

        const leftHeadingAnchor  = scene.getElementWorldPosition(heading, { anchor: 'center-left',  z: targetZ });
        const rightHeadingAnchor = scene.getElementWorldPosition(heading, { anchor: 'center-right', z: targetZ });
        const rightArticleAnchor = scene.getElementWorldPosition(heading.parentNode, { anchor: 'right', z: targetZ });
        

        const centerArticleAnchor = scene.getElementWorldPosition(heading.parentNode, { anchor: 'center', z: targetZ });
        
        // Snap into position — direct assignment, no tween
        // chevron.root.position.set(leftHeadingAnchor.x, leftHeadingAnchor.y, leftHeadingAnchor.z);
        // chevron.root.rotation.set(0, D2R(-180), D2R(90));

        tl.to(chevron.root.position,{
            x: rightHeadingAnchor.x, 
            y: rightHeadingAnchor.y, 
            z: rightHeadingAnchor.z,
            ease:"circ.out",
            duration:0.5
        },0)

        // tl.to(chevron.root.rotation,{
        //     y: D2R(180),
        //     x: D2R(-180),
        //     duration:0.4
        // }, 0);

        // Stage heading — hidden until reveal
        gsap.set(heading, { clipPath: 'inset(0 0 0 100%)' });

        tl.add(chevron.open({ duration: 0.25, ease: 'power2.out' }), 0.4);

        const proxy = { t: 0 };
        tl.to(proxy, {
            t: 1,
            duration: 1,
            ease: 'none',
            onUpdate() {
                // Chevron tracks leading edge
                chevron.root.position.x = rightHeadingAnchor.x + (leftHeadingAnchor.x - rightHeadingAnchor.x) * proxy.t;

                // clipPath follows in lockstep
                gsap.set(heading, { clipPath: `inset(0 0 0 ${(1 - proxy.t) * 100}%)` });
            },
            onComplete(){
                heading.style.clipPath = '';
            }
        }, 0.5);
        tl.to(chevron.root.scale,{
            x: 0.5,
            duration:0.25
        },1.25)
        tl.add(()=>{chevron.root.visible = false});
        // tl.add(chevron.setAngle(45, { duration: 0.2, ease: 'power2.inOut' }), 1.5);


        // tl.to(chevron.root.position,{
        //     x: centerArticleAnchor.x,
        //     ease: 'none',
        //     duration: 0.5
        // }, 1.5);
        // tl.to(chevron.root.rotation,{
        //     z: D2R(-360),
        //     duration:0.5,
        //     ease:'sine.out'
        // }, 1.75);
        // tl.to(chevron.root.position, {
        //     y: centerArticleAnchor.y,
        //     duration: 1,
        //     ease:'expo.in'
        // }, 1.5);
        // tl.to(chevron._mountEl, {
        //     opacity: 0,
        //     duration: 1
        // }, 2);
        // tl.add(()=>{chevron.root.visible = false});
    }
    gsap.set(article_elements, {opacity: 0, y:-20})
    console.log("article_elements", article_elements);

    // const art_els_duration = article_elements.length;
    const staggers = Array.from(article_elements).map(el => parseFloat(el.dataset.fadeStagger) || 0);
    const maxStagger = Math.max(...staggers);

    tl.then(()=>{
        gsap.to(article_elements, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            stagger: (index, target) => {
                return staggers[index];
            },
        });
    });

    tl.duration(1);

    return tl;

}

const shortestAngle = (from, to) => {
    let delta = (to - from) % (Math.PI * 2);
    if (delta >  Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    return from + delta;
};

// Quadratic bezier interpolation between two world points via a control point
const quadBezier = (p0, ctrl, p1, t) => ({
    x: (1-t)**2 * p0.x  +  2*(1-t)*t * ctrl.x  +  t**2 * p1.x,
    y: (1-t)**2 * p0.y  +  2*(1-t)*t * ctrl.y  +  t**2 * p1.y,
    z: (1-t)**2 * p0.z  +  2*(1-t)*t * ctrl.z  +  t**2 * p1.z,
});

// Perpendicular control point offset from the midpoint of a segment
// arcAmount: world-unit bulge. Positive = left of travel direction.
const quadBezierTangent = (p0, ctrl, p2, t) => {
    const dx = 2*(1-t)*(ctrl.x - p0.x) + 2*t*(p2.x - ctrl.x);
    const dy = 2*(1-t)*(ctrl.y - p0.y) + 2*t*(p2.y - ctrl.y);
    const dz = 2*(1-t)*(ctrl.z - p0.z) + 2*t*(p2.z - ctrl.z);
    return { x: dx, y: dy, z: dz };
};

export function calculate_path(p0, p1, p2, chevron, tl, duration, lead_time, rotateStart = 0) {
    console.log("called calculate_path");
    const tan0  = quadBezierTangent(p0, p1, p2, 0);
    const xyLen0 = Math.sqrt(tan0.x**2 + tan0.y**2);
    const initZ  = Math.atan2(tan0.y, tan0.x) - Math.PI / 2;
    const initX  = -Math.atan2(tan0.z, xyLen0);
    const proxy = { t: 0 };
    // tl.to(chevron.root.rotation, { x: initX, y: 0, z: initZ, ease:'none', duration: 0.1}, 'start-flight');
    if(rotateStart){
        tl.to(chevron.root.rotation, { x: initX, y: 0, z: initZ, ease:'none', duration: rotateStart}, 'start-flight');
    }
    if(lead_time){
        tl.to(proxy, {
            t: 1,
            duration: duration,
            ease: 'circ.in',
            onUpdate() {
                const pos   = quadBezier(p0, p1, p2, proxy.t);
                const tan   = quadBezierTangent(p0, p1, p2, proxy.t);
                const xyLen = Math.sqrt(tan.x**2 + tan.y**2);
    
                Object.assign(chevron.root.position, pos);
    
                const tangentZ = Math.atan2(tan.y, tan.x) - Math.PI / 2;
                const tangentX = -Math.atan2(tan.z, xyLen);
    
                const timeRemaining = (1 - proxy.t) * duration;
                const blend = lead_time > 0
                    ? Math.max(0, 1 - timeRemaining / lead_time)
                    : 0;
    
                chevron.root.rotation.x = tangentX + (shortestAngle(tangentX, D2R(0))  - tangentX) * blend;
                chevron.root.rotation.z = tangentZ + (shortestAngle(tangentZ, D2R(90)) - tangentZ) * blend;
            },
        });
        
    } else {
        tl.to(proxy, {
            t: 1,
            duration: duration,
            ease: 'circ.in',
            onUpdate() {
                const pos   = quadBezier(p0, p1, p2, proxy.t);
                const tan   = quadBezierTangent(p0, p1, p2, proxy.t);
                const xyLen = Math.sqrt(tan.x**2 + tan.y**2);
    
                Object.assign(chevron.root.position, pos);
            },
        });
    }
    return tl
}


export function stringToNumber(str) {
//   console.log(str);
  let hash = 0x811c9dc5;          // 2166136261 = FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);    // XOR with the next byte
    hash = Math.imul(hash, 0x01000193); // multiply by FNV prime 16777619 (with 32-bit overflow)
  }
  return hash >>> 0;              // convert to unsigned 32-bit
}

export function showTooltip(evt, text) {
  console.log("showTooltip fired")
  let tooltip = document.getElementById("tooltip");
  if (!tooltip) return;

  tooltip.style.display = "block";
  tooltip.style.left = evt.pageX + 10 + 'px';
  tooltip.style.top = evt.pageY + 10 + 'px';
  tooltip.innerHTML = text;
}

export function hideTooltip() {
  console.log("hidetolltip fired")
  var tooltip = document.getElementById("tooltip");
  if (!tooltip) return;

  tooltip.style.display = "";
}

export function getHeightOfChildren(element, depth = 1) {
    if (!element || depth < 1) return 0;
    let totalHeight = 0;
    for (const child of element.children) {
        if (depth > 1) {
            totalHeight += getHeightOfChildren(child, depth - 1);
        } else {
            totalHeight += child.offsetHeight;
        }
    }
    return totalHeight;
}