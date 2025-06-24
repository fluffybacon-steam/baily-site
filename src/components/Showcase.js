import { useRef, useState } from 'react';
import { Swiper, SwiperSlide} from 'swiper/react';
import { Controller } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/controller'; 
import gsap from "gsap";
import MotionPathPlugin from 'gsap/dist/MotionPathPlugin';
gsap.registerPlugin(MotionPathPlugin);


// import solo_dev from '@/icons/solo_dev.svg';
// import supporting_dev from '@/icons/support_dev.svg';
// import paid_media from '@/icons/paid_media.svg';
// import design from "@/icons/design.svg";
import phone_bg from '@/images/mobile_mockup_background.webp';
import monitor_bg from '@/images/desktop_mockup_background.webp';
import nextjs from "@/icons/nextjs.svg";
import salsify from "@/icons/salsify.svg";
import restApi from "@/icons/rest-api.svg";
import python from "@/icons/python.svg";
import greensock from "@/icons/gsap.svg";
import html5 from "@/icons/html5.svg";
import syndigo from "@/icons/syndigo.svg";
import shopify from "@/icons/shopify.svg";
import { ReactComponent as Donovan} from "@/icons/donovan.svg";
import Image from 'next/image'
import { useGSAP } from '@gsap/react';
import { hideTooltip, showTooltip } from '@/lib/helper';
// console.log("restApi",restApi);

//ADD SQL Database later
//{
//     'highlights' : [],
//     'desktop' : '',
//     'mobile' : '',
//     'agency' : '',
//     'capton' : '',
// }

// wordpress, solo-dev, support-dev, php, react, salsify, rest-api, paid_media, typescript, python

