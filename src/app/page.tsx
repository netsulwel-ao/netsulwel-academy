import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Trails } from "@/components/Trails";
import { Features } from "@/components/Features";
import { PublicCourses } from "@/components/PublicCourses";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Teachers } from "@/components/Teachers";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";

export default function Home() {
  return (
    <PageTransition type="default" preserveScroll>
      <div className="h-screen overflow-y-auto">
      <Header />
      <main>
        {/* 1. Hook — quem és e o que fazes */}
        <Hero />

        {/* 2. Produto — o que vais aprender (trilhas primeiro, não features) */}
        <Trails />

        {/* 3. Cursos em destaque */}
        <PublicCourses />

        {/* 4. Por que nós — depois de mostrar o produto */}
        <Features />

        {/* 5. Prova social — validação antes do preço */}
        <Testimonials />

        {/* 6. Preços */}
        <Pricing />

        {/* 7. Quem ensina */}
        <Teachers />

        {/* 8. Dúvidas */}
        <FAQ />

        {/* 9. Conversão final */}
        <CTA />
      </main>
      <Footer />
      </div>
    </PageTransition>
  );
}
