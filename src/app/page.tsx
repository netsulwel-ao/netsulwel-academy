import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Trails } from "@/components/Trails";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
 return (
 <>
 <Header />
 <main>
 <Hero />
 <Features />
 <Trails />
 <Pricing />
 <FAQ />
 <CTA />
 </main>
 <Footer />
 </>
 );
}
