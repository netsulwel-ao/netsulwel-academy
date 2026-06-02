import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para hosting Node.js (Hostinger, Render, Railway, etc.)
  output: "standalone",

  // Suprime erros de imagens externas (Pexels, R2, etc.)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.pexels.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },

  // Evita warnings desnecessários em produção
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
