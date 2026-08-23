import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para Hostinger Node.js Hosting (standalone output)
  output: "standalone",

  // Otimizações de Performance e Mobile
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  // Turbopack configuration (Next.js 16 default)
  turbopack: {},

  // Images
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.pexels.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    deviceSizes: [320, 375, 425, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers de segurança e caching
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://apis.google.com https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: r2.dev *.r2.dev https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://images.pexels.com https://cdn-icons-png.flaticon.com https://images.unsplash.com https://i.imgur.com",
              "media-src 'self' blob: https:",
              "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.groq.com https://*.r2.dev wss://*.livekit.cloud https://*.livekit.cloud",
              "frame-src 'self' https://www.google.com https://js.stripe.com https://www.paypal.com",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
