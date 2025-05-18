
import React from "react";

const Logo = React.forwardRef((props, ref) => {
  // console.log('props',props)
    const arrow_color = props?.arrowcolor ?? '#f000c5';
    const grad_start = props?.gradstart ?? '#4e38e9';
    const grad_stop = props?.gradstop ?? '#09f327';

    return (
      <svg
        width="55.340633mm"
        height="101.68129mm"
        viewBox="33.243542 46.394835 55.340633 102.68129"
        version="1.1"
        id="svg1"
        xmlns="http://www.w3.org/2000/svg"
        ref={ref}
        {...props}
      >
        <defs id="defs1">
          <linearGradient id="linearGradient1">
            <stop
              style={{ stopColor: grad_start, stopOpacity: 1 }}
              offset="0"
              id="stop1"
            />
            <stop
              style={{ stopColor:  grad_stop, stopOpacity: 1 }}
              offset="1"
              id="stop2"
            />
          </linearGradient>
          <radialGradient
            xlinkHref="#linearGradient1"
            id="radialGradient2"
            cx="37.627304"
            cy="50.778599"
            fx="40.627304"
            fy="50.778599"
            r="4.3837638"
            gradientUnits="userSpaceOnUse"
            style={{ transformOrigin: "37.627304px 50.778599px" }}
          />
        </defs>
        <g id='arrow'>

          <rect
            style={{
              fill: arrow_color,
              fillOpacity: 1,
              strokeWidth: 0.521,
              strokeDasharray: "none",
              paintOrder: "stroke fill markers",
            }}
            id="line1"
            width="74.523979"
            height="9"
            x="58.182587"
            y="4.7993693"
            ry="4.5"
            transform="rotate(45)"
            />
          <rect
            style={{
              fill: arrow_color,
              fillOpacity: 1,
              strokeWidth: 0.521,
              strokeDasharray: "none",
              paintOrder: "stroke fill markers",
            }}
            id="line2"
            width="74.523979"
            height="9"
            x="14.1"
            y="93"
            ry="4.5"
            />
          <circle
            style={{
              fill: "url(#radialGradient2)",
              strokeWidth: 0.272026,
              strokeDasharray: "none",
            }}
            id="circle1"
            cx="37.743542"
            cy="50.894836"
            r="4.5"
            />
            </g>
      </svg>
    );
  })


export default Logo;