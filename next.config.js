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
          // ?url suffix → returns data URL (for use in <image href={} />)
          resourceQuery: /url/,
          use: ['url-loader'],
        },
        {
          // everything else → returns React component
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack'],
        },
        {
          type: 'asset/resource',
        },
      ],
    });

    return config;
  },
}

module.exports = nextConfig