const project_list = [
    {
        'highlights': ['nextjs', 'typescript', 'google-auth','google-sheets'],
        'desktop':"https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/workout_desktop.webp",
        'mobile':"https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/workout_mobile.webp",
        'agency': '',
        'url' : 'https://github.com/fluffybacon-steam/WorkoutManager',
        'copy':
            `
            <p>An open-source spreadsheet-to-app planner for tracking workout programs, cross-platform tracking & backup enabled through Google Sheets API connection. User authentication powdered by Google OAuth.</p>
            <p>Development is active & ongoing.</p>
            `,
        'id' : 'Workout Planner'
    },
    {
        'highlights' : ['wordpress','php','rest-api'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/demkota_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/demkota_mobile.webp',
        'agency' : 'donovan',
        'url' : "https://www.demkotaranchbeef.com/",
        'copy': 
            `
            <p>I was involved in the design & responsible in the implementation of Demkota's Product Catalog.</p>
            <p>This represented my time uses AJAX and WordPress's REST Api to create user's filterable catalog.</p>
            `,
        'id' : 'Demkota Ranch Beef',
    },
    {
        'highlights' : ['wordpress','php','greensock'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/donovan_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/donovan_mobile.webp',
        'agency' : 'donovan',
        'url' : 'https://donovanadv.com',
        'copy': 
            `
            <p>This website was part of my former's agency re-brand.</p>
            <p>As lead developer of this project, I choose to utilize <a href='https://gsap.com/'>GSAP</a> animation library to bring the movement-centric design to life.</p>
            `,
        'id' : 'Donovan Advertising',
    },
    {
        'highlights' : ['wordpress','php','react'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/furmanos_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/furmanos_mobile.webp',
        'agency' : 'donovan',
        'url' : 'https://furmanos.com',
        'copy': 
            `
            <p>This project marked my first experience integrating state-monitoring React.js components within a WordPress environment.</p>
            <p>As the lead developer, I'm especially proud of the single recipe page. It features an intuitive frontend that lets users quickly select their desired serving size, along with seamless backend integration that makes setup simple for administrators.</p>
            `,
        'id' : 'Furmano Foods',
    },
    {
        'highlights' : ['wordpress','php'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/hammond_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/hammond_mobile.webp',
        'agency' : '',
        'url' : 'https://hammondelectricalservices.com',
        'copy': 
            `
            <p>My first freelancer client! 🥳</p>
            <p> Site-map, Design, Copywriting, and Development handled solely by me. In addition to deploying the site, I ran a short promotional Paid Search campaign to promote the launch. This campaign generated over 43k impressions and 40+ revenue-generating leads.</p>
            `,
        'id' : 'Hammond Electrical',
    },
    {
        'highlights' : ['wordpress','php','salsify'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/justbare_og_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/justbare_og_mobile.webp',
        'agency' : 'donovan',
        'url' : 'https://justbarefoods.com',
        'copy': 
            `
            <p>A branded website for a popular brand of prepared and fresh chicken products.</p>
            <p>This website hosts a custom-solution API with Salsify, allowing the client to synchronize their products with the products on their website, seamlessly & automatically.</p>
            `,
        'id' : 'Just Bare Foods',
    },
    // {
    //     'highlights' : ['wordpress','react','greensock'],
    //     'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/landinlancaster_desktop.webp',
    //     'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/landinlancaster_mobile.webp',
    //     'agency' : 'donovan',
    //     'url' : 'https://landinlancaster.com',
    //     'copy': 
    //         `

    //         `,
    //     'id' : 'Land in Lancaster',
    // },
    {
        'highlights' : ['html5','css'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/naeveag_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/naeveag_mobile.webp',
        'agency' : '',
        'url' : 'https://naeveag.com',
        'copy': 
            `
            <p>A brochure website for one of the largest agriculture production operations in Iowa.</p>
            `,
        'id' : 'Naeve Ag Production',
    },
    {
        'highlights' : ['wordpress','php'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/perdueanimal_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/perdueanimal_mobile.webp',
        'agency' : 'donovan',
        'url' : 'https://www.perdueanimalnutrition.com',
        'copy': 
            `
            <p>This is a brochure website created for Perdue Animal Nutrition's feed division.</p>
            <p>As the lead developer on this project, I'm especially proud of the Weekly Dairy Report feature. This custom-built widget enables the client to upload standardized PDFs, which are then automatically parsed and displayed on the homepage in a clean, readable format.</p>
            `,
        'id' : 'Perdue Animal Nutrition',
    },
    {
        'highlights' : ['wordpress','php','salsify','woo'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrims_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrims_mobile.webp',
        'agency' : 'donovan',
        'url' : 'https://pilgrimsusa.com',
        'copy': 
            `
            <p>This branded website for a multi-national food company sported the unique challenging of integrating product accent colors with third-party plugins, including WooCommerce.</p>
            <p>Additionally, this website hosts a custom-solution API with Salsify, allowing the client to synchronize their products data with the products on their website, seamlessly & automatically.</p>
            `,
        'id' : 'Pilgrims USA',
    },
    {
        'highlights' : ['wordpress','php','syndigo'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrimsfoodservice_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrimsfoodservice_mobile.webp',
        'agency' : 'donovan',
        'url' : '',
        'copy': 
            `
            <p>This website hosted a custom-solution API with Syndigo, allowing the client to synchronize their products data with the products on their website, seamlessly & automatically.</p>
            <p>Note: this site is no longer in service</p>
            `,
        'id' : 'Pilgrims Foodservice',
    },
    // {
    //     'highlights' : ['wordpress'],
    //     'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/ryanblack_desktop.webp',
    //     'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/ryanblack_mobile.webp',
    //     'agency' : '',
    // 'copy': 
    //  
    // `
    // `,    
    // 'id' : 'ryanblack',
    // }
    {
        'highlights' : ['wordpress','php','react'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/sunnyvalley_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/sunnyvalley_mobile.webp',
        'agency' : 'donovan',
        'url' : 'https://www.sunnyvalleysmokedmeats.com/',
        'copy': 
            `<p>A branded website for one of California's most prominent Smoked Meats providers</p>
            <p>As lead developer, I am especially proud of this website's use of subtle animations and responsiveness implementation of curved design elements.</p>`,

        'id' : 'Sunny Valley Meats',
    },
    {
        'highlights' : ['shopify'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/meijiamerica_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/meijiamerica_mobile.webp',
        'agency' : 'donovan',
        'url' : 'https://meijiamerica.com/',
        'copy': 
            `<p>A brochure site for the famous Japanese food company.</p>
            <p>As lead developer, I utilize custom & inline liquid code to achieve desired look for the client within the pre-existing theme.</p>`,
        'id' : 'Meiji America',
    },
    {
        'highlights' : ['wordpress','php'],
        'desktop' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrimspraise_desktop.webp',
        'mobile' : 'https://pub-260e094998904f71aded9ac9db8b350c.r2.dev/pilgrimspraise_mobile.webp',
        'agency' : 'donovan',
        'url': '',
        'copy': 
            `
            <p>This website served as a digital replacement for Pilgrims traditionally-paper employee appreciation cards.</p>
            <p>As lead developer, the simple single-page website was a welcomed change from the usual multi-page websites I work. The website features an employee identification verification system and automatic email mapping schema.</p>`,
        'id' : 'Pilgrims Praise',
    }
]

const hl_start_pos = 0;
const hl_display_start = 0;
const hl_display_end = 0.95;

export default function Showcase() {
    const svgRef = useRef(null);
    const [activeProject, setActiveProject] = useState(project_list[0]);
    const [activeHighlights, setActiveHighlights] = useState(null);
    const [monitorSwiper, setMonitorSwiper] = useState(null);
    const [phoneSwiper,   setPhoneSwiper]   = useState(null);

    useGSAP(()=>{
        //Position all highlights at the start
        if(svgRef.current){
            const highlightEls = document.querySelectorAll(".on-rail");
            if (highlightEls.length == 0) return;
            highlightEls.forEach(el => {
                const tooltipText = el.getAttribute('data-tooltip');
                if(tooltipText){
                    console.log("Added tooltip",tooltipText);
                    el.addEventListener('mousemove', evt => showTooltip(evt, tooltipText));
                    el.addEventListener('mouseleave', hideTooltip);
                }
            });

            

            gsap.set(highlightEls, {
                scale:0.5,
                attr: {
                    "data-position" : hl_start_pos,
                    "data-selected" : 'false',
                    "data-type" :  (i, target) => [...target.classList].filter(c => c !== 'on-rail').join(' ')
                },
                motionPath: {
                    path: '#highlight_path',
                    align: '#highlight_path',
                    alignOrigin: [0.5, 0.5],
                    // autoRotate: true,
                    end: hl_start_pos
                },
                opacity:0,
            });

            //debug
            // highlightEls.forEach((highlightEl,index)=>{
            //     console.log('set at',((index + 1) / highlightEls.length));
            //     gsap.set(highlightEl, {
            //         motionPath: {
            //             path: '#highlight_path',
            //             align: '#highlight_path',
            //             alignOrigin: [0.5, 0.5],
            //             // autoRotate: true,
            //             end: ((index + 1) / highlightEls.length)
            //         },
            //         opacity:1,
            //     });
            // })
            // gsap.to('#start', {
            //     motionPath: {
            //         path: '#highlight_path',
            //         align: '#highlight_path',
            //         alignOrigin: [0.5, 0.5],
            //         // autoRotate: true,
            //         duration:5,
            //         start: 0,
            //         end: hl_display_start
            //     },
            // });
            // gsap.set('#end', {
            //     motionPath: {
            //         path: '#highlight_path',
            //         align: '#highlight_path',
            //         alignOrigin: [0.5, 0.5],
            //         // autoRotate: true,
            //         end: hl_display_end
            //     },
            // });
        }

    }, {scope:svgRef, dependencies: []})

    useGSAP(()=>{
        //Set ActiveHighligths
        if(svgRef.current){
            setActiveHighlights(activeProject.highlights);
        }
    }, {scope:svgRef, dependencies: [activeProject]})

    useGSAP(()=>{
        //AnimationHighlights
        if(svgRef.current && activeHighlights){
            const highlightEls = document.querySelectorAll(".on-rail");
            const tl = animateHighlights(activeHighlights, highlightEls);
            if(tl){
                tl.then(()=>{
                    monitorSwiper.enable();
                    phoneSwiper.enable();
                })
                tl.duration(0.75).play();
            } else {
                monitorSwiper.enable();
                phoneSwiper.enable();
            }
        }
    }, {scope:svgRef, dependencies: [activeHighlights]})

    const handleSlideChange = (swiper) => {
        setActiveProject(project_list[swiper.activeIndex]);
        monitorSwiper.disable();
        phoneSwiper.disable();
    }

    const animateHighlights = (active_hls, all_highlights) => {
        const activeSet = new Set(active_hls);  
        const { old_news, new_news, leftover_news } =
        Array.from(all_highlights).reduce(
            (groups, el) => {
            const selected = el.dataset.selected === 'true';   
            const active   = activeSet.has(el.dataset.type);

            if (selected && !active)          groups.old_news.push(el);
            else if (!selected && active)     groups.new_news.push(el);
            else if (selected && active)      groups.leftover_news.push(el);

            return groups;
            },
            { old_news: [], new_news: [], leftover_news: [] }   
        );
        console.log('old_news',old_news, 'new_news',new_news,'leftover_news',leftover_news);
        
        if(leftover_news === activeSet) return;

        const tl = gsap.timeline({paused:true});
        // tl.addLabel('out').addLabel("in");
        
        //animate none active highlights out
        console.log("animate out old");
        old_news.forEach(highlight => {
            tl.set(highlight,{
                attr: {
                    "data-selected" : 'false',
                },
            });
            console.log(highlight.dataset.type, parseFloat(highlight.dataset.position));
            tl.to(highlight,{
                motionPath: {
                    path: '#highlight_path',
                    align: '#highlight_path',
                    alignOrigin: [0.5, 0.5],
                    // autoRotate: true,
                    fromCurrent: true,
                    start: parseFloat(highlight.dataset.position),
                    end: 1,
                },
                scale: 0.5,
                opacity: 0
            }, 'out')
        })

        const count = new_news.length + leftover_news.length;

        // if(old_news.length >0){
        //     return tl;
        // }

        //shiftover leftover highligts
        console.log("animate over");
        leftover_news.forEach((highlight,index) => {
            const f_pos = final_position(count - index, count);
            console.log(highlight.dataset.type, parseFloat(highlight.dataset.position), f_pos);
            tl.to(highlight,{
                motionPath: {
                    path: '#highlight_path',
                    align: '#highlight_path',
                    alignOrigin: [0.5, 0.5],
                    // autoRotate: true,
                    fromCurrent: true,
                    start: (i,target) => parseFloat(target.dataset.position),
                    end: f_pos,
                },
                attr: {
                    "data-position" : f_pos
                },
            }, 'out')
        });

        //animate new things in 
        console.log("animate new in");
        new_news.forEach((highlight,index) => {
            const f_pos = final_position(index+1 , count);
            console.log('f_pos of ',highlight,f_pos);
            tl.set(highlight,{
                attr: {
                    "data-selected" : 'true',
                    "data-position" : f_pos
                },
            });
            gsap.set(highlight, {
                y: parseFloat(highlight.dataset?.yoffset),
            });
           
            const y_offset = highlight.dataset?.yoffset ?  parseFloat(highlight.dataset.yoffset) : 0;
            const x_offset = highlight.dataset?.xoffset ? parseFloat(highlight.dataset.xoffset) : 0;
            
            tl.to(highlight,{
                motionPath: {
                    path: '#highlight_path',
                    align: '#highlight_path',
                    alignOrigin: 
                    [
                        0.5 + x_offset, 
                        0.5 + y_offset
                    ],
                    // autoRotate: true,
                    start: hl_start_pos,
                    end: f_pos,
                },
                scale: 1,
                opacity: 1
            }, 'out')
        })

        return tl;
        
    };

    const handleTileClick = (index) => {
        console.log("hello",monitorSwiper);
        if(!monitorSwiper) return;
        console.log(monitorSwiper);
        // return

        // const index = monitorSwiper.reduce([key];
        if (monitorSwiper && index !== undefined) {
            const scrollTo = monitorSwiper.el.getBoundingClientRect().top ;
            window.scrollTo({
                top: scrollTo,
                behavior: 'smooth',
            });
            setTimeout(() => {
                monitorSwiper.slideTo(index);
            }, 250);
        }
    }

    return (
        <div className='showcase'>
            <div className='devices'>
                <Swiper
                    className="monitor"
                    slidesPerGroup={1}
                    modules={[Controller]}
                    onSwiper={setMonitorSwiper}       
                    controller={{ control: phoneSwiper }}
                    style={{
                    '--bg':       `url(${monitor_bg.src})`,
                    '--bg-ratio': `${monitor_bg.width} / ${monitor_bg.height}`,
                    }}

                    onSlideChange={
                        (swiper) => handleSlideChange(swiper)
                    }
                >
                    {project_list.map( (project,index) => (
                        <SwiperSlide
                            data-project-id={project.id}
                            key={index}
                        >
                            <Image 
                                width="1920" 
                                height="1080" 
                                src={project.desktop} 
                                alt="desktop web page"
                                // style={{pointerEvents: "none"}}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>

                <Swiper
                    className="phone"
                    slidesPerGroup={1}
                    modules={[Controller]}
                    onSwiper={setPhoneSwiper}
                    controller={{ control: monitorSwiper }} 
                    style={{
                        '--bg':       `url(${phone_bg.src})`,
                        '--bg-ratio': `${phone_bg.width} / ${phone_bg.height}`,
                    }}
                    // onSlideChange={(swiper) => handleSlideChange(swiper)}
                >
                    {project_list.map( (project,index) => (
                        <SwiperSlide 
                            data-project-id={project.id}
                            key={index}
                        >
                            <Image
                                width="1080" 
                                height="1920" 
                                src={project.mobile} 
                                alt="mobile web page"
                             />
                        </SwiperSlide>
                    ))}
                </Swiper>
                <svg className='highlights' viewBox="0 0 40 10" ref={svgRef} preserveAspectRatio='meet'>
                    {/* <circle cx="0" cy="0" r="5" id="start" />
                    <circle cx="0" cy="0" r="5" id="end" /> */}
                    <path 
                        fill="transparent" 
                        stroke="transparent" 
                        strokeWidth="1px" 
                        id="highlight_path" 
                        d="M0,5 L40,5" 
                    />
                    <image data-tooltip='REST API' className="on-rail rest-api" width={5} height={5} href={restApi} />
                    <image data-tooltip='Salsify API' className="on-rail salsify" width={4.25} height={4.25}  href={salsify} />
                    {/* <image className="on-rail design" width={4} height={4}  href={design} /> */}
                    <image data-tooltip='GreenSock Animation Platform' className="on-rail greensock" width={7} height={5}  href={greensock} />
                    <image data-tooltip='Wordpress' className='on-rail wordpress' width={5} height={4.5}  href="https://upload.wikimedia.org/wikipedia/commons/9/98/WordPress_blue_logo.svg"/>
                    <image data-tooltip='React' className="on-rail react" width={5} height={5}  href="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" />
                    <image data-tooltip='PHP' className="on-rail php" width={6.5} height={5}  href="https://upload.wikimedia.org/wikipedia/commons/2/27/PHP-logo.svg" />
                    <image data-tooltip='Next.js' className="on-rail nextjs" width={5} height={5}  href={nextjs}/>
                    {/* <image className="on-rail solo-dev" width={7} height={4.5}  href={solo_dev.src} />
                    <image className="on-rail support-dev" width={7} height={4.5}  href={supporting_dev.src} />
                    <image className="on-rail paid-media" data-yoffset={-0.01} width={5.5} height={6}  href={paid_media.src} /> */}
                    <image data-tooltip='TypeScript' className="on-rail typescript" width={4.5} height={4.5}  href="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" />
                    <image data-tooltip='Python' className="on-rail python" width={5} height={5}  href={python} />
                    <image data-tooltip='HTML5' className="on-rail html5" width={5} height={5}  href={html5} />
                    <image data-tooltip='Shopify' className="on-rail shopify" width={9} height={5}  href={shopify} /> 
                    <image data-tooltip='Syndigo API' className="on-rail syndigo" width={5} height={5}  href={syndigo} />
                    <image data-tooltip='CSS3' className="on-rail css" width={5} height={4.5}  href="https://upload.wikimedia.org/wikipedia/commons/a/ab/Official_CSS_Logo.svg" />
                    <image data-tooltip='WooCommerce' className="on-rail woo" width={5} height={4.5}  href="https://upload.wikimedia.org/wikipedia/commons/2/2a/WooCommerce_logo.svg" />
                    <image data-tooltip='Google OAuth' className="on-rail google-auth" width={5} height={4.5}  href="https://upload.wikimedia.org/wikipedia/commons/3/3a/GDevs.svg" />
                    <image data-tooltip='Google Sheets API' className="on-rail google-sheets" width={5} height={4.5}  href="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" />
                
                </svg>
            </div>

            {activeProject && (
            <div className='copy'>
                <h2>
                {activeProject?.url 
                    ?
                    (
                        <a className='link-out' href={activeProject?.url}>{activeProject?.id}</a>
                    )
                    :
                    (
                        activeProject?.id
                    )
                }
                </h2>
                <GetAgencyDisclaimer agency={activeProject.agency} />
                <div class='brief' dangerouslySetInnerHTML={{ __html: activeProject?.copy}}></div>
            </div>
            )}

            <div className='tiles'>
                {project_list.map( (project,index) => {
                    const image = project?.desktop ? project.desktop : project?.mobile;
                    return (
                    <div key={index} role='button' onClick={()=>{handleTileClick(index)}} className='tile' style={{ '--bg-url' : `url(${image})`}}>
                        <h3>{project.id}</h3>
                    </div>
                    )
                })}
            </div>
        </div>
    )
}

const GetAgencyDisclaimer = ({agency}) => {
    switch (agency) {
        case 'donovan':
            return (
                <div className="agency">
                    <span>Made in partnership with</span>
                    <a href='https://donovanadv.com'><Donovan /></a>
                </div>
            );
        case '':
        default:
            return (
                <div className="agency"></div>
            )
    }
}

const final_position = (i, count) =>{
    return hl_display_start + (i / (count + 1 )) * (hl_display_end - hl_display_start);
}

