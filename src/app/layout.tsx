import type { Metadata } from "next";
import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthProvider";
import { TransitionProvider } from "@/contexts/TransitionContext";
import { TransitionOverlay } from "@/components/TransitionOverlay";
import { Toaster } from "sonner";

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

// ── Defaults ──────────────────────────────────────────────
const DEFAULT_TITLE = "Netsulwel Academy — Finanças, Tech e Investimentos";
const DEFAULT_DESCRIPTION = "Domine programação, finanças, tecnologia e investimentos com a Netsulwel Academy — trilhas práticas, mentoria e uma comunidade que impulsiona sua carreira.";
const DEFAULT_KEYWORDS = "tecnologia, finanças, investimentos, cursos online, angola, programação";

// ── Fetch settings via Firestore REST API (server-side) ───
async function fetchSEOSettings(): Promise<{ description: string; keywords: string }> {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/platform`;
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1h
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
  return {
    title: {
      default: DEFAULT_TITLE,
      template: "%s | Netsulwel Academy",
    },
    description,
    keywords: keywords.split(",").map((k) => k.trim()),
    authors: [{ name: "Netsulwel Academy" }],
    openGraph: {
      title: DEFAULT_TITLE,
      description,
      siteName: "Netsulwel Academy",
      locale: "pt_AO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description,
    },
    icons: {
      icon: "/Logo-Academy-White.svg",
    },
  };
}

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="pt-AO" className={`${inter.variable} ${pressStart.variable} scroll-smooth`}>
  <body className="min-h-screen bg-background text-foreground antialiased">
   <TransitionProvider>
    <AuthProvider>
      <TransitionOverlay />
      <div className="animate-in fade-in duration-300">
        {children}
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
 </body>
 </html>
 );
}
