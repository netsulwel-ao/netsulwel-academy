import {
  TrendingUp,
  Cpu,
  Wallet,
  LineChart,
  BookOpen,
  ArrowRight,
  Play,
} from "lucide-react";
import { BlurRotatingWords } from "./BlurRotatingWords";
import { PixelText } from "./PixelText";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-0 md:pt-36">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-30" />
      <div className="pointer-events-none absolute top-0 left-1/3 h-[500px] w-[700px] -translate-x-1/2 bg-purple/20 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 right-0 h-[300px] w-[300px] bg-green/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Eyebrow */}
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px w-8 bg-purple/60" />
          <PixelText size="sm" className="text-purple-light">{"// netsulwel_academy"}</PixelText>
        </div>

        {/* Main layout — assimétrico */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16 items-start">

          {/* Left — headline + CTAs */}
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-[4rem]">
              <span className="block text-gray-100">Leve sua carreira</span>
              <span className="block text-gray-100">ao próximo{" "}
                <PixelText as="span" size="lg" className="text-green-light">nivel</PixelText>
              </span>
              <span className="mt-2 block">
                <BlurRotatingWords className="inline-flex" />
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-400">
              Trilhas práticas em <span className="text-purple-light font-medium">tech</span>,{" "}
              <span className="text-green font-medium">finanças</span> e{" "}
              <span className="text-amber-300 font-medium">investimentos</span> — com projetos
              reais, mentorias ao vivo e uma comunidade que não deixa ninguém para trás.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="group glow-purple flex items-center gap-2 bg-purple px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-purple-light"
              >
                Começar grátis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#trilhas"
                className="flex items-center gap-2 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-100"
              >
                <span className="flex h-8 w-8 items-center justify-center border border-gray-700 bg-gray-800/60">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                Ver trilhas
              </a>
            </div>

            {/* Prova social inline */}
            <div className="mt-10 flex items-center gap-4 border-t border-gray-800/60 pt-6">
              <div className="flex -space-x-2">
                {["#7c3aed", "#00b37e", "#f59e0b", "#06b6d4", "#ec4899"].map((c, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full border-2 border-gray-900 flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: c }}
                  >
                    {["A", "J", "M", "R", "L"][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-gray-100">+50 mil alunos</span> já
                transformaram a carreira
              </p>
            </div>
          </div>

          {/* Right — stats card flutuante */}
          <div className="relative lg:sticky lg:top-28">
            <div className="border border-gray-700/60 bg-gray-900/60 backdrop-blur-xl p-6 space-y-5">
              {/* Header do card */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Resumo da academia</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
                  <span className="text-xs text-green font-medium">Ativo</span>
                </span>
              </div>

              {/* Métricas */}
              {[
                { label: "Alunos formados", value: "+50k", color: "text-purple-light", bar: "85%" },
                { label: "Aulas práticas", value: "+200", color: "text-green", bar: "70%" },
                { label: "Avaliação média", value: "4.9★", color: "text-amber-300", bar: "98%" },
                { label: "Trilhas disponíveis", value: "12", color: "text-cyan-400", bar: "60%" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{stat.label}</span>
                    <span className={`text-sm font-bold font-mono ${stat.color}`}>{stat.value}</span>
                  </div>
                  <div className="h-1 w-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-current opacity-40 rounded-full transition-all"
                      style={{ width: stat.bar, color: stat.color.replace("text-", "") }}
                    />
                  </div>
                </div>
              ))}

              {/* CTA secundário */}
              <div className="pt-2 border-t border-gray-800">
                <a
                  href="#planos"
                  className="flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <span>Ver planos e preços</span>
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Tag flutuante */}
            <div className="absolute -bottom-4 -left-4 hidden lg:flex items-center gap-2 border border-green/30 bg-gray-950/90 backdrop-blur-md px-3 py-2">
              <TrendingUp className="h-4 w-4 text-green" />
              <span className="text-xs font-semibold text-green">+12% crescimento este mês</span>
            </div>
          </div>
        </div>

        {/* Bottom strip — categorias disponíveis */}
        <div className="mt-20 flex flex-wrap items-center gap-0 border-t border-gray-800/50">
          {[
            { icon: Cpu, label: "Programação", color: "text-purple-light" },
            { icon: Wallet, label: "Finanças pessoais", color: "text-green" },
            { icon: LineChart, label: "Investimentos", color: "text-amber-300" },
            { icon: TrendingUp, label: "Mercado financeiro", color: "text-cyan-400" },
            { icon: BookOpen, label: "Trilhas guiadas", color: "text-pink-400" },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 border-r border-gray-800/50 px-6 py-4 last:border-r-0 first:pl-0"
            >
              <Icon className={`h-4 w-4 shrink-0 ${color}`} strokeWidth={1.5} />
              <span className="text-sm text-gray-500 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
