"use client";

import { useState, useEffect } from "react";
import { BookOpen, Radio, Users, GraduationCap, ChevronRight, ChevronLeft, X, ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface Step {
  icon: typeof BookOpen;
  title: string;
  desc: string;
  highlight?: string;
}

const STEPS: Step[] = [
  {
    icon: GraduationCap,
    title: "Bem-vindo à Netsulwel Academy!",
    desc: "Vamos mostrar-te os principais lugares para começares a tua jornada de aprendizagem.",
  },
  {
    icon: BookOpen,
    title: "Explora os Cursos",
    desc: "No menu lateral encontras 'Meus Cursos' com todo o catálogo. Usa os filtros para encontrar o curso ideal para ti.",
    highlight: "Navegação",
  },
  {
    icon: Radio,
    title: "Aulas ao Vivo",
    desc: "Participa em aulas em tempo real no separador 'Aulas ao Vivo'. Recebes notificações quando uma aula está prestes a começar.",
    highlight: "Aulas ao Vivo",
  },
  {
    icon: Users,
    title: "Comunidade de Alunos",
    desc: "No separador 'Comunidade' podes tirar dúvidas, partilhar conhecimento e conectar-te com outros alunos.",
    highlight: "Comunidade",
  },
];

export function OnboardingTour() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Só mostrar se nunca viu
    const seen = localStorage.getItem("onboarding-seen");
    if (seen || !user) {
      setDismissed(true);
      return;
    }
    // Delay para a página carregar primeiro
    const timer = setTimeout(() => {
      setOpen(true);
      setDismissed(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [user]);

  const finish = async () => {
    setOpen(false);
    setDismissed(true);
    localStorage.setItem("onboarding-seen", "1");
    if (user) {
      await setDoc(doc(db, "users", user.uid), { onboardingComplete: true }, { merge: true });
    }
  };

  if (dismissed) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/85 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-desc"
      onKeyDown={(e) => { if (e.key === "Escape") finish(); }}>
      <div className="relative w-full max-w-lg mx-4 bg-gray-900 border border-gray-800 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close */}
        <button onClick={finish} aria-label="Fechar tour" className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10">
          <X className="h-5 w-5" />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div className="h-full bg-purple transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-8">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center bg-purple/20 mb-6">
            <s.icon className="h-8 w-8 text-purple" />
          </div>

          {/* Step counter */}
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Passo {step + 1} de {STEPS.length}
            {s.highlight && <span className="ml-2 text-purple">· {s.highlight}</span>}
          </p>

          {/* Title */}
          <h2 id="onboarding-title" className="text-2xl font-bold text-white mb-3">{s.title}</h2>

          {/* Description */}
          <p id="onboarding-desc" className="text-gray-400 text-base leading-relaxed mb-8">{s.desc}</p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i === step ? "bg-purple" : "bg-gray-700"}`} />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={finish} className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors">
                Saltar
              </button>

              {!isLast && (
                <button onClick={() => setStep(prev => prev + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors">
                  Seguinte <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {isLast && (
                <button onClick={finish}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors">
                  Começar! <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
