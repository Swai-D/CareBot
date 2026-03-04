/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // In Next.js 14, this is under experimental
    serverComponentsExternalPackages: [
      "@whiskeysockets/baileys",
      "ws",
      "bufferutil",
      "utf-8-validate",
      "pino",
      "pino-pretty",
      "link-preview-js"
    ],
  },
  // Zima baadhi ya features zinazoweza kuvuruga Baileys kwenye dev mode
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
};

export default nextConfig;
