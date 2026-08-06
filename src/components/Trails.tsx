import {
  Code2,
  TrendingUp,
  Layers,
  Clock,
  ArrowRight,
  Wallet,
  LineChart,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const trails: {
  level: string;
  levelNum: string;
  title: string;
  subtitle: string;
  stack: string[];
  hours: string;
  modules: number;
  icon: LucideIcon;
  accent: string;
  borderAccent: string;
}[] = [
  {
    level: "Iniciante",
    levelNum: "01",
    title: "Fundamentos & Finanças pessoais",
    subtitle: "Ponto de partida — não exige conhecimento prévio",
    stack: ["Excel", "Orçamento", "JavaScript", "HTML/CSS"],
    hours: "40h",
    modules: 8,
    icon: Wallet,
    accent: "text-green",
    borderAccent: "border-l-green/60",
  },
  {
    level: "Intermediário",
    levelNum: "02",
    title: "Tech & Mercado financeiro",
    subtitle: "Para quem já tem base e quer acelerar",
    stack: ["React", "TypeScript", "B3", "API REST"],
    hours: "80h",
    modules: 14,
    icon: LineChart,
    accent: "text-purple-light",
    borderAccent: "border-l-purple/60",
  },
  {
    level: "Avançado",
    levelNum: "03",
    title: "Investimentos & Arquitetura",
    subtitle: "Especialização para o mercado profissional",
    stack: ["Next.js", "FIIs", "AWS", "Análise fundamentalista"],
    hours: "60h",
    modules: 10,
    icon: TrendingUp,
    accent: "text-amber-300",
    borderAccent: "border-l-amber-400/60",
  },
];

export function Trails() {
  return (
    <section id="trilhas" className="py-24 md:py-32 border-t border-gray-800/40">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-16 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-green mb-3">
              trilhas de aprendizagem
            </p>
            <h2 className="text-3xl font-extrabold leading-tight text-gray-100 md:text-4xl">
              Escolha onde começar
            </h2>
          </div>
          <a
            href="#planos"
            className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-100"
          >
            Aceder a todas as trilhas
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Trilhas — layout de timeline vertical + card horizontal */}
        <div className="space-y-4">
          {trails.map((trail, i) => (
            <article
              key={trail.title}
              className={`group relative border-l-2 ${trail.borderAccent} border border-gray-800/60 bg-gray-900/30 backdrop-blur-sm hover:bg-gray-900/50 transition-all`}
            >
              <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10">

                {/* Número grande */}
                <div className="hidden md:block">
                  <span className={`font-mono text-5xl font-extrabold opacity-20 ${trail.accent} group-hover:opacity-30 transition-opacity`}>
                    {trail.levelNum}
                  </span>
                </div>

                {/* Conteúdo central */}
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`font-mono text-xs font-bold uppercase tracking-wider ${trail.accent}`}>
                      {trail.level}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-gray-700" />
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      {trail.hours}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-gray-700" />
                    <span className="text-xs text-gray-600">{trail.modules} módulos</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-100 leading-snug">{trail.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{trail.subtitle}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {trail.stack.map((tech) => (
                      <span
                        key={tech}
                        className="font-mono text-xs text-gray-400 bg-gray-800/80 border border-gray-700/50 px-2.5 py-1"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA direita */}
                <div className="flex flex-col items-start md:items-end gap-3">
                  <a
                    href="#planos"
                    className={`group/btn flex items-center gap-2 border px-5 py-2.5 text-sm font-semibold transition-all ${
                      i === 1
                        ? "border-purple/50 bg-purple/10 text-purple-light hover:bg-purple/20"
                        : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-100"
                    }`}
                  >
                    Começar trilha
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </a>
                  {i === 1 && (
                    <span className="text-xs text-purple-light/60 font-mono">// mais popular</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Rodapé da secção — categorias */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-gray-600 py-6">
          <span className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green/50" strokeWidth={1.5} />
            Certificado incluído
          </span>
          <span className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green/50" strokeWidth={1.5} />
            Projetos para portfólio
          </span>
          <span className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green/50" strokeWidth={1.5} />
            Mentorias ao vivo
          </span>
          <span className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green/50" strokeWidth={1.5} />
            Acesso à comunidade
          </span>
        </div>
      </div>
    </section>
  );
}
