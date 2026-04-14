import { Html, Head, Main, NextScript } from 'next/document'
import { GoogleAnalytics } from '@next/third-parties/google'
import gsap from "gsap";


export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="preload"
          href="/fonts/Nexa-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Nexa-Bold.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Nexa-Light.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Nexa-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Nexa-Regular.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Nexa-XBold.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <meta name="facebook-domain-verification" content="ijy2vr9nd17qmntw6uuhsz7ni79jch" />
        <GoogleAnalytics gaId="AW-17096430572" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
