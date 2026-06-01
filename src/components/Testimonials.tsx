import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana Silva",
    role: "Analista Financeira",
    avatar: "AS",
    color: "bg-purple/20 text-purple-light",
    text: "A Netsulwel Academy transformou a minha carreira. As trilhas de finanças são muito práticas e o suporte da comunidade é incrível. Consegui minha primeira certificação em 3 meses.",
    rating: 5,
  },
  {
    name: "João Mendes",
    role: "Desenvolvedor Júnior",
    avatar: "JM",
    color: "bg-green/20 text-green",
    text: "Vim do zero em programação e hoje trabalho com React e TypeScript graças às mentorias ao vivo. O conteúdo é atualizado e os projetos reais fizeram toda a diferença no meu portfólio.",
    rating: 5,
  },
  {
    name: "Marta Lopes",
    role: "Investidora Individual",
    avatar: "ML",
    color: "bg-amber-500/20 text-amber-300",
    text: "Finalmente uma plataforma que ensina investimentos de verdade. Aprendi a analisar FIIs e ações com os especialistas. A mentoria 1:1 do plano Elite foi um divisor de águas.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple-light">// depoimentos</p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Quem já faz parte da{" "}
            <span className="gradient-text">Netsulwel</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-300">
            Mais de 50 mil alunos já transformaram suas carreiras. Veja o que
            dizem sobre a experiência.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="group relative flex flex-col border border-gray-700 bg-gray-800/30 p-6 sm:p-8 backdrop-blur-md transition-all hover:border-purple/40 hover:bg-gray-800/50"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-purple/10" />
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center text-sm font-bold ${t.color}`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-100">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-300">
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-gray-500">
          <span className="h-px w-8 bg-gray-700" />
          <span>Média de avaliação 4.9 ⭐</span>
          <span className="h-px w-8 bg-gray-700" />
        </div>
      </div>
    </section>
  );
}
