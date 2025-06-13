/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  images: {
    domains: ["placehold.co","pub-260e094998904f71aded9ac9db8b350c.r2.dev"]
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'placehold.co',
    //     pathname: '/**',  // match every placeholder size / colour combo
    //   },
    // ],
  },
   webpack(config) {
    // Exclude SVGs from Next.js's default file-loader
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/;
    }

    // Add SVGR loader 
    config.module.rules.push({
      test: /\.svg$/,
      oneOf: [
        {
          issuer: /\.[jt]sx?$/, // If the SVG is imported in a JS/TS file
          use: ['@svgr/webpack', 'url-loader'],
        },
        {
          type: 'asset/resource', // If imported in a CSS/Sass file
        },
      ],
    });

    return config;
  },
}

module.exports = nextConfig