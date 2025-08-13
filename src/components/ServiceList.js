import { useRef, useEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(ScrollTrigger);

export default function ServiceList() {
    const serviceListRef = useRef(null);

    useGSAP(()=>{
        if(serviceListRef.current){
            // const height_of_list = getHeightOfChildren(serviceListRef.current);
            // serviceListRef.current.style.height = `${height_of_list }px`;
            // console.log('height_of_list',height_of_list);
            const serviceList = serviceListRef.current;
            const last_child = serviceList.children[serviceList.children.length - 1];
            console.log("last child", last_child);
            const styles = getComputedStyle(serviceList);
            const titleHeight = styles.getPropertyValue('--titleHeight').trim();

            setTopCalculated(serviceList);

            const tl = gsap.timeline({
                scrollTrigger:{
                    trigger:last_child,
                    start:`top 50%`,
                    end: `bottom 50%`,
                    scrub: 1.5,
                    markers:false,
                    // toggleActions: "play pause pause pause"
                },
                duration:0
            });
            const allServices = Array.from(serviceList.querySelectorAll(".service"));
            const otherServices = allServices.filter(el => el !== last_child);
            // allServices.forEach((el) => {
            //     const currentTop = el.style.top;

            //     tl.to(el, {
            //         top: `${currentTop - 100}px`,
            //     }, 0);
            // });
            tl.to(serviceList, {
                translateY: -window.outerHeight
            });
            return () => {
                if(tl){
                    tl.kill();
                }
            };
        }

    }, { scope: serviceListRef } );


    return (
        <div ref={serviceListRef } className="service-list">
            <Item 
                icon=""
                title="Frontend Development"
            >
                <p>
                    Frontend is the 'visual' part of website development and is determine what a user sees & experiences.
                </p>
                <p>
                    We partner with graphic designers
                </p>
            </Item>
             <Item 
                icon=""
                title="Backend Development"
            >
                <p>
                    Backend is where all the 'logic' of your website happens. This includes but is not limited to database architecture, user session management and <abbr title="Application Programming Interface">API</abbr> integration.
                </p>
            </Item>
            <Item 
                icon=""
                title="SEO & GEO Strategy"
            >
                <p>
                    <abbr title="Search Engine Optimization">SEO</abbr> are the techniques used to get websites showing up at the top of Google's search results. It doesn't matter how nice your website looks if people can't find it! You'll see this term thrown around a lot because everyone has to say they do it... but very few are actually doing it right!
                </p>
                <p>
                    <abbr title="Generative Engine Optimization">GEO</abbr> is an emerging strategy in the age of AI. These experimental techniques tries to get your website's content utilized by AI-drive search engines like Google's AI Overviews.
                </p>
            </Item>
            <Item 
                icon=""
                title="Advertising"
            >
                <p>
                    Pay-Per-Click (PPC) and Social Media advertising can rapidly boost your visibility online. We help you craft campaigns that target the right audience with the right message—turning clicks into conversions.
                </p>
            </Item>
            <Item 
                icon=""
                title="Software Development"
            >
                <p>
                    From custom web platforms to desktop applications, we build software that solves real business problems. Whether you need internal tools or a consumer-facing product, we design with scalability and usability in mind.
                </p>
            </Item>
            <Item 
                icon=""
                title="App Development"
            >
                <p>
                    We create mobile apps for iOS and Android tailored to your business goals. Whether it's a customer portal, an e-commerce experience, or something unique, we ensure performance, security, and an intuitive UI.
                </p>
            </Item>
            <Item 
                icon=""
                title="IT Support"
            >
                After working with computers for a living, you learn a thing or two about IT. We offer support for any hardware, networking, or software problems you may have.
            </Item>
            {/* <Item 
                icon=""
                title=""
            >
            </Item> */}
        </div>
    )
}

const Item = (props) =>{
    console.log(props);
    return (
        <div className='service'>
            {props.icon && (props.icon)}
            <h2>{props.title}</h2>
            <div>{props.children}</div>
        </div>
    )
}

function setTopCalculated(serviceList){
    const styles = getComputedStyle(serviceList.children[0]);
    console.log(styles.padding);
    const paddingTop = parseFloat(styles.padding) || 0;
    let totalHeight = 0;

    Array.from(serviceList.children).forEach((child) => {
        const h2 = child.querySelector('h2');
        const h2Height = h2 ? getFullRenderedHeight(child, h2) : 0;

        // Set the CSS variable --top-calculate
        child.style.setProperty('--top-calculated', `${totalHeight}px`);

        // Add this h2's height to the running total
        totalHeight += h2Height;
    });
}

function getFullRenderedHeight(parent, el) {
    const p_styles = getComputedStyle(parent);
    const padding = parseFloat(p_styles.padding) || 0;
    
    const el_style = getComputedStyle(el);

    const marginTop = parseFloat(el_style.marginTop) || 0;
    const marginBottom = parseFloat(el_style.marginBottom) || 0;

    const totalHeight = el.offsetHeight + marginTop + marginBottom + padding;

    return totalHeight;
}


