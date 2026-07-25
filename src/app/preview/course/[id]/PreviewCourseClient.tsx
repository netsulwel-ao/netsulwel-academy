"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Lock, Award, BookOpen, Clock, Share2,
  CheckCircle2, ChevronDown, ChevronRight, Crown, Zap, LogIn,
} from "lucide-react";
import Link from "next/link";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Iniciante", intermediate: "Intermédio", advanced: "Avançado",
};

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  golden:     { label: "Plano Golden", color: "text-yellow-400", icon: Crown },
  smart:      { label: "Plano Smart",  color: "text-green-400",  icon: Zap },
  standalone: { label: "Compra Avulsa", color: "text-blue-400",  icon: Play },
};

interface Module { title: string; videos: { title: string; duration: string }[] }

interface CoursePreview {
  id: string; title: string; description: string; thumbnail: string;
  type: string; level: string; category: string; price: number;
  hasCertificate: boolean; modulesCount: number; lessonsCount: number;
  tags: string[]; modules: Module[]; accessCode?: string;
}

export default function PreviewCourseClient({ course }: { course: CoursePreview }) {
  const { user, loading } = useAuth();
  const { canAccessCourse } = useAccess();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);

  const hasAccess = !loading && user
    ? canAccessCourse(course.type as "golden" | "smart" | "standalone", course.id, [], course.price, course.accessCode)
    : false;

  const handleWatch = () => {
    if (!user) { router.push(`/login?redirect=/dashboard/courses/${course.id}`); return; }
    if (hasAccess) { router.push(`/dashboard/courses/${course.id}`); return; }
    if (course.type === "standalone") { router.push(`/dashboard/finances?courseId=${course.id}`); return; }
    router.push("/dashboard/finances");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: course.title, text: course.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const toggleModule = (i: number) =>
    setExpandedModules((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i]);

  const typeConf = TYPE_CONFIG[course.type] ?? TYPE_CONFIG.standalone;
  const TypeIcon = typeConf.icon;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Navbar mínima ── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <img src="/Logo-Academy-White.svg" alt="Netsulwel Academy" className="h-10 w-auto" />
          <span className="text-lg font-bold text-white hidden sm:block">Netsulwel Academy</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm transition-colors">
            {copied ? <><CheckCircle2 className="h-4 w-4 text-green-400" /> Copiado!</> : <><Share2 className="h-4 w-4" /> Partilhar</>}
          </button>
          {!user && (
            <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative">
        {/* Background blur from thumbnail */}
        {course.thumbnail && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={course.thumbnail} alt="" className="w-full h-full object-cover opacity-10 blur-2xl scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/80 to-gray-950" />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-6 py-16 flex flex-col lg:flex-row gap-12 items-start">

          {/* Left — info */}
          <div className="flex-1 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                course.type === "golden" ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                : course.type === "smart" ? "bg-green-500/15 border-green-500/30 text-green-400"
                : "bg-blue-500/15 border-blue-500/30 text-blue-400"
              }`}>
                <TypeIcon className="h-3.5 w-3.5" />
                {typeConf.label}
              </span>
              {course.hasCertificate && (
                <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider border bg-amber-500/15 border-amber-500/30 text-amber-400">
                  <Award className="h-3.5 w-3.5" /> Certificado
                </span>
              )}
              <span className="px-3 py-1 text-xs font-medium text-gray-400 border border-gray-700">
                {LEVEL_LABEL[course.level] ?? course.level}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">{course.title}</h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">{course.description}</p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" />{course.modulesCount} módulos</span>
              <span className="flex items-center gap-2"><Play className="h-4 w-4" />{course.lessonsCount} aulas</span>
              {course.hasCertificate && <span className="flex items-center gap-2"><Award className="h-4 w-4" />Certificado incluído</span>}
            </div>

            {/* Tags */}
            {course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tags.map((t) => (
                  <span key={t} className="px-3 py-1 bg-gray-800 text-gray-400 text-xs">{t}</span>
                ))}
              </div>
            )}

            {/* CTA mobile */}
            <div className="lg:hidden">
              <CTABox course={course} hasAccess={hasAccess} user={user} loading={loading} onWatch={handleWatch} />
            </div>
          </div>

          {/* Right — CTA box (desktop) */}
          <div className="hidden lg:block w-80 shrink-0 sticky top-24">
            <CTABox course={course} hasAccess={hasAccess} user={user} loading={loading} onWatch={handleWatch} />
          </div>
        </div>
      </div>

      {/* ── Curriculum ── */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-2xl font-bold text-white mb-6">Conteúdo do Curso</h2>
        <div className="space-y-2">
          {course.modules.map((module, mi) => (
            <div key={mi} className="border border-gray-800 overflow-hidden">
              <button onClick={() => toggleModule(mi)}
                className="w-full flex items-center gap-4 px-5 py-4 bg-gray-900/60 hover:bg-gray-900 transition-colors text-left">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider shrink-0 w-20">Módulo {mi + 1}</span>
                <span className="flex-1 text-sm font-medium text-white">{module.title || `Módulo ${mi + 1}`}</span>
                <span className="text-xs text-gray-500 shrink-0">{module.videos.length} aulas</span>
                {expandedModules.includes(mi)
                  ? <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
                }
              </button>
              {expandedModules.includes(mi) && (
                <div className="bg-gray-950/40 divide-y divide-gray-800/50">
                  {module.videos.map((video, vi) => (
                    <div key={vi} className="flex items-center gap-4 px-5 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-gray-800">
                        <Lock className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <span className="flex-1 text-sm text-gray-400">{video.title || `Aula ${vi + 1}`}</span>
                      {video.duration && (
                        <span className="text-xs text-gray-600 flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />{video.duration}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CTA Box ───────────────────────────────────────────────
function CTABox({ course, hasAccess, user, loading, onWatch }: {
  course: CoursePreview;
  hasAccess: boolean;
  user: unknown;
  loading: boolean;
  onWatch: () => void;
}) {
  const typeConf = TYPE_CONFIG[course.type] ?? TYPE_CONFIG.standalone;
  const TypeIcon = typeConf.icon;

  return (
    <div className="bg-gray-900 border border-gray-800 overflow-hidden shadow-2xl">
      {/* Thumbnail */}
      {course.thumbnail && (
        <div className="relative aspect-video overflow-hidden">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gray-950/40 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center bg-white/10 border border-white/20 backdrop-blur-sm">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* Price */}
        {course.type === "standalone" ? (
          <div>
            <p className="text-3xl font-bold text-white">
              {course.price > 0 ? `${course.price.toLocaleString("pt-AO")} Kz` : "Gratuito"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Acesso vitalício</p>
          </div>
        ) : (
          <div className={`flex items-center gap-2 ${typeConf.color}`}>
            <TypeIcon className="h-5 w-5" />
            <span className="font-bold">{typeConf.label}</span>
          </div>
        )}

        {/* CTA button */}
        <button onClick={onWatch} disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-4 font-bold text-sm transition-colors ${
            hasAccess
              ? "bg-green-600 hover:bg-green-500 text-white"
              : course.type === "golden"
                ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
                : course.type === "smart"
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
          } disabled:opacity-60`}>
          {loading ? (
            <span className="animate-pulse">A verificar...</span>
          ) : !user ? (
            <><LogIn className="h-4 w-4" /> Entrar para Assistir</>
          ) : hasAccess ? (
            <><Play className="h-4 w-4" /> Assistir Agora</>
          ) : course.type === "standalone" ? (
            <><Zap className="h-4 w-4" /> Comprar Curso</>
          ) : (
            <><Crown className="h-4 w-4" /> Ativar {course.type === "golden" ? "Plano Golden" : "Plano Smart"}</>
          )}
        </button>

        {/* What's included */}
        <ul className="space-y-2 text-sm text-gray-400">
          {[
            `${course.modulesCount} módulos · ${course.lessonsCount} aulas`,
            course.hasCertificate ? "Certificado de conclusão" : null,
            "Acesso na plataforma",
            "Suporte da comunidade",
          ].filter(Boolean).map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
