import { Check, Sparkles } from "lucide-react";
import { PixelText } from "./PixelText";

const plans = [
 {
 name: "Explorer",
 price: "Grátis",
 period: "",
 description: "Para conhecer a plataforma e dar os primeiros passos.",
 features: [
 "Aulas introdutórias",
 "Comunidade no Discord",
 "1 projeto guiado",
 "Certificado básico",
 ],
 cta: "Começar grátis",
 highlighted: false,
 },
 {
 name: "Pro",
 price: "Kz 14.900",
 period: "/mês",
 description: "Acesso completo para quem quer acelerar a carreira.",
 features: [
 "Todas as trilhas liberadas",
 "Mentorias ao vivo semanais",
 "Projetos para portfólio",
 "Certificados avançados",
 "Suporte prioritário",
 ],
 cta: "Assinar Pro",
 highlighted: true,
 },
 {
 name: "Elite",
 price: "Kz 39.900",
 period: "/mês",
 description: "Mentoria individual e preparação para o mercado.",
 features: [
 "Tudo do plano Pro",
 "Mentoria 1:1 mensal",
 "Revisão de currículo",
 "Simulados de entrevista",
 "Acesso vitalício ao conteúdo",
 ],
 cta: "Falar com consultor",
 highlighted: false,
 },
];

export function Pricing() {
 return (
 <section id="planos" className="py-20 md:py-28">
 <div className="mx-auto max-w-6xl px-6">
 <div className="text-center">
 <PixelText size="md" className="text-green-light">
 {"// planos"}
 </PixelText>
 <h2 className="mt-4 text-3xl font-bold md:text-4xl">
 Invista no seu futuro
 </h2>
 <p className="mx-auto mt-4 max-w-xl text-gray-300">
 Comece de graça e faça upgrade quando estiver pronto para ir além.
 </p>
 </div>

 <div className="mt-16 grid gap-8 lg:grid-cols-3">
 {plans.map((plan) => (
 <div
 key={plan.name}
 className={`relative flex flex-col border p-8 backdrop-blur-md transition-transform ${
 plan.highlighted
 ? "z-10 border-purple bg-gray-800/60 glow-purple lg:scale-105"
 : "border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50"
 }`}
 >
 {plan.highlighted && (
 <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 bg-purple px-4 py-1 text-xs font-bold text-white">
 <Sparkles className="h-3 w-3" />
 Mais popular
 </span>
 )}
 <h3 className="text-lg font-semibold text-gray-100">
 {plan.highlighted ? (
 <PixelText size="md" className="text-purple-light">
 {plan.name}
 </PixelText>
 ) : (
 plan.name
 )}
 </h3>
 <div className="mt-4 flex items-baseline gap-1">
 <span className="text-4xl font-extrabold text-gray-100">
 {plan.price}
 </span>
 {plan.period && (
 <span className="text-gray-300">{plan.period}</span>
 )}
 </div>
 <p className="mt-3 text-sm text-gray-300">{plan.description}</p>
 <ul className="mt-8 flex-1 space-y-3">
 {plan.features.map((feature) => (
 <li
 key={feature}
 className="flex items-center gap-2 text-sm text-gray-300"
 >
 <Check
 className="h-4 w-4 shrink-0 text-green"
 strokeWidth={2.5}
 />
 {feature}
 </li>
 ))}
 </ul>
 <a
 href="#planos"
 className={`mt-8 block py-3 text-center text-sm font-semibold transition-colors ${
 plan.highlighted
 ? "bg-green text-gray-900 hover:bg-green-light"
 : "border border-gray-600 text-gray-100 hover:border-gray-300"
 }`}
 >
 {plan.cta}
 </a>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
