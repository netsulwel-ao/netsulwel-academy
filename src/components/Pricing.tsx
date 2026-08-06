"use client";

import { Check, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Explorer",
    label: "Grátis para sempre",
    price: "0",
    currency: "",
    description: "Para conhecer a plataforma.",
    features: [
      "Aulas introdutórias",
      "Comunidade no Discord",
      "1 projeto guiado",
      "Certificado básico",
    ],
    cta: "Começar grátis",
    href: "/register",
    highlighted: false,
    tag: null,
  },
  {
    name: "Pro",
    label: "Mais popular",
    price: "14.900",
    currency: "Kz",
    description: "Acesso completo para quem quer acelerar.",
    features: [
      "Todas as trilhas desbloqueadas",
      "Mentorias ao vivo semanais",
      "Projetos para portfólio",
      "Certificados avançados",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    href: "/register",
    highlighted: true,
    tag: "popular",
  },
  {
    name: "Elite",
    label: "Máximo resultado",
    price: "39.900",
    currency: "Kz",
    description: "Mentoria individual e preparação completa.",
    features: [
      "Tudo do plano Pro",
      "Mentoria 1:1 mensal",
      "Revisão de currículo",
      "Simulados de entrevista",
      "Acesso vitalício",
    ],
    cta: "Falar com consultor",
    href: "/register",
    highlighted: false,
    tag: null,
  },
];

export function Pricing() {
  return (
    <section id="planos" className="py-24 md:py-32 border-t border-gray-800/40">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-green mb-4">
              planos e preços
            </p>
            <h2 className="text-3xl font-extrabold leading-tight text-gray-100 md:text-4xl">
              Invista no seu futuro
            </h2>
            <p className="mt-3 max-w-md text-sm text-gray-500 leading-relaxed">
              Comece de graça. Faça upgrade quando estiver pronto para ir mais longe.
            </p>
          </div>
          <p className="text-xs text-gray-600 font-mono">sem fidelização · cancela quando quiser</p>
        </div>

        {/* Tabela de planos — layout diferente */}
        <div className="grid grid-cols-1 gap-0 border border-gray-800/60 divide-y divide-gray-800/60 md:grid-cols-3 md:divide-y-0 md:divide-x">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 transition-colors ${
                plan.highlighted
                  ? "bg-gray-900/60"
                  : "bg-gray-900/20 hover:bg-gray-900/40"
              }`}
            >
              {/* Tag popular */}
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple" />
              )}

              {/* Header do plano */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">{plan.label}</span>
                  {plan.highlighted && <Sparkles className="h-3.5 w-3.5 text-purple-light" />}
                </div>
                <h3 className={`text-xl font-bold ${plan.highlighted ? "text-purple-light" : "text-gray-100"}`}>
                  {plan.name}
                </h3>
              </div>

              {/* Preço */}
              <div className="mb-6 pb-6 border-b border-gray-800/60">
                {plan.price === "0" ? (
                  <p className="text-3xl font-extrabold text-gray-100 font-mono">Grátis</p>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-gray-600">{plan.currency}</span>
                    <span className="text-3xl font-extrabold text-gray-100 font-mono">{plan.price}</span>
                    <span className="text-sm text-gray-600">/mês</span>
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-600">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-400">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={`group flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
                  plan.highlighted
                    ? "bg-purple text-white hover:bg-purple-light"
                    : "border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-100"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Nota */}
        <p className="mt-6 text-center text-xs text-gray-700 font-mono">
          Preços em Kwanza angolano (AOA) · Todos os planos incluem acesso à comunidade
        </p>
      </div>
    </section>
  );
}
