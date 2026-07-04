/** @type {import('next').NextConfig} */

// `output: "export"` (site 100% statique) a été retiré : le déploiement se fait sur Vercel,
// qui gère le rendu dynamique. Les routes à id UUID (/courses/[id], /lms/[id]…) fonctionnent
// donc directement — plus besoin de pré-générer des ids ni de contourner via ?id=.
// Un build statique séparé pourra être réintroduit plus tard si besoin (ex. wrap mobile Capacitor).

const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
