import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Trails } from "@/components/Trails";
import { PublicCourses } from "@/components/PublicCourses";
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
  <PublicCourses />
  <Pricing />
  <FAQ />
  <CTA />
 </main>
 <Footer />
 </>
 );
}
