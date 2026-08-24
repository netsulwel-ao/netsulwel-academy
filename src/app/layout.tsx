import type { Metadata } from "next";
import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthProvider";
import { TransitionProvider } from "@/contexts/TransitionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";

const ANTI_FOUC_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch(e) {}
})();
`;

const inter = Inter({
 variable: "--font-inter",
 subsets: ["latin"],
 display: "swap",
 preload: true,
});

const pressStart = Press_Start_2P({
 variable: "--font-press-start",
 weight: "400",
 subsets: ["latin"],
 display: "swap",
 preload: false,
});

import Script from "next/script";

// ── Defaults ──────────────────────────────────────────────
const SITE_NAME = "Netsulwel Academy";
const DEFAULT_DESCRIPTION = "Domine programação, finanças, tecnologia e investimentos com a Netsulwel Academy — trilhas práticas, mentorias ao vivo e uma comunidade que impulsiona a sua carreira.";
const DEFAULT_KEYWORDS = "tecnologia, finanças, investimentos, cursos online, angola, programação, mentoria, trilhas de aprendizagem, netsulwel";
const SITE_URL = "https://netsulwel.tech";

// ── Fetch settings via Firestore REST API (server-side) ───
async function fetchSEOSettings(): Promise<{ description: string; keywords: string }> {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/platform`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { description: DEFAULT_DESCRIPTION, keywords: DEFAULT_KEYWORDS };
    const data = await res.json();
    const fields = data.fields ?? {};
    const meta = fields.meta?.mapValue?.fields ?? {};
    return {
      description: meta.description?.stringValue || DEFAULT_DESCRIPTION,
      keywords: meta.keywords?.stringValue || DEFAULT_KEYWORDS,
    };
  } catch {
    return { description: DEFAULT_DESCRIPTION, keywords: DEFAULT_KEYWORDS };
  }
}

// ── Viewport ──────────────────────────────────────────────
export const viewport = "width=device-width, initial-scale=1.0, viewport-fit=cover";

// ── generateMetadata ──────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const { description, keywords } = await fetchSEOSettings();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    description,
    url: SITE_URL,
    logo: `${SITE_URL}/Logo-Academy-White.svg`,
    sameAs: [],
    address: {
      "@type": "PostalAddress",
      addressCountry: "AO",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "AOA",
      lowPrice: "0",
      offerCount: "20+",
    },
    areaServed: {
      "@type": "Country",
      name: "Angola",
    },
    knowsLanguage: ["pt", "en"],
    hasCourse: [
      {
        "@type": "Course",
        name: "Fundamentos & Finanças Pessoais",
        description: "Ponto de partida em programação e finanças — não exige conhecimento prévio.",
        provider: { "@type": "Organization", name: SITE_NAME },
        courseLevel: "Beginner",
        timeRequired: "40h",
        numberOfCredits: 8,
      },
      {
        "@type": "Course",
        name: "Tech & Mercado Financeiro",
        description: "React, TypeScript, B3 e API REST para quem já tem base e quer acelerar.",
        provider: { "@type": "Organization", name: SITE_NAME },
        courseLevel: "Intermediate",
        timeRequired: "80h",
        numberOfCredits: 14,
      },
      {
        "@type": "Course",
        name: "Investimentos & Arquitetura",
        description: "Next.js, FIIs, AWS e análise fundamentalista — especialização profissional.",
        provider: { "@type": "Organization", name: SITE_NAME },
        courseLevel: "Advanced",
        timeRequired: "60h",
        numberOfCredits: 10,
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "50000",
      bestRating: "5",
    },
  };

  return {
    metadataBase: new URL(SITE_URL),
    title: SITE_NAME,
    description,
    keywords: keywords.split(",").map((k) => k.trim()),
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "pt_AO",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      images: [
        {
          url: `/og?v=2`,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — Cursos de Tech, Finanças e Investimentos`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: [`/og?v=2`],
      creator: "@netsulwel",
    },
    icons: {
      icon: [
        { url: "/favicon-64.png", sizes: "64x64", type: "image/png" },
        { url: "/Logo-Academy-White.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/manifest.json",
    other: {
      "application-name": SITE_NAME,
      "theme-color": "#1a1a2e",
      "og:see_also": SITE_URL,
      "structured-data": JSON.stringify(structuredData),
    },
  };
}

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="pt-AO" data-theme="dark" className={`${inter.variable} ${pressStart.variable} scroll-smooth`}>
  <head>
    <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC_SCRIPT }} />
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: SITE_NAME,
          description: DEFAULT_DESCRIPTION,
          url: "https://netsulwel.tech",
          logo: "https://netsulwel.tech/Logo-Academy-White.svg",
          address: { "@type": "PostalAddress", addressCountry: "AO" },
          areaServed: { "@type": "Country", name: "Angola" },
          knowsLanguage: ["pt", "en"],
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            ratingCount: "50000",
            bestRating: "5",
          },
          hasCourse: [
            {
              "@type": "Course",
              name: "Fundamentos & Finanças Pessoais",
              description: "Programação e finanças — sem conhecimento prévio.",
              courseLevel: "Beginner",
              timeRequired: "40h",
            },
            {
              "@type": "Course",
              name: "Tech & Mercado Financeiro",
              description: "React, TypeScript, B3 e API REST.",
              courseLevel: "Intermediate",
              timeRequired: "80h",
            },
            {
              "@type": "Course",
              name: "Investimentos & Arquitetura",
              description: "Next.js, FIIs, AWS e análise fundamentalista.",
              courseLevel: "Advanced",
              timeRequired: "60h",
            },
          ],
        }),
      }}
    />
    <meta name="application-name" content={SITE_NAME} />
    <meta name="theme-color" content="#1a1a2e" />
    <meta name="msapplication-TileColor" content="#1a1a2e" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
    <meta name="geo.region" content="AO" />
    <meta name="geo.placename" content="Luanda" />
  </head>
  <body className="bg-background text-foreground antialiased">
    <ThemeProvider>
    <TransitionProvider>
    <AuthProvider>
      <div className="app-scale-wrapper">
        <div className="animate-in fade-in duration-300">
          {children}
        </div>
      </div>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: "var(--font-inter), system-ui, sans-serif" },
        }}
      />
    </AuthProvider>
   </TransitionProvider>
   </ThemeProvider>
 </body>
 </html>
 );
}
