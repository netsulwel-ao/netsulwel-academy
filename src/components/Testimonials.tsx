import { Star, Quote } from "lucide-react";
import { Reveal } from "./motion/Reveal";

const testimonials = [
  {
    name: "Ana Silva",
    role: "Analista Financeira",
    avatar: "AS",
    color: "bg-purple/20 text-purple-light",
    text: "As trilhas de finanças são muito práticas e o suporte da comunidade é incrível. Consegui minha primeira certificação em 3 meses.",
    rating: 5,
    result: "Certificada em 3 meses",
  },
  {
    name: "João Mendes",
    role: "Dev Júnior → Pleno",
    avatar: "JM",
    color: "bg-green/20 text-green",
    text: "Vim do zero em programação e hoje trabalho com React e TypeScript. Os projetos reais fizeram toda a diferença no meu portfólio.",
    rating: 5,
    result: "Contratado em 6 meses",
  },
  {
    name: "Marta Lopes",
    role: "Investidora Individual",
    avatar: "ML",
    color: "bg-amber-500/20 text-amber-300",
    text: "Finalmente uma plataforma que ensina investimentos de verdade. A mentoria 1:1 foi um divisor de águas na minha estratégia.",
    rating: 5,
    result: "+40% rendimento anual",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 border-t border-gray-800">
      <div className="mx-auto max-w-6xl px-6">

        {/* Layout dividido — texto à esquerda, cards à direita */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[300px_1fr] items-start">

          {/* Coluna esquerda — contexto */}
          <Reveal x={-24} y={0}>
          <div className="lg:sticky lg:top-32">
            <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-purple-light mb-4">
              depoimentos reais
            </p>
            <h2 className="text-3xl font-extrabold leading-tight text-gray-100 md:text-4xl">
              Resultados de quem
              <br />
              já{" "}
              <span className="gradient-text">começou</span>
            </h2>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              Mais de 50 mil alunos. Estas são as histórias deles.
            </p>

            {/* Rating geral */}
            <div className="mt-8 inline-flex flex-col gap-1 border border-gray-800 bg-gray-900 p-4">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((i, idx) => (
                  <Reveal key={i} y={0} delay={idx * 0.08} once>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </Reveal>
                ))}
              </div>
              <p className="text-2xl font-extrabold text-gray-100 font-mono">4.9<span className="text-gray-600 text-sm font-sans ml-1">/ 5.0</span></p>
              <p className="text-sm text-gray-600">Média de mais de 12 mil avaliações</p>
            </div>
          </div>
          </Reveal>

          {/* Coluna direita — cards em cascata */}
          <div className="space-y-4">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.12} y={36}>
              <div
                className={`group relative border border-gray-800 bg-gray-900 p-6 transition-all duration-300 hover:border-gray-600 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/5 ${
                  i === 1 ? "md:ml-8" : i === 2 ? "md:ml-4" : ""
                }`}
              >
                <Quote className="absolute top-4 right-4 h-6 w-6 text-gray-800 transition-colors group-hover:text-purple/30" />

                {/* Resultado destacado */}
                <div className="mb-4 inline-block font-mono text-sm text-green bg-green/10 border border-green/20 px-2 py-1">
                  ✓ {t.result}
                </div>

                <p className="text-sm leading-relaxed text-gray-300 mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center text-sm font-bold transition-transform group-hover:scale-110 ${t.color}`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-100">{t.name}</p>
                      <p className="text-sm text-gray-600">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
