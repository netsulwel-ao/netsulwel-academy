"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PixelText } from "./PixelText";

const faqs = [
 {
 question: "Preciso saber programar ou investir para começar?",
 answer:
 "Não! Temos trilhas do absoluto zero em cada área — programação, finanças pessoais, tech e investimentos. Se já tem base, pule para o nível intermediário ou avançado.",
 },
 {
 question: "Por quanto tempo tenho acesso?",
 answer:
 "No plano Explorer, o acesso introdutório é gratuito e permanente. Nos planos pagos, o acesso é enquanto a assinatura estiver ativa, exceto no Elite que inclui acesso vitalício.",
 },
 {
 question: "As aulas são ao vivo ou gravadas?",
 answer:
 "A maior parte do conteúdo é gravada para você assistir no seu ritmo. As mentorias e workshops são ao vivo, com gravação disponível depois.",
 },
 {
 question: "Posso cancelar a qualquer momento?",
 answer:
 "Sim. Sem multa, sem burocracia. Cancele quando quiser pelo painel da sua conta.",
 },
];

export function FAQ() {
 const [openIndex, setOpenIndex] = useState<number | null>(0);

 return (
 <section id="faq" className="py-20 md:py-28">
 <div className="mx-auto max-w-3xl px-6">
 <div className="text-center">
 <PixelText size="md" className="text-purple-light">
 {"// faq"}
 </PixelText>
 <h2 className="mt-4 text-3xl font-bold md:text-4xl">
 Perguntas frequentes
 </h2>
 </div>

 <div className="mt-12 space-y-3">
 {faqs.map((faq, index) => (
 <div
 key={faq.question}
 className="overflow-hidden border border-gray-700 bg-gray-800/50 transition-colors hover:border-gray-600"
 >
 <button
 type="button"
 className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-semibold text-gray-100"
 onClick={() =>
 setOpenIndex(openIndex === index ? null : index)
 }
 aria-expanded={openIndex === index}
 >
 {faq.question}
 <ChevronDown
 className={`h-5 w-5 shrink-0 text-purple-light transition-transform duration-300 ${
 openIndex === index ? "rotate-180" : ""
 }`}
 />
 </button>
 <div
 className={`grid transition-all duration-300 ${
 openIndex === index
 ? "grid-rows-[1fr] opacity-100"
 : "grid-rows-[0fr] opacity-0"
 }`}
 >
 <div className="overflow-hidden">
 <div className="border-t border-gray-700 px-6 py-4 text-sm leading-relaxed text-gray-300">
 {faq.answer}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
