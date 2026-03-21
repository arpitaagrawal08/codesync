import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude wrtc from server-side bundle to prevent TypeError: t._onTimeout is not a function
      config.externals = config.externals || [];
      config.externals.push('wrtc');
    }
    return config;
  },
};

export default nextConfig;
