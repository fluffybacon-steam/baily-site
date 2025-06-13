import {useEffect, useRef} from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import { useGSAP } from '@gsap/react';
import {page_transition} from '@/lib/helper.js';

console.log('page_transition',page_transition);

const AboutUs = () => {
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
            {/* <div ref={iconRef} id='article_icon'>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z"/></svg>
            </div> */}
            <h1>About us</h1>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum tincidunt purus vel blandit finibus. Praesent pulvinar urna vulputate mauris iaculis efficitur. Aliquam sit amet nibh vel nulla viverra ultrices eu eu odio. Integer est turpis, mollis id tortor lobortis, lacinia blandit nulla. Mauris non faucibus enim, sed gravida magna. Sed auctor dui metus, ac placerat arcu auctor vitae. Pellentesque vitae pharetra diam. Vivamus massa nunc, mattis ut egestas porttitor, venenatis id augue.</p>
            <p>Sed ultricies, mauris vel tristique fermentum, eros dui sagittis leo, at dignissim augue ante a turpis. Integer semper mollis dolor id tincidunt. Integer tincidunt pharetra nulla. Sed porta venenatis vehicula. Nulla facilisi. Aenean iaculis at mauris at venenatis. Cras sed consequat neque. Proin nisl turpis, placerat et elit eu, pulvinar porta massa.</p>
            <p>Integer at lectus ullamcorper, ultrices diam sit amet, vestibulum velit. Quisque aliquam sapien sapien, a imperdiet velit elementum vitae. Nam efficitur lectus ac molestie placerat. Morbi at imperdiet ipsum, quis egestas magna. Phasellus porta id risus a aliquet. Vestibulum diam ex, tempus vitae fermentum in, malesuada sed magna. Maecenas eu molestie orci. Curabitur non consectetur dolor. Nulla sit amet mauris porta, imperdiet enim et, tempus est. Curabitur ut nisi id mauris pharetra tempus vel at nibh. Aenean non ligula a arcu aliquam malesuada eget eu magna. Nulla in vulputate ante, nec scelerisque nunc. Curabitur non lectus imperdiet, ullamcorper dolor at, mollis massa. Mauris sit amet augue viverra justo blandit eleifend vel eu purus. Ut pellentesque urna nunc, fermentum ultrices orci pulvinar non.</p>
            <p>Mauris interdum aliquam orci, ac fermentum metus laoreet sed. Donec luctus ex sit amet condimentum volutpat. Nam porta ligula a purus mattis placerat. Quisque molestie justo sapien, sed aliquet justo mollis ut. Cras pharetra ut metus nec molestie. Aenean lobortis turpis metus, at auctor arcu commodo ut. Pellentesque mauris arcu, vulputate id nisi id, facilisis pellentesque lorem.</p>
            <p>In justo tortor, dictum nec fringilla vitae, porta id mi. Proin interdum finibus sodales. Mauris et tincidunt tortor. Vivamus nec lorem maximus, suscipit purus non, consectetur sapien. Nulla egestas leo orci, et aliquam eros consectetur at. Nulla facilisi. Etiam commodo euismod justo, nec posuere nulla convallis at. Morbi consequat porta magna, sit amet feugiat libero dignissim blandit. Curabitur sit amet ex eu felis tincidunt suscipit. Pellentesque maximus imperdiet ullamcorper. Phasellus sagittis scelerisque nunc.</p>     
            <Link href='/'>Test</Link>
        </article>
    )   
}
export default AboutUs;

// function page_transition(articleRef, title_icon_offset = 25 ){
//     const coverup = document.querySelector('#coverup');
//     const transition_icon = coverup.querySelector('.icon-wrapper');
//     if(transition_icon){
//         // transition_icon?.remove();
//         const heading = articleRef.current.querySelector("h1");
//         const article_elements = Array.from(heading.parentNode.children).filter(
//             (el) => el !== heading
//         );
//         console.log("setup timeline");
//         const page_in_tl = gsap.timeline({
//             paused:true
//         })

//         //set stage
//         page_in_tl.set('#coverup', {
//                 opacity: 0
//             }, 0);

//         return page_in_tl;
//     }
// }