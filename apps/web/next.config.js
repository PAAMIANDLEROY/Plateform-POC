/** @type {import('next').NextConfig} */

// Permet de surcharger le basePath via NEXT_PUBLIC_BASE_PATH.
// - GitHub Pages CI : NEXT_PUBLIC_BASE_PATH=/Plateform-POC
// - Vercel / localhost : variable absente → basePath = ""
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : "",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
