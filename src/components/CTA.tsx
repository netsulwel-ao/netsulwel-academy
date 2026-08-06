import Link from "next/link";
import { ArrowRight, Rocket, CheckCircle2 } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 border-t border-gray-800/40">
      <div className="mx-auto max-w-6xl px-6">

        {/* Layout split — texto + acção */}
        <div className="relative overflow-hidden border border-gray-800/60 bg-gray-900/30 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-0">

          {/* Linha decorativa top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-purple/60 via-green/30 to-transparent" />

          {/* Fundo decorativo */}
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
          <div className="pointer-events-none absolute -right-20 top-1/2 -translate-y-1/2 h-64 w-64 bg-purple/10 blur-[80px]" />

          {/* Esquerda — conteúdo */}
          <div className="relative p-10 md:p-14">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-green mb-4">
              pronto para começar
            </p>
            <h2 className="text-3xl font-extrabold leading-tight text-gray-100 md:text-4xl">
              O próximo passo
              <br />
              é o <span className="gradient-text">mais fácil</span>.
            </h2>
            <p className="mt-4 max-w-md text-sm text-gray-500 leading-relaxed">
              Junte-se a mais de 50 mil alunos em tech, finanças e investimentos.
              Comece hoje — o primeiro acesso é gratuito.
            </p>

            {/* Checklist rápida */}
            <ul className="mt-6 space-y-2">
              {[
                "Sem cartão de crédito para começar",
                "Acesso imediato ao conteúdo gratuito",
                "Cancele quando quiser, sem burocracia",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="h-4 w-4 text-green/50 shrink-0" strokeWidth={1.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Direita — CTA grande */}
          <div className="relative border-t border-gray-800/60 md:border-t-0 md:border-l md:border-gray-800/60 p-10 md:p-14 flex flex-col items-center justify-center gap-6 min-w-[240px]">
            <Link
              href="/register"
              className="group glow-purple flex items-center gap-2 bg-purple px-8 py-4 text-sm font-bold text-white transition-all hover:bg-purple-light w-full justify-center"
            >
              <Rocket className="h-4 w-4" />
              Criar conta grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Já tenho conta → Entrar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
