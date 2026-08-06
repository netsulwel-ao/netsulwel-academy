import {
  Route,
  FolderCode,
  Users,
  Video,
  Award,
  Zap,
  type LucideIcon,
} from "lucide-react";

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
  tag: string;
}[] = [
  {
    icon: Route,
    title: "Trilhas guiadas",
    description: "Percursos do básico ao avançado com checkpoints e projetos para consolidar cada etapa.",
    tag: "estrutura",
  },
  {
    icon: FolderCode,
    title: "Projetos reais",
    description: "Portfólio com aplicações que o mercado exige — finanças, tech e investimentos na prática.",
    tag: "portfólio",
  },
  {
    icon: Users,
    title: "Comunidade ativa",
    description: "Tire dúvidas, faça networking e participe de desafios semanais com milhares de alunos.",
    tag: "network",
  },
  {
    icon: Video,
    title: "Mentoria ao vivo",
    description: "Sessões em grupo com especialistas para destravar bloqueios e acelerar sua evolução.",
    tag: "mentoria",
  },
  {
    icon: Award,
    title: "Certificados",
    description: "Comprove suas habilidades com certificados reconhecidos ao concluir cada trilha.",
    tag: "certificação",
  },
  {
    icon: Zap,
    title: "Stack atualizada",
    description: "Conteúdo alinhado ao mercado: Next.js, TypeScript, análise fundamental e muito mais.",
    tag: "relevância",
  },
];

export function Features() {
  return (
    <section id="comunidade" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">

        {/* Layout assimétrico — título à esquerda, lista à direita */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[280px_1fr] lg:gap-24 items-start">

          {/* Coluna sticky — título */}
          <div className="lg:sticky lg:top-32">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-purple-light mb-4">
              por que netsulwel
            </p>
            <h2 className="text-3xl font-extrabold leading-tight text-gray-100 md:text-4xl">
              Tudo que você
              <br />
              precisa para{" "}
              <span className="gradient-text">evoluir</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Não é só assistir vídeo. É aprender fazendo,
              com suporte real e uma comunidade que não te
              deixa desistir.
            </p>
            <div className="mt-8 h-px w-12 bg-purple/50" />
          </div>

          {/* Coluna direita — lista de features estilo manifesto */}
          <div className="space-y-0 divide-y divide-gray-800/60">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group flex items-start gap-6 py-6 transition-colors hover:bg-gray-900/30 px-2 -mx-2"
              >
                {/* Número */}
                <span className="mt-0.5 min-w-[2rem] font-mono text-xs text-gray-700 group-hover:text-purple-light/50 transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Ícone */}
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-gray-500 group-hover:border-purple/40 group-hover:text-purple-light transition-all">
                  <feature.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-100">{feature.title}</h3>
                    <span className="hidden sm:inline-block px-2 py-0.5 font-mono text-[10px] text-gray-600 border border-gray-800">
                      {feature.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
