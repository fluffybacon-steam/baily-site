import { useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(ScrollTrigger);

export default function ServiceList() {
    const serviceListRef = useRef(null);

    useGSAP(() => {
        if (!serviceListRef.current) return;

        const serviceList = serviceListRef.current;
        const cards = gsap.utils.toArray(serviceList.querySelectorAll(".service"));
        const styles = getComputedStyle(serviceList);
        const overlap = parseFloat(styles.getPropertyValue("--overlap")) || 30;

        // Use first card's height as the "canvas" size
        const cardHeight = cards[0].offsetHeight;

        // Position: card 1 at y:0, rest stacked below with --overlap peek
        cards.forEach((card, i) => {
            card.style.zIndex = i + 1;
            if (i > 0) {
                gsap.set(card, { y: cardHeight + (i - 1) * overlap });
            }
        });

        // Container height = one card + the peek stack
        const stackPeek = (cards.length - 1) * overlap;
        serviceList.style.height = `${cardHeight + stackPeek}px`;

        // Total scroll distance — one cardHeight per reveal
        const scrollLength = cardHeight * (cards.length - 1);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: serviceList,
                start: "top 10%",
                end: `+=${scrollLength}`,
                pin: true,
                scrub: 1,
                markers: false,
            },
        });

        // Each card animates from its stack position to y:0, covering the previous
        cards.forEach((card, i) => {
            if (i != 0) {
                tl.to(card, {
                    y: i * overlap,
                    ease: "none",
                    duration: 1,
                })
            }
            const title = card.querySelector('h2');
            tl.to(card,{
                '--infill':'black',
                duration:(i != 0) ? 1 : 0,
            }, (i != 0) ? "<=0.1" : 0)
        });

        return () => {
            tl.kill();
        };
    }, { scope: serviceListRef });

    return (
        <div ref={serviceListRef} className="service-list" data-fade-stagger="0">
            <Item icon="" title="Frontend Development">
                <p>Frontend is the &quot;visual&quot; part of website development and determines what a user sees & experiences.</p>
                <p>We partner with graphic designers</p>
            </Item>
            <Item icon="" title="Backend Development">
                <p>Backend is where all the &quot;logic&quot; of your website happens. This includes but is not limited to database architecture, user session management and <abbr title="Application Programming Interface">API</abbr> integration.</p>
            </Item>
            <Item icon="" title="SEO & GEO Strategy">
                <p><abbr title="Search Engine Optimization">SEO</abbr> are the techniques used to get websites showing up at the top of Google&apos;s search results. It doesn&apos;t matter how nice your website looks if people can&apos;t find it!</p>
                <p><abbr title="Generative Engine Optimization">GEO</abbr> is an emerging strategy in the age of AI. These experimental techniques tries to get your website&apos;s content utilized by AI-driven search engines like Google&apos;s AI Overviews.</p>
            </Item>
            <Item icon="" title="Advertising">
                <p>Pay-Per-Click (PPC) and Social Media advertising can rapidly boost your visibility online. We help you craft campaigns that target the right audience with the right message—turning clicks into conversions.</p>
            </Item>
            <Item icon="" title="Software Development">
                <p>From custom web platforms to desktop applications, we build software that solves real business problems. Whether you need internal tools or a consumer-facing product, we design with scalability and usability in mind.</p>
            </Item>
            <Item icon="" title="App Development">
                <p>We create mobile apps for iOS and Android tailored to your business goals. Whether it&apos;s a customer portal, an e-commerce experience, or something unique, we ensure performance, security, and an intuitive UI.</p>
            </Item>
            <Item icon="" title="IT Support">
                After working with computers for a living, you learn a thing or two about IT. We offer support for any hardware, networking, or software problems you may have.
            </Item>
        </div>
    );
}

const Item = (props) => {
    return (
        <div className="service">
            <div className="service-number"></div>
            <h2>{props.title}</h2>
            <div className="service-info">{props.children}</div>
        </div>
    );
};