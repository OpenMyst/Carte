/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        config.module.rules.push({
          test: /\.glsl$/,
          use: 'webpack-glsl-loader'
        });
    
        return config;
      },
};

export default nextConfig;
