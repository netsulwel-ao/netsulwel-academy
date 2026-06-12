import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Trails } from "@/components/Trails";
import { PublicCourses } from "@/components/PublicCourses";
import { Teachers } from "@/components/Teachers";
import { Testimonials } from "@/components/Testimonials";
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
  <Teachers />
  <Testimonials />
  <Pricing />
  <FAQ />
  <CTA />
 </main>
 <Footer />
 </>
 );
}
