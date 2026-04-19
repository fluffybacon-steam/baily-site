import {gsap} from 'gsap';

const D2R = (d) => (d * Math.PI) / 180;

export function page_transition(articleRef, { scene,chevron } = {} ) {
    if(!articleRef) return
    // const preventScroll = (e) => e.preventDefault();
    // window.addEventListener('wheel',     preventScroll, { passive: false });
    // window.addEventListener('touchmove', preventScroll, { passive: false });
    const heading          = articleRef.querySelector('h1');
    const article_elements = heading.parentNode.querySelectorAll("[data-fade-stagger]");
    const tl = gsap.timeline({ 
        onStart(){
            document.body.classList.remove("transitioning");
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
            x: leftHeadingAnchor.x, 
            y: leftHeadingAnchor.y, 
            z: leftHeadingAnchor.z,
            duration:0.5
        },0)

        tl.to(chevron.root.rotation,{
            y: D2R(180),
            x: D2R(-180),
            duration:0.4
        }, 0);

        // Stage heading — hidden until reveal
        gsap.set(heading, { clipPath: 'inset(0 100% 0 0)' });

        tl.add(chevron.open({ duration: 0.25, ease: 'power2.out' }), 0.4);

        const proxy = { t: 0 };
        tl.to(proxy, {
            t: 1,
            duration: 1,
            ease: 'none',
            onUpdate() {
                // Chevron tracks leading edge
                chevron.root.position.x = leftHeadingAnchor.x + (rightHeadingAnchor.x - leftHeadingAnchor.x) * proxy.t;

                // clipPath follows in lockstep
                gsap.set(heading, { clipPath: `inset(0 ${(1 - proxy.t) * 100}% 0 0)` });
            },
        }, 0.5);

        tl.add(chevron.setAngle(45, { duration: 0.2, ease: 'power2.inOut' }), 1.5);
        tl.to(chevron.root.position,{
            x: centerArticleAnchor.x,
            ease: 'none',
            duration: 0.5
        }, 1.5);
        tl.to(chevron.root.rotation,{
            z: D2R(-360),
            duration:0.5,
            ease:'sine.out'
        }, 1.75);
        tl.to(chevron.root.position, {
            y: centerArticleAnchor.y,
            duration: 1,
            ease:'expo.in'
        }, 1.5);
        tl.to(chevron._mountEl, {
            opacity: 0,
            duration: 1
        }, 2);
        // tl.add(()=>{chevron.root.visible = false});
    }
    gsap.set(article_elements, {opacity: 0, y:-20})
    console.log("article_elements", article_elements);

    const art_els_duration = article_elements.length;
    const staggers = Array.from(article_elements).map(el => parseFloat(el.dataset.fadeStagger) || 0);
    const maxStagger = Math.max(...staggers);

    tl.to(article_elements, {
        opacity: 1,
        y: 0,
        duration: art_els_duration,
        ease: 'power2.out',
        stagger: (index, target) => {
            const val = parseFloat(target.dataset.fadeStagger) || 0;
            const result = (val / maxStagger) * art_els_duration;
            console.log(`stagger[${index}]:`, val, "->", result);
            return result;
        },
    }, 2);

    tl.duration(2);

    return tl;

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