"use client";

import {
  TrendingUp,
  Cpu,
  Wallet,
  LineChart,
  BookOpen,
  ArrowRight,
  Play,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { BlurRotatingWords } from "./BlurRotatingWords";
import { PixelText } from "./PixelText";
import { TransitionLink } from "./TransitionLink";
import { AnimatedCounter } from "./motion/AnimatedCounter";
import { fadeUp, staggerContainer } from "./motion/variants";

const STATS = [
  { label: "Alunos formados", to: 50, prefix: "+", suffix: "k", color: "text-purple-light", bar: "85%" },
  { label: "Aulas práticas", to: 200, prefix: "+", suffix: "", color: "text-green", bar: "70%" },
  { label: "Avaliação média", to: 4.9, decimals: 1, prefix: "", suffix: "★", color: "text-amber-300", bar: "98%" },
] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <section className="relative overflow-hidden pt-28 pb-0 md:pt-36">
        <StaticHero />
      </section>
    );
  }

  return (
    <motion.section className="relative overflow-hidden pt-28 pb-0 md:pt-36">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-30" />
      <motion.div
        className="pointer-events-none absolute top-0 left-1/3 h-[500px] w-[700px] -translate-x-1/2 bg-purple/20 blur-[140px]"
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/2 right-0 h-[300px] w-[300px] bg-green/10 blur-[120px]"
        animate={{ opacity: [0.5, 0.9, 0.5], x: [0, -20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          variants={staggerContainer(0.12, 0.1)}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16 items-start">
            {/* Left — headline + CTAs */}
            <div>
              {/* Eyebrow */}
              <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
                <motion.span
                  className="h-px w-8 bg-purple/60"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                />
                <PixelText size="sm" className="text-purple-light">{"// netsulwel_academy"}</PixelText>
              </motion.div>

              {/* Headline */}
              <motion.h1 variants={fadeUp} className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-[4rem]">
                <span className="block text-gray-100">Leve sua carreira</span>
                <span className="block text-gray-100">ao próximo{" "}
                  <PixelText as="span" size="lg" className="text-green-light">nivel</PixelText>
                </span>
                <span className="mt-2 block h-[4rem] sm:h-[4.5rem] md:h-[5rem] lg:h-[5.5rem]">
                  <BlurRotatingWords />
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-6 max-w-lg text-lg leading-relaxed text-gray-400">
                Cursos práticos em <span className="text-purple-light font-medium">tech</span>,{" "}
                <span className="text-green font-medium">finanças</span> e{" "}
                <span className="text-amber-300 font-medium">investimentos</span> — com projetos
                reais, mentorias ao vivo e uma comunidade que não deixa ninguém para trás.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
                <TransitionLink
                  href="/register"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group glow-purple flex items-center gap-2 bg-purple px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-purple-light"
                >
                  Começar grátis
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </TransitionLink>
              </motion.div>

              {/* Prova social inline */}
              <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4 border-t border-gray-800 pt-6">
                <div className="flex -space-x-2">
                  {["#7c3aed", "#00b37e", "#f59e0b", "#06b6d4", "#ec4899"].map((c, i) => (
                    <motion.div
                      key={i}
                      className="h-7 w-7 rounded-full border-2 border-gray-900 flex items-center justify-center text-[13px] font-bold text-white"
                      style={{ backgroundColor: c }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.07, type: "spring", stiffness: 300, damping: 18 }}
                    >
                      {["A", "J", "M", "R", "L"][i]}
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-gray-100">+50 mil alunos</span> já
                  transformaram a carreira
                </p>
              </motion.div>
            </div>

            {/* Right — stats card flutuante */}
            <motion.div
              variants={fadeUp}
              transition={{ delay: 0.35 }}
              className="relative lg:sticky lg:top-28"
            >
              <motion.div
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="border border-gray-700 bg-gray-900 p-6 space-y-5"
              >
                {/* Header do card */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <span className="text-sm font-mono text-gray-500 uppercase tracking-widest">Resumo da academia</span>
                  <span className="flex items-center gap-1.5">
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-green"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                    <span className="text-sm text-green font-medium">Ativo</span>
                  </span>
                </div>

                {/* Métricas */}
                {STATS.map((stat, i) => (
                  <div key={stat.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{stat.label}</span>
                      <AnimatedCounter
                        to={stat.to}
                        decimals={"decimals" in stat ? stat.decimals : 0}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        duration={1.6 + i * 0.15}
                        className={`text-sm font-bold font-mono ${stat.color}`}
                      />
                    </div>
                    <div className="h-1 w-full bg-gray-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: (stat.color as string).replace("text-", "") }}
                        initial={{ width: 0, opacity: 0.4 }}
                        whileInView={{ width: stat.bar }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}

                {/* CTA secundário */}
                <div className="pt-2 border-t border-gray-800">
                  <a
                    href="#planos"
                    className="group flex items-center justify-between text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <span>Ver planos e preços</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </motion.div>

              {/* Tag flutuante */}
              <motion.div
                className="absolute -bottom-4 -left-4 hidden lg:flex items-center gap-2 border border-green/30 bg-gray-950 px-3 py-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: [0, -8, 0] }}
                transition={{
                  opacity: { delay: 1.1, duration: 0.5 },
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.1 },
                }}
              >
                <TrendingUp className="h-4 w-4 text-green" />
                <span className="text-sm font-semibold text-green">+12% crescimento este mês</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Bottom strip — categorias disponíveis */}
          <motion.div variants={fadeUp} className="mt-20 flex flex-wrap items-center gap-0 border-t border-gray-800">
            {[
              { icon: Cpu, label: "Programação", color: "text-purple-light" },
              { icon: Wallet, label: "Finanças pessoais", color: "text-green" },
              { icon: LineChart, label: "Investimentos", color: "text-amber-300" },
              { icon: TrendingUp, label: "Mercado financeiro", color: "text-cyan-400" },
            ].map(({ icon: Icon, label, color }, i) => (
              <motion.div
                key={label}
                className="flex items-center gap-2 border-r border-gray-800 px-6 py-4 last:border-r-0 first:pl-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3 }}
              >
                <Icon className={`h-4 w-4 shrink-0 ${color}`} strokeWidth={1.5} />
                <span className="text-sm text-gray-500 whitespace-nowrap">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function StaticHero() {
  return (
    <div className="relative mx-auto max-w-6xl px-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-px w-8 bg-purple/60" />
        <PixelText size="sm" className="text-purple-light">{"// netsulwel_academy"}</PixelText>
      </div>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16 items-start">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-[4rem]">
            <span className="block text-gray-100">Leve sua carreira</span>
            <span className="block text-gray-100">ao próximo{" "}
              <PixelText as="span" size="lg" className="text-green-light">nivel</PixelText>
            </span>
            <span className="mt-2 block h-[4rem] sm:h-[4.5rem] md:h-[5rem] lg:h-[5.5rem]"><BlurRotatingWords /></span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-400">
            Cursos práticos em <span className="text-purple-light font-medium">tech</span>,{" "}
            <span className="text-green font-medium">finanças</span> e{" "}
            <span className="text-amber-300 font-medium">investimentos</span> — com projetos
            reais, mentorias ao vivo e uma comunidade que não deixa ninguém para trás.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <TransitionLink
              href="/register"
              className="glow-purple flex items-center gap-2 bg-purple px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-purple-light"
            >
              Começar grátis <ArrowRight className="h-4 w-4" />
            </TransitionLink>
          </div>
        </div>
      </div>
    </div>
  );
}
