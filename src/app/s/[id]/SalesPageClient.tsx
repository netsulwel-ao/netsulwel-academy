"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  Play, Lock, Award, BookOpen, Clock, Share2, Users,
  CheckCircle2, ChevronDown, ChevronRight, Crown, Zap, LogIn,
  Sparkles, ArrowRight, GraduationCap, Loader2,
} from "lucide-react";

interface CourseData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: string;
  level: string;
  category: string;
  price: number;
  hasCertificate: boolean;
  featured: boolean;
  modulesCount: number;
  lessonsCount: number;
  totalDuration?: string;
  tags: string[];
  modules: { title: string; videos: { title: string; duration: string }[] }[];
  createdBy?: string;
  accessCode?: string;
  createdAt?: unknown;
}

interface TeacherData {
  name: string;
  photoURL?: string;
  bio?: string;
  specialty?: string;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Iniciante", intermediate: "Intermédio", advanced: "Avançado",
};

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  golden:     { label: "Plano Golden", color: "text-yellow-400", icon: Crown },
  smart:      { label: "Plano Smart",  color: "text-green-400",  icon: Zap },
  standalone: { label: "Compra Avulsa", color: "text-blue-400",  icon: Play },
};

export default function SalesPageClient({ courseId }: { courseId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { canAccessCourse } = useAccess();
  const router = useRouter();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);

  useEffect(() => {
    if (!courseId) return;
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const snap = await getDoc(doc(db, "courses", courseId));
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() } as CourseData;
      setCourse(data);

      if (data.createdBy) {
        const teacherSnap = await getDoc(doc(db, "users", data.createdBy));
        if (teacherSnap.exists()) {
          const td = teacherSnap.data();
          setTeacher({ name: td.name || "Professor", photoURL: td.photoURL, bio: td.bio, specialty: td.specialty });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = !authLoading && user && course
    ? canAccessCourse(course.type as any, course.id, [], course.price, course.accessCode)
    : false;

  const handleCTA = () => {
    if (!user) { router.push(`/login?redirect=/s/${courseId}`); return; }
    if (hasAccess) { router.push(`/dashboard/courses/${courseId}`); return; }
    if (course?.type === "standalone") { router.push(`/dashboard/finances?courseId=${courseId}`); return; }
    router.push("/dashboard/finances");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/s/${courseId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: course?.title, text: course?.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const toggleModule = (i: number) =>
    setExpandedModules(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Curso não encontrado</h1>
          <p className="text-gray-400 mb-6">Este curso pode ter sido removido ou o link está incorrecto.</p>
          <Link href="/" className="text-purple hover:text-purple-light font-medium">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const isRich = (course.modulesCount ?? 0) >= 3;
  const typeConf = TYPE_CONFIG[course.type] ?? TYPE_CONFIG.standalone;
  const TypeIcon = typeConf.icon;

  if (!isRich) {
    return <CompactPage course={course} teacher={teacher} hasAccess={hasAccess} authLoading={authLoading} copied={copied} user={!!user} onCTA={handleCTA} onShare={handleShare} />;
  }

  return <RichPage course={course} teacher={teacher} hasAccess={hasAccess} authLoading={authLoading} copied={copied} user={!!user} onCTA={handleCTA} onShare={handleShare} expandedModules={expandedModules} onToggleModule={toggleModule} />;
}

// ── Compact version (≤2 modules) ──
function CompactPage({ course, teacher, hasAccess, authLoading, copied, user, onCTA, onShare }: {
  course: CourseData; teacher: TeacherData | null; hasAccess: boolean;
  authLoading: boolean; copied: boolean; user: boolean;
  onCTA: () => void; onShare: () => void;
}) {
  const typeConf = TYPE_CONFIG[course.type] ?? TYPE_CONFIG.standalone;
  const TypeIcon = typeConf.icon;

  return (
    <div className="min-h-screen bg-background text-white">
      <nav className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <img src="/Logo-Academy-White.svg" alt="Netsulwel" className="h-8 sm:h-10 w-auto" />
          <span className="text-base sm:text-lg font-bold text-white hidden sm:block">Netsulwel Academy</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onShare}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-xs sm:text-sm transition-colors">
            {copied ? <><CheckCircle2 className="h-4 w-4 text-green-400" /> Copiado!</> : <><Share2 className="h-4 w-4" /> Partilhar</>}
          </button>
          {!user && (
            <Link href="/login"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-purple hover:bg-purple-light text-white text-xs sm:text-sm font-bold transition-colors">
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          <div className="sm:w-72 shrink-0">
            {course.thumbnail ? (
              <div className="aspect-video bg-gray-800 overflow-hidden">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-gray-800 flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-gray-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-4">
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
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{course.title}</h1>
            <p className="text-sm text-gray-400">{course.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{course.modulesCount} módulo{course.modulesCount !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1.5"><Play className="h-4 w-4" />{course.lessonsCount} aula{course.lessonsCount !== 1 ? "s" : ""}</span>
              {course.totalDuration && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{course.totalDuration}</span>}
            </div>
            {teacher && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                Por <span className="font-medium text-white">{teacher.name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={onCTA} disabled={authLoading}
                className={`flex items-center gap-2 px-6 py-3 font-bold text-xs sm:text-sm transition-colors ${
                  hasAccess ? "bg-green-600 hover:bg-green-500 text-white"
                  : course.type === "golden" ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
                  : course.type === "standalone" ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-green-600 hover:bg-green-500 text-white"
                } disabled:opacity-60`}>
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin" />
                  : !user ? <><LogIn className="h-4 w-4" /> Entrar para Comprar</>
                  : hasAccess ? <><Play className="h-4 w-4" /> Assistir Agora</>
                  : course.type === "standalone" ? <><ArrowRight className="h-4 w-4" /> Comprar — {course.price.toLocaleString("pt-AO")} Kz</>
                  : <><Crown className="h-4 w-4" /> Activar {typeConf.label}</>
                }
              </button>
              <button onClick={onShare}
                className="flex items-center gap-2 px-4 py-3 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                {copied ? <><CheckCircle2 className="h-4 w-4 text-green-400" /> Copiado!</> : <><Share2 className="h-4 w-4" /> Partilhar</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-800 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Netsulwel Academy. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// ── Rich version (3+ modules) ──
function RichPage({ course, teacher, hasAccess, authLoading, copied, user, onCTA, onShare, expandedModules, onToggleModule }: {
  course: CourseData; teacher: TeacherData | null; hasAccess: boolean;
  authLoading: boolean; copied: boolean; user: boolean;
  onCTA: () => void; onShare: () => void;
  expandedModules: number[]; onToggleModule: (i: number) => void;
}) {
  const typeConf = TYPE_CONFIG[course.type] ?? TYPE_CONFIG.standalone;
  const TypeIcon = typeConf.icon;

  return (
    <div className="min-h-screen bg-background text-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <img src="/Logo-Academy-White.svg" alt="Netsulwel Academy" className="h-8 sm:h-10 w-auto" />
          <span className="text-base sm:text-lg font-bold text-white hidden sm:block">Netsulwel Academy</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onShare}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-xs sm:text-sm transition-colors">
            {copied ? <><CheckCircle2 className="h-4 w-4 text-green-400" /> Copiado!</> : <><Share2 className="h-4 w-4" /> Partilhar</>}
          </button>
          {!user && (
            <Link href="/login"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-purple hover:bg-purple-light text-white text-xs sm:text-sm font-bold transition-colors">
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {course.thumbnail && (
          <>
            <div className="absolute inset-0">
              <img src={course.thumbnail} alt="" className="w-full h-full object-cover opacity-[0.07] blur-3xl scale-110" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </>
        )}

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
            <div className="flex-1 space-y-5 sm:space-y-6 w-full">
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

              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight">{course.title}</h1>

              <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed max-w-2xl">{course.description}</p>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
                <span className="flex items-center gap-1.5 sm:gap-2"><BookOpen className="h-4 w-4" />{course.modulesCount} módulo{course.modulesCount !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1.5 sm:gap-2"><Play className="h-4 w-4" />{course.lessonsCount} aula{course.lessonsCount !== 1 ? "s" : ""}</span>
                {course.totalDuration && <span className="flex items-center gap-1.5 sm:gap-2"><Clock className="h-4 w-4" />{course.totalDuration}</span>}
                {course.hasCertificate && <span className="flex items-center gap-1.5 sm:gap-2"><Award className="h-4 w-4" />Certificado</span>}
              </div>

              {course.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {course.tags.map(t => (
                    <span key={t} className="px-3 py-1 bg-gray-800/80 text-gray-400 text-xs border border-gray-700/50">{t}</span>
                  ))}
                </div>
              )}

              {teacher && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center text-purple-400 font-bold text-sm sm:text-base shrink-0 border border-purple-500/10">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Instrutor</p>
                    <p className="text-sm sm:text-base font-medium text-white">{teacher.name}</p>
                    {teacher.specialty && <p className="text-xs text-gray-500">{teacher.specialty}</p>}
                  </div>
                </div>
              )}

              <div className="lg:hidden pt-2">
                <CTABox course={course} hasAccess={hasAccess} user={user} authLoading={authLoading} onCTA={onCTA} shareUrl={`${window.location.origin}/s/${course.id}`} />
              </div>
            </div>

            <div className="hidden lg:block w-80 xl:w-96 shrink-0 sticky top-24">
              <CTABox course={course} hasAccess={hasAccess} user={user} authLoading={authLoading} onCTA={onCTA} shareUrl={`${window.location.origin}/s/${course.id}`} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Sections ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 sm:pb-20 space-y-12 sm:space-y-16">
        <div className="border-t border-gray-800" />

        {/* Curriculum */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-500/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 sm:h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Conteúdo do Curso</h2>
              <p className="text-xs sm:text-sm text-gray-500">{course.modulesCount} módulos &middot; {course.lessonsCount} aulas</p>
            </div>
          </div>
          <div className="space-y-2">
            {course.modules.map((mod, mi) => (
              <div key={mi} className="border border-gray-800 overflow-hidden">
                <button onClick={() => onToggleModule(mi)}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 bg-gray-900/60 hover:bg-gray-900/80 transition-colors text-left">
                  <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-wider shrink-0 w-16 sm:w-20">Mód. {mi + 1}</span>
                  <span className="flex-1 text-xs sm:text-sm font-medium text-white truncate">{mod.title || `Módulo ${mi + 1}`}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 shrink-0">{mod.videos.length} aula{mod.videos.length !== 1 ? "s" : ""}</span>
                  {expandedModules.includes(mi)
                    ? <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                    : <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                  }
                </button>
                {expandedModules.includes(mi) && (
                  <div className="bg-gray-950/40 divide-y divide-gray-800/50">
                    {mod.videos.map((vid, vi) => (
                      <div key={vi} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3">
                        <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center bg-gray-800 shrink-0">
                          <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                        </div>
                        <span className="flex-1 text-xs sm:text-sm text-gray-400 truncate">{vid.title || `Aula ${vi + 1}`}</span>
                        {vid.duration && (
                          <span className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" />{vid.duration}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Teacher Bio */}
        {teacher && teacher.bio && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-500/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 sm:h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Sobre o Instrutor</h2>
            </div>
            <div className="flex items-start gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-900/40 border border-gray-800">
              <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center text-purple-400 font-bold text-lg sm:text-xl shrink-0 border border-purple-500/10">
                {teacher.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white">{teacher.name}</h3>
                {teacher.specialty && <p className="text-xs sm:text-sm text-gray-500 mb-2">{teacher.specialty}</p>}
                <p className="text-xs sm:text-sm text-gray-400 whitespace-pre-wrap">{teacher.bio}</p>
              </div>
            </div>
          </section>
        )}

        {/* Benefits */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-500/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 sm:h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">O que vais aprender</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Conhecimento prático com projectos reais",
              "Suporte da comunidade de alunos",
              "Acesso vitalício ao conteúdo",
              course.hasCertificate ? "Certificado de conclusão" : null,
              "Aulas em vídeo com explicações claras",
              "Actualizações gratuitas do curso",
            ].filter(Boolean).map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 bg-gray-900/30 border border-gray-800/60">
                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center py-8 sm:py-12 border-t border-gray-800">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">Começa agora mesmo!</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 max-w-lg mx-auto">
            {course.type === "standalone"
              ? `Adquire o curso por ${course.price.toLocaleString("pt-AO")} Kz e começa a aprender hoje.`
              : `Este curso está disponível no ${typeConf.label}. Activa o teu plano e desbloqueia todos os conteúdos.`}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={onCTA} disabled={authLoading}
              className={`flex items-center gap-2 px-8 py-4 font-bold text-sm transition-colors ${
                hasAccess ? "bg-green-600 hover:bg-green-500 text-white"
                : course.type === "golden" ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
                : course.type === "standalone" ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-green-600 hover:bg-green-500 text-white"
              } disabled:opacity-60`}>
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin" />
                : !user ? <><LogIn className="h-4 w-4" /> Entrar para Comprar</>
                : hasAccess ? <><Play className="h-4 w-4" /> Assistir Agora</>
                : course.type === "standalone" ? <><Zap className="h-4 w-4" /> Comprar — {course.price.toLocaleString("pt-AO")} Kz</>
                : <><Crown className="h-4 w-4" /> Activar {typeConf.label}</>
              }
            </button>
            <button onClick={onShare}
              className="flex items-center gap-2 px-6 py-4 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm transition-colors">
              {copied ? <><CheckCircle2 className="h-4 w-4 text-green-400" /> Link Copiado!</> : <><Share2 className="h-4 w-4" /> Partilhar</>}
            </button>
          </div>
        </section>
      </div>

      <footer className="border-t border-gray-800 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Netsulwel Academy. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// ── CTA Box (used only in RichPage) ──
function CTABox({ course, hasAccess, user, authLoading, onCTA, shareUrl }: {
  course: CourseData;
  hasAccess: boolean;
  user: boolean;
  authLoading: boolean;
  onCTA: () => void;
  shareUrl: string;
}) {
  const typeConf = TYPE_CONFIG[course.type] ?? TYPE_CONFIG.standalone;
  const TypeIcon = typeConf.icon;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: course.title, text: course.description, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 overflow-hidden shadow-2xl">
      {course.thumbnail && (
        <div className="relative aspect-video overflow-hidden">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center bg-white/10 border border-white/20 backdrop-blur-sm">
              <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-5">
        {course.type === "standalone" ? (
          <div className="text-center sm:text-left">
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {course.price > 0 ? `${course.price.toLocaleString("pt-AO")} Kz` : "Gratuito"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Acesso vitalício</p>
          </div>
        ) : (
          <div className={`flex items-center justify-center sm:justify-start gap-2 ${typeConf.color}`}>
            <TypeIcon className="h-5 w-5" />
            <span className="font-bold">{typeConf.label}</span>
          </div>
        )}

        <button onClick={onCTA} disabled={authLoading}
          className={`w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 font-bold text-xs sm:text-sm transition-colors ${
            hasAccess ? "bg-green-600 hover:bg-green-500 text-white"
            : course.type === "golden" ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
            : course.type === "smart" ? "bg-green-600 hover:bg-green-500 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
          } disabled:opacity-60`}>
          {authLoading ? <Loader2 className="h-4 w-4 animate-spin" />
            : !user ? <><LogIn className="h-4 w-4" /> Entrar para Comprar</>
            : hasAccess ? <><Play className="h-4 w-4" /> Assistir Agora</>
            : course.type === "standalone" ? <><ArrowRight className="h-4 w-4" /> Comprar Curso</>
            : <><Crown className="h-4 w-4" /> Activar {typeConf.label}</>
          }
        </button>

        <ul className="space-y-2.5 text-xs sm:text-sm text-gray-400">
          {[
            `${course.modulesCount} módulos · ${course.lessonsCount} aulas`,
            course.hasCertificate ? "Certificado de conclusão" : null,
            "Acesso vitalício na plataforma",
            "Suporte da comunidade",
            "Actualizações gratuitas",
          ].filter(Boolean).map(item => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <button onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
          {copied ? <><CheckCircle2 className="h-4 w-4 text-green-400" /> Link Copiado!</> : <><Share2 className="h-4 w-4" /> Partilhar Curso</>}
        </button>
      </div>
    </div>
  );
}