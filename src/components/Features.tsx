import {
 Route,
 FolderCode,
 Users,
 Video,
 Award,
 Zap,
 type LucideIcon,
} from "lucide-react";
import { PixelText } from "./PixelText";

const features: {
 icon: LucideIcon;
 title: string;
 description: string;
}[] = [
 {
 icon: Route,
 title: "Trilhas guiadas",
 description:
 "Percursos estruturados do básico ao avançado, com checkpoints e projetos para consolidar cada etapa.",
 },
 {
 icon: FolderCode,
 title: "Projetos reais",
 description:
 "Construa portfólio com aplicações que o mercado exige — finanças, tech e investimentos na prática.",
 },
 {
 icon: Users,
 title: "Comunidade ativa",
 description:
 "Tire dúvidas, faça networking e participe de desafios semanais com milhares de alunos.",
 },
 {
 icon: Video,
 title: "Mentoria ao vivo",
 description:
 "Sessões em grupo com especialistas para destravar bloqueios e acelerar sua evolução.",
 },
 {
 icon: Award,
 title: "Certificados",
 description:
 "Comprove suas habilidades com certificados reconhecidos ao concluir cada trilha.",
 },
 {
 icon: Zap,
 title: "Stack atualizada",
 description:
 "Conteúdo alinhado ao mercado: Next.js, TypeScript, análise fundamental e muito mais.",
 },
];

export function Features() {
 return (
 <section id="comunidade" className="py-20 md:py-28">
 <div className="mx-auto max-w-6xl px-6">
 <div className="text-center">
 <PixelText size="md" className="text-purple-light">
 {"// por_que_netsul_academy"}
 </PixelText>
 <h2 className="mt-4 text-3xl font-bold md:text-4xl">
 Tudo que você precisa para{" "}
 <span className="gradient-text">evoluir de verdade</span>
 </h2>
 <p className="mx-auto mt-4 max-w-2xl text-gray-300">
 Não é só assistir vídeo. É aprender fazendo, com suporte e uma
 comunidade que não te deixa desistir no meio do caminho.
 </p>
 </div>

 <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
 {features.map((feature) => (
 <div
 key={feature.title}
 className="group relative overflow-hidden border border-gray-700 bg-gray-800/30 p-6 backdrop-blur-md transition-all hover:border-purple/50 hover:bg-gray-800/50"
 >
 <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 bg-purple/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
 <div className="flex h-12 w-12 items-center justify-center border border-purple/30 bg-purple/10 text-purple-light transition-colors group-hover:border-purple/60 group-hover:bg-purple/20">
 <feature.icon className="h-6 w-6" strokeWidth={1.75} />
 </div>
 <h3 className="mt-5 text-lg font-semibold text-gray-100">
 {feature.title}
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-gray-300">
 {feature.description}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
