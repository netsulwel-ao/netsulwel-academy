import {
 TrendingUp,
 Cpu,
 Wallet,
 LineChart,
 Users,
 BookOpen,
 Star,
} from "lucide-react";
import { BlurRotatingWords } from "./BlurRotatingWords";
import { PixelText } from "./PixelText";

const floatingIcons = [
 { Icon: Cpu, className: "top-[18%] left-[8%] text-purple-light/30", delay: "0s" },
 { Icon: Wallet, className: "top-[28%] right-[10%] text-green/25", delay: "1s" },
 { Icon: LineChart, className: "bottom-[32%] left-[12%] text-amber-400/20", delay: "2s" },
 { Icon: TrendingUp, className: "bottom-[28%] right-[8%] text-cyan-400/25", delay: "0.5s" },
];

export function Hero() {
 return (
 <section className="relative overflow-hidden pt-32 pb-24 md:pt-44 md:pb-36">
 <div className="pointer-events-none absolute inset-0 grid-bg" />
 <div className="pointer-events-none absolute inset-0 scanlines opacity-40" />
 <div className="pointer-events-none absolute top-1/4 left-1/2 h-[560px] w-[560px] -translate-x-1/2 bg-purple/25 blur-[130px] animate-pulse-glow" />
 <div className="pointer-events-none absolute top-1/3 right-[-5%] h-[340px] w-[340px] bg-green/15 blur-[110px]" />
 <div className="pointer-events-none absolute bottom-0 left-[-5%] h-[280px] w-[280px] bg-cyan-500/10 blur-[100px]" />

 {floatingIcons.map(({ Icon, className, delay }) => (
 <Icon
 key={className}
 className={`pointer-events-none absolute hidden h-10 w-10 animate-float md:block ${className}`}
 style={{ animationDelay: delay }}
 strokeWidth={1.25}
 aria-hidden
 />
 ))}

 <div className="relative mx-auto max-w-6xl px-6 text-center">
 <div className="mb-8 inline-flex items-center gap-3 border border-purple/40 bg-gray-900/90 px-4 py-2.5 backdrop-blur-sm">
 <span className="relative flex h-2 w-2 shrink-0">

 </span>

 </div>

 <h1 className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:gap-3 md:text-5xl lg:text-[3.5rem]">
 <span className="block text-balance">
 Leve sua carreira ao próximo {" "}
 <PixelText
 as="span"
 size="xl"
 className="inline-block align-middle text-green-light"
 >
 nivel
 </PixelText>{" "}
 em
 </span>
 <BlurRotatingWords className="w-full max-w-4xl" />
 </h1>

 <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
 Trilhas em{" "}
 <span className="text-purple-light">tech</span>,{" "}
 <span className="text-green-light">finanças</span> e{" "}
 <span className="text-amber-300">investimentos</span> — com projetos
 reais e uma comunidade que não te deixa parar no meio do caminho...
 </p>

 <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
 <a
 href="#planos"
 className="group glow-purple flex w-full items-center justify-center gap-2 bg-purple px-8 py-4 text-base font-semibold text-white transition-all hover:bg-purple-light sm:w-auto"
 >
 <TrendingUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
 Quero começar agora
 </a>
 <a
 href="#trilhas"
 className="flex w-full items-center justify-center gap-2 border border-gray-600 bg-gray-800/80 px-8 py-4 text-base font-semibold text-gray-100 backdrop-blur-sm transition-all hover:border-purple/50 hover:bg-gray-800 sm:w-auto"
 >
 <BookOpen className="h-5 w-5 text-purple-light" />
 Ver trilhas gratuitas
 </a>
 </div>

 <div className="mt-20 grid grid-cols-1 gap-6 border border-gray-800/80 bg-gray-900/40 p-6 backdrop-blur-md sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-gray-700/60 sm:p-8 ">
 <div className="flex flex-col items-center gap-2 sm:px-4">
 <Users className="h-5 w-5 text-purple-light" strokeWidth={1.75} />
 <p className="font-pixel text-lg text-gray-100 md:text-xl">+50k</p>
 <p className="text-sm text-gray-300">Alunos formados</p>
 </div>
 <div className="flex flex-col items-center gap-2 sm:px-4">
 <BookOpen className="h-5 w-5 text-green" strokeWidth={1.75} />
 <p className="font-pixel text-lg text-gray-100 md:text-xl">+200</p>
 <p className="text-sm text-gray-300">Aulas práticas</p>
 </div>
 <div className="flex flex-col items-center gap-2 sm:px-4">
 <Star className="h-5 w-5 fill-amber-400 text-amber-400" strokeWidth={1.75} />
 <p className="font-pixel text-lg text-gray-100 md:text-xl">4.9</p>
 <p className="text-sm text-gray-300">Avaliação média</p>
 </div>
 </div>
 </div>
 </section>
 );
}
