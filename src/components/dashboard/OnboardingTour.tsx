"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, Radio, GraduationCap,
  ArrowRight, X, CheckCircle2,
  LayoutDashboard, Video, DollarSign,
  Building2, UserPlus, Settings,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

// ── Tipos ───────────────────────────────────────────────
interface OnboardingStep {
  icon: typeof BookOpen;
  tag: string;
  title: string;
  desc: string;
  action?: { label: string; href: string };
}

// ── Steps por role ───────────────────────────────────────

const STUDENT_STEPS: OnboardingStep[] = [
  {
    icon: GraduationCap,
    tag: "// boas-vindas",
    title: `Bem-vindo à Netsulwel Academy`,
    desc: "A tua jornada em tech, finanças e investimentos começa aqui. Vamos mostrar-te o essencial para começar.",
  },
  {
    icon: BookOpen,
    tag: "// aprendizagem",
    title: "Explora os cursos",
    desc: "No menu lateral encontras 'Meus Cursos' com todo o catálogo. Navega por cursos estruturados do básico ao avançado.",
    action: { label: "Ver cursos", href: "/dashboard/courses" },
  },
  {
    icon: Radio,
    tag: "// ao vivo",
    title: "Aulas ao vivo",
    desc: "Participa em sessões em tempo real com especialistas. Recebes notificações antes de cada aula começar.",
    action: { label: "Ver agenda", href: "/dashboard/lives" },
  },
];

const TEACHER_STEPS: OnboardingStep[] = [
  {
    icon: LayoutDashboard,
    tag: "// boas-vindas",
    title: "Painel do Professor",
    desc: "Bem-vindo ao teu espaço de criação. Aqui monitorizes as tuas vendas, cursos e alunos numa vista única.",
  },
  {
    icon: BookOpen,
    tag: "// conteúdo",
    title: "Cria o teu primeiro curso",
    desc: "Vai a 'Cursos' e clica em 'Novo Curso'. Estrutura módulos, faz upload de vídeos e define o preço.",
    action: { label: "Criar curso", href: "/dashboard/teacher/courses/new" },
  },
  {
    icon: Video,
    tag: "// ao vivo",
    title: "Agenda aulas ao vivo",
    desc: "Em 'Aulas ao Vivo' podes agendar sessões em directo com os teus alunos e partilhar o estúdio de gravação.",
    action: { label: "Nova aula", href: "/dashboard/teacher/lives/new" },
  },
  {
    icon: DollarSign,
    tag: "// receitas",
    title: "Acompanha as tuas vendas",
    desc: "Em 'Vendas' e 'Carteira' vês os teus ganhos em tempo real. Define preços e acompanha o crescimento.",
    action: { label: "Ver vendas", href: "/dashboard/teacher/sales" },
  },
];

const INSTITUTION_STEPS: OnboardingStep[] = [
  {
    icon: Building2,
    tag: "// boas-vindas",
    title: "Painel da Instituição",
    desc: "A tua instituição foi activada. Aqui geres membros, cursos, receitas e as actividades da plataforma.",
  },
  {
    icon: UserPlus,
    tag: "// equipa",
    title: "Convida professores e alunos",
    desc: "Em 'Membros' podes gerar links de convite ou convidar directamente por email. Define o papel de cada membro.",
    action: { label: "Convidar membros", href: "/dashboard/institution/members" },
  },
  {
    icon: BookOpen,
    tag: "// cursos",
    title: "Gere os cursos da instituição",
    desc: "Em 'Cursos' vês todos os cursos criados pelos professores da tua instituição e controlas quais estão publicados.",
    action: { label: "Ver cursos", href: "/dashboard/institution/courses" },
  },
  {
    icon: Settings,
    tag: "// configurações",
    title: "Personaliza as definições",
    desc: "Em 'Definições' configuras o perfil da instituição, logótipo, descrição e informações de contacto.",
    action: { label: "Ir às definições", href: "/dashboard/institution/settings" },
  },
];

// ── Componente ───────────────────────────────────────────
export function OnboardingTour() {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Escolher steps pelo role
  const steps =
    role === "teacher" ? TEACHER_STEPS :
    role === "institution" ? INSTITUTION_STEPS :
    STUDENT_STEPS;

  useEffect(() => {
    if (!user) return;
    const key = `onboarding-seen-${role}-${user.uid}`;
    const seen = localStorage.getItem(key);
    if (seen) return;
    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, [user, role]);

  const finish = async (completed = false) => {
    setOpen(false);
    if (!user) return;
    const key = `onboarding-seen-${role}-${user.uid}`;
    localStorage.setItem(key, "1");
    if (completed) {
      await setDoc(
        doc(db, "users", user.uid),
        { onboardingComplete: true, onboardingCompletedAt: new Date() },
        { merge: true }
      );
    }
  };

  if (!open) return null;

  const s = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-gray-950 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onKeyDown={(e) => { if (e.key === "Escape") finish(); }}
    >
      {/* Card */}
      <div className="relative w-full sm:max-w-md mx-0 sm:mx-4 bg-gray-950 border border-gray-800 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* Barra de progresso */}
        <div className="h-px bg-gray-800">
          <div
            className="h-full bg-purple transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60">
            {s.tag}
          </p>
          <button
            onClick={() => finish(false)}
            className="text-gray-700 hover:text-gray-400 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 pt-5 pb-6">
          {/* Ícone */}
          <div className="mb-5 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <s.icon className="h-5 w-5 text-purple/80" strokeWidth={1.5} />
          </div>

          {/* Texto */}
          <h2 id="onboarding-title" className="text-xl font-bold text-gray-100 leading-snug mb-2">
            {s.title}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {s.desc}
          </p>

          {/* Ação rápida (se existir) */}
          {s.action && (
            <Link
              href={s.action.href}
              onClick={() => finish(isLast)}
              className="mb-5 flex items-center justify-between border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-400 hover:border-gray-700 hover:text-gray-200 transition-all group"
            >
              <span>{s.action.label}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          {/* Navegação */}
          <div className="flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 transition-all duration-300 ${
                    i === step ? "w-5 bg-purple" : "w-1.5 bg-gray-800 hover:bg-gray-700"
                  }`}
                  aria-label={`Ir para passo ${i + 1}`}
                />
              ))}
            </div>

            {/* Botões */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-400 transition-colors"
                >
                  ← Anterior
                </button>
              )}

              {isFirst && (
                <button
                  onClick={() => finish(false)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Saltar
                </button>
              )}

              {!isLast ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-1.5 bg-purple px-4 py-2 text-sm font-bold text-white hover:bg-purple-light transition-colors"
                >
                  Seguinte <ArrowRight className="h-3 w-3" />
                </button>
              ) : (
                <button
                  onClick={() => finish(true)}
                  className="flex items-center gap-1.5 bg-purple px-4 py-2 text-sm font-bold text-white hover:bg-purple-light transition-colors"
                >
                  <CheckCircle2 className="h-3 w-3" /> Começar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step counter no rodapé */}
        <div className="border-t border-gray-800 px-6 py-3 flex items-center justify-between">
          <p className="font-mono text-[13px] text-gray-700">
            {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </p>
          {role === "teacher" && (
            <p className="text-[13px] text-gray-700">conta em avaliação até aprovação admin</p>
          )}
        </div>
      </div>
    </div>
  );
}
