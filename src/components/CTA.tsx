import Link from "next/link";
import { Rocket } from "lucide-react";
import { PixelText } from "./PixelText";

export function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden border border-purple/30 bg-gradient-to-br from-purple/25 via-gray-800 to-green/15 px-8 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
          <div className="pointer-events-none absolute inset-0 scanlines opacity-30" />
          <div className="relative">
            <PixelText size="md" className="mb-4 text-green-light">
              start_now
            </PixelText>
            <h2 className="text-3xl font-bold md:text-4xl">
              Pronto para o próximo{" "}
              <PixelText as="span" size="lg" className="text-purple-light">
                nivel
              </PixelText>
              ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-300">
              Junte-se a milhares de alunos em tech, finanças e investimentos.
              Comece hoje — o primeiro passo é grátis.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 bg-green px-8 py-4 font-semibold text-gray-900 transition-colors hover:bg-green-light"
            >
              <Rocket className="h-5 w-5" />
              Criar minha conta grátis
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
