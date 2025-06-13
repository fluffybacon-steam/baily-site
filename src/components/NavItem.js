import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import {gsap} from 'gsap';

const NavItem = (props) =>{
  const router = useRouter();

  const handleClick = (event, props) => {
    console.log("handleClick",event.target);
    event.preventDefault();
    // router.push(props.url);
    navItemToPageAnimation(props.number, props.url);
  }

  function navItemToPageAnimation(number, url){
    console.log('navItemToPageAnimation',number, url);
    // const boxes = document.querySelectorAll(`.shadowBox[data-num="${target.dataset.num}"]`);
    // console.log(boxes, `[data-num="${target.dataset.num}]"`);
    // gsap.to(boxes, {
    //     opacity: 0,
    // })
    const target= document.querySelector(`a[data-num="${number}"]`);
    const icon = target.querySelector('.icon-wrapper');
    const main = document.querySelector('main');
    const masthead = document.querySelector('#masthead');
    const coverup = document.querySelector("#coverup");
    if (icon) {

      const iconRect = icon.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
  

      const cloneIcon = icon.cloneNode(true);
  

      console.log('iconRect',iconRect);

      //For position
      const magicNum = 0;

      // cloneIcon.id = 'transition-icon';
      gsap.set(cloneIcon,
        {
          position: 'fixed',
          top  : `${iconRect.top - magicNum}px`,
          left : `${iconRect.left}px`,
          height: `${iconRect.height}px`,
          zIndex: 100
          // opacity: 0
        }
      );
      gsap.set(cloneIcon.querySelector('svg'),
        {
          height:  `100%`,
          width: 'auto',
        }
      );

      coverup.appendChild(cloneIcon);

      const to_page_tl = gsap.timeline({ 
        paused: true,
        onComplete: (e) => {
          console.log('onComplete', e, router, url);
          router.push(url, undefined, { shallow: true });
        }
      });
      
      to_page_tl.set('#coverup', {
        backgroundColor: "var(--background-color)",
        duration: 0.5,
      }, 'fade');

      const rootStyles = getComputedStyle(document.documentElement);
      const page_icon_ft_size = rootStyles.getPropertyValue('--page-icon-ft-size').trim();
      const page_icon_margin_top = rootStyles.getPropertyValue('--page-icon-margin-top').trim();
      const page_icon_height = rootStyles.getPropertyValue('--page-icon-height').trim();

      console.log(page_icon_ft_size,page_icon_margin_top,page_icon_height);

      to_page_tl.to(cloneIcon,{
        opacity: 1,
        fontSize: page_icon_ft_size,
        marginTop: page_icon_margin_top,
        height: page_icon_height,
        left: `${mainRect.left}px`,
        top: `${masthead.offsetHeight}px`,
        duration:2,
        ease: 'power1.inOut'
      }, 'move')

      to_page_tl.to(cloneIcon,{
        rotation: -15,
        duration: 1.5,
        ease: 'expo.inOut'
      }, 'move-=0.5')

      .to(cloneIcon, {
        rotation:  2,
        duration:   1,
        ease:      'none'
      }, 'move+=1')

      .to(cloneIcon, {
        rotation:  0,
        duration:   0.5,
        ease:      'none'
      });

    //   router.push(url);

      to_page_tl.duration(2).play();

    }
    
  }

  return (
    <>
      <Link 
        href={props.url} 
        data-num={props.number} 
        style={{gridArea:props.grid_area}}
        onClick={(e) => handleClick(e,props)}
      >
        <h2>
          {props.title}
        </h2>
        <div className='icon-wrapper'>{props.icon}</div>
        <p>{props.excerpt}</p>
      </Link>
      <div data-num={props.number} className={"shadowBox shadowBox-top"} style={{ gridArea: props.grid_area }}></div>
      <div data-num={props.number} className={"shadowBox shadowBox-right"} style={{ gridArea: props.grid_area }}></div>
      <div data-num={props.number} className={"shadowBox shadowBox-bottom"} style={{ gridArea: props.grid_area }}></div>
      <div data-num={props.number} className={"shadowBox shadowBox-left"} style={{ gridArea: props.grid_area }}></div>
    </>
  )
}

export default NavItem;