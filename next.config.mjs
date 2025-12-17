/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuration pour PDF.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        path: false,
        crypto: false,
        canvas: false,
      };
    }

    // Pour le support de canvas (requis par PDF.js dans certains environnements)
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
  // Headers pour les fichiers .mjs
  async headers() {
    return [
      {
        source: "/pdf.worker.mjs",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
