import {gsap} from 'gsap';


export function page_transition(articleRef, title_icon_offset = 25 ){
    const coverup = document.querySelector('#coverup');
    const transition_icon = coverup.querySelector('.icon-wrapper');
    if(transition_icon){
        // transition_icon?.remove();
        const heading = articleRef.current.querySelector("h1");
        const article_elements = Array.from(heading.parentNode.children).filter(
            (el) => el !== heading
        );
        console.log("setup timeline");
        const page_in_tl = gsap.timeline({
            paused:true
        })

        //set stage
        page_in_tl.set('#coverup', {
            backgroundColor: "transparent"
        }, 0);
        // coverup.classList.remove("active");

        page_in_tl.set(article_elements, {
            opacity: 0,
            y: -10
        }, 0);

        page_in_tl.set(heading, {
            // clipPath: 'inset(0 0 0 0)'
            clipPath: `inset(0 ${heading.offsetWidth - transition_icon.offsetWidth/2}px 0 0)`
        }, 0);

        console.log("animate_heading_in");

        //animate_heading_in
        page_in_tl.to(transition_icon,{
            left: `${parseInt(transition_icon.style.left) + heading.offsetWidth + title_icon_offset}px`,
            duration: 1,
            ease:'power1.inOut'
        }, 0)
        .to(heading,{
            clipPath: `inset(0 ${-transition_icon.offsetWidth/2}px 0 0)`,
            duration: 1,
            ease:'power1.inOut'
        }, 0);

        console.log("animate_page");

        //animate_page
        page_in_tl.to(transition_icon,{
            y: 15,
            duration: 0.5,
            ease:'expo.in'
        }, 1)
        .to(article_elements,{
            opacity:1,
            y:0,
            duration: 0.33,
            stagger: 0.11
        }, 1.5)
        .to(transition_icon,{
            y: 0,
            duration: 2,
            ease:'elastic'
        }, 1.5)
        .to(transition_icon,{
            opacity: 0,
            duration: ((article_elements.length) * (0.33 - 0.11))/2,
            ease:'linear'
        }, 1.5 )

        return page_in_tl;
    } else {
        return null;
    }
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