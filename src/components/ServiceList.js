import { useRef } from "react";
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
            const tl = gsap.timeline({
                scrollTrigger:{
                    trigger:last_child,
                    start: "top 50%",
                    end: `bottom 50%`,
                    scrub: 1,
                    markers:true
                }
            });
            tl.to(last_child, {
                marginTop: last_child.offsetHeight
            })
        }
        return () => {
            tl.kill();
        };

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

