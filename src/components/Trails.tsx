import {
 Code2,
 TrendingUp,
 Layers,
 Clock,
 ArrowRight,
 Wallet,
 LineChart,
} from "lucide-react";
import { PixelText } from "./PixelText";
import type { LucideIcon } from "lucide-react";

const trails: {
 level: string;
 title: string;
 stack: string[];
 hours: string;
 icon: LucideIcon;
 color: string;
 badge: string;
}[] = [
 {
 level: "Iniciante",
 title: "Fundamentos & Finanças pessoais",
 stack: ["Excel", "Orçamento", "JavaScript"],
 hours: "40h",
 icon: Wallet,
 color: "border-green/40 bg-green/5",
 badge: "bg-green/20 text-green-light",
 },
 {
 level: "Intermediário",
 title: "Tech & Mercado financeiro",
 stack: ["React", "TypeScript", "B3"],
 hours: "80h",
 icon: LineChart,
 color: "border-purple/40 bg-purple/5",
 badge: "bg-purple/20 text-purple-light",
 },
 {
 level: "Avançado",
 title: "Investimentos & Arquitetura",
 stack: ["Next.js", "FIIs", "AWS"],
 hours: "60h",
 icon: TrendingUp,
 color: "border-purple-light/40 bg-purple-light/5",
 badge: "bg-purple-light/20 text-purple-light",
 },
];

export function Trails() {
 return (
 <section id="trilhas" className="py-20 md:py-28">
 <div className="mx-auto max-w-6xl px-6">
 <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
 <div>
 <PixelText size="md" className="text-green-light">
 {"// trilhas"}
 </PixelText>
 <h2 className="mt-4 text-3xl font-bold md:text-4xl">
 Escolha seu caminho
 </h2>
 <p className="mt-4 max-w-xl text-gray-300">
 Trilhas em programação, finanças, tecnologia e investimentos —
 do zero ao avançado.
 </p>
 </div>
 <a
 href="#trilhas"
 className="flex shrink-0 items-center gap-1 text-sm font-semibold text-purple-light transition-colors hover:text-purple"
 >
 Ver todas as trilhas
 <ArrowRight className="h-4 w-4" />
 </a>
 </div>

 <div className="mt-12 grid gap-6 md:grid-cols-3">
 {trails.map((trail) => (
 <article
 key={trail.title}
 className={`group border p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-purple/5 ${trail.color}`}
 >
 <div className="flex items-start justify-between">
 <span
 className={`inline-block px-3 py-1 text-xs font-semibold ${trail.badge}`}
 >
 {trail.level}
 </span>
 <div className="flex h-10 w-10 items-center justify-center border border-gray-700/50 bg-gray-900/50 text-purple-light">
 <trail.icon className="h-5 w-5" strokeWidth={1.75} />
 </div>
 </div>
 <h3 className="mt-4 text-xl font-bold text-gray-100">
 {trail.title}
 </h3>
 <div className="mt-4 flex flex-wrap gap-2">
 {trail.stack.map((tech) => (
 <span
 key={tech}
 className=" bg-gray-700/80 px-2.5 py-1 font-mono text-xs text-gray-300"
 >
 {tech}
 </span>
 ))}
 </div>
 <div className="mt-6 flex items-center justify-between border-t border-gray-700/50 pt-4">
 <span className="flex items-center gap-1.5 text-sm text-gray-300">
 <Clock className="h-3.5 w-3.5" />
 {trail.hours}
 </span>
 <a
 href="#planos"
 className="flex items-center gap-1 text-sm font-semibold text-purple-light hover:text-purple"
 >
 Começar
 <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
 </a>
 </div>
 </article>
 ))}
 </div>

 <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border border-dashed border-gray-700 py-4 text-gray-300">
 <span className="flex items-center gap-2 text-sm">
 <Code2 className="h-4 w-4 text-purple-light" />
 Programação
 </span>
 <span className="flex items-center gap-2 text-sm">
 <Wallet className="h-4 w-4 text-green" />
 Finanças
 </span>
 <span className="flex items-center gap-2 text-sm">
 <Layers className="h-4 w-4 text-cyan-400" />
 Tecnologia
 </span>
 <span className="flex items-center gap-2 text-sm">
 <TrendingUp className="h-4 w-4 text-amber-400" />
 Investimentos
 </span>
 </div>
 </div>
 </section>
 );
}
