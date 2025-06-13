import '@/styles/globals.scss';
import React from 'react';
import Menu from '@/components/Menu';
import Footer from '@/components/Footer';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Menu />
      <main id='page'>
        <Component {...pageProps}/>
      </main>
      <Footer />
      <div id='coverup'></div>
      <div id="tooltip"></div>
    </>
  )

}
