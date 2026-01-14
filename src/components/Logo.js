
import React from "react";

const Logo = React.forwardRef((props, ref) => {
  // console.log('props',props)
    const arrow_color = props?.arrowcolor ?? '#f000c5';
    const grad_start = props?.gradstart ?? '#4e38e9';
    const grad_stop = props?.gradstop ?? '#09f327';
    
    return (
      <svg
        id="Layer_1"
        data-name="Layer 1"
        viewBox="0 0 584.61847 179.80663"
        version="1.1"
        width="584.61847"
        height="179.80663"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/2000/svg"
        ref={ref}
        {...props}
      >
        <defs id="defs2">
          <linearGradient
            id="linear-gradient"
            x1="262.32999"
            y1="546.90997"
            x2="363.23001"
            y2="546.90997"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#2d388a" id="stop1" />
            <stop offset="1" stopColor="#00aeef" id="stop2" />
          </linearGradient>
        </defs>
        <g id="g2" transform="translate(-262.325,-454.21838)">
          <polyline
            style={{
              fill: 'none',
              stroke: 'url(#linear-gradient)',
              strokeWidth: '27.57px',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            points="276.11 620.24 349.45 546.91 276.11 473.57"
            id="polyline2"
          />
          <circle
            fill="#00aeef"
            cx="388.38"
            cy="546.90997"
            r="18.469999"
            id="circle2"
          />
        </g>
        <text
          style={{
            fill: 'currentColor',
            fontFamily: 'Nexa',
            fontSize: '92.07px',
            fontWeight: 700,
          }}
          id="text3"
          x="173.855"
          y="69.951622"
        >
          <tspan x="173.855" y="69.951622" id="tspan2">
            hohman
          </tspan>
          <tspan x="173.855" y="153.16162" id="tspan3">
            digital
          </tspan>
        </text>
      </svg>
    );
  })


export default Logo;