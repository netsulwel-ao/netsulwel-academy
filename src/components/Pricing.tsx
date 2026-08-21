"use client";

import { ArrowRight } from "lucide-react";
import { TransitionLink } from "./TransitionLink";
import { Reveal } from "./motion/Reveal";

export function Pricing() {
  return (
    <section id="cursos" className="py-24 md:py-32 border-t border-gray-800">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <Reveal>
        <div className="mb-16 text-center">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-green mb-4">
            cursos
          </p>
          <h2 className="text-3xl font-extrabold leading-tight text-gray-100 md:text-4xl">
            Invista no seu futuro
          </h2>
          <p className="mt-3 max-w-md mx-auto text-sm text-gray-500 leading-relaxed">
            Escolha os cursos que mais se adequam aos seus objectivos. Compre apenas o que precisa.
          </p>
        </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.15}>
        <div className="text-center">
          <TransitionLink
            href="/dashboard/cursos"
            className="inline-flex items-center gap-2 bg-purple text-white px-8 py-4 font-bold text-sm hover:bg-purple-light transition-colors"
          >
            Explorar Cursos
            <ArrowRight className="h-4 w-4" />
          </TransitionLink>
          <p className="mt-4 text-sm text-gray-600 font-mono">
            Compra individual · Sem fidelização
          </p>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
