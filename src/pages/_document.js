import { Html, Head, Main, NextScript } from 'next/document'
import { GoogleAnalytics } from '@next/third-parties/google'


export default function Document() {
  return (
    <Html lang="en">
      <Head>
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
