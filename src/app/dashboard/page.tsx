"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTrack } from "@/hooks/useTrack";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, limit, orderBy,
  query, where, doc, getDoc,
} from "firebase/firestore";
import {
  BookOpen, Radio, ArrowRight, Loader2,
  Play, TrendingUp, Clock, Zap, Award,
  ChevronRight, Lock, Star,
} from "lucide-react";
import type { Course, CourseCategory, CourseLevel } from "@/types/course";
import type { LiveSession } from "@/types/live";

// ── helpers ────────────────────────────────────────────────────────────────
function toDate(d: unknown): Date | null {
  if (!d) return null;
  if (typeof d === "object" && "toDate" in (d as object))
    return (d as { toDate: () => Date }).toDate();
  return new Date(d as string);
}

function fmtDate(d: unknown): string {
  const dt = toDate(d);
  if (!dt) return "";
  return dt.toLocaleString("pt-PT", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtLevel(l: CourseLevel): string {
  return l === "beginner" ? "Iniciante" : l === "intermediate" ? "Intermédio" : "Avançado";
}

function fmtCategory(c: CourseCategory): string {
  return c === "tech" ? "Tech" : c === "finance" ? "Finanças" : c === "investments" ? "Investimentos" : "Outros";
}

// ── sub-components ─────────────────────────────────────────────────────────

/** Card de curso — layout editorial, sem rounded */
function CourseCard({
  course,
  enrolled = false,
  size = "md",
}: {
  course: Course;
  enrolled?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const isLocked = course.type !== "standalone" || course.price > 0;
  const price = course.price
    ? `${course.price.toLocaleString("pt-AO")} Kz`
    : "Grátis";

  if (size === "lg") {
    return (
      <Link
        href={`/dashboard/courses/${course.id}`}
        className="group relative flex flex-col overflow-hidden border border-gray-800/60 bg-gray-900/20 hover:border-gray-700 transition-all"
      >
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-900 shrink-0">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
              <BookOpen className="h-10 w-10 text-gray-800" strokeWidth={1} />
            </div>
          )}
          {/* Overlay play */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-950/40">
            <div className="flex h-12 w-12 items-center justify-center bg-gray-950/80 border border-gray-700">
              {isLocked && !enrolled
                ? <Lock className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                : <Play className="h-5 w-5 text-white ml-0.5" strokeWidth={1.5} />
              }
            </div>
          </div>
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest border border-gray-700/80 bg-gray-950/80 px-2 py-0.5 text-gray-400">
              {fmtCategory(course.category)}
            </span>
            {course.hasCertificate && (
              <span className="font-mono text-[9px] uppercase tracking-widest border border-amber-500/30 bg-gray-950/80 px-2 py-0.5 text-amber-400/80">
                <Award className="inline h-2.5 w-2.5 mr-0.5" />cert
              </span>
            )}
          </div>
          <div className="absolute bottom-2.5 right-2.5">
            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 border ${
              course.price === 0
                ? "border-green/30 bg-gray-950/90 text-green/80"
                : "border-gray-700/80 bg-gray-950/90 text-gray-300"
            }`}>{price}</span>
          </div>
        </div>
        {/* Info */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="text-sm font-bold text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="mt-1.5 text-xs text-gray-600 line-clamp-2 leading-relaxed">{course.description}</p>
          )}
          <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-800/40 mt-3">
            <span className="text-[10px] font-mono text-gray-700">{fmtLevel(course.level)}</span>
            <span className="text-[10px] text-gray-700">{course.lessonsCount ?? 0} aulas</span>
          </div>
        </div>
      </Link>
    );
  }

  // size sm / md — compacto horizontal
  return (
    <Link
      href={`/dashboard/courses/${course.id}`}
      className="group flex items-center gap-3 border border-gray-800/60 bg-gray-900/20 hover:border-gray-700 hover:bg-gray-900/40 p-3 transition-all"
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-gray-900">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-5 w-5 text-gray-800" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-gray-700 mb-0.5">{fmtCategory(course.category)}</p>
        <h4 className="text-sm font-semibold text-gray-300 group-hover:text-gray-100 truncate transition-colors">
          {course.title}
        </h4>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-[10px] font-mono ${course.price === 0 ? "text-green/70" : "text-gray-600"}`}>
            {price}
          </span>
          <span className="text-gray-800">·</span>
          <span className="text-[10px] text-gray-700">{course.lessonsCount ?? 0} aulas</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-800 group-hover:text-gray-600 shrink-0 transition-colors" />
    </Link>
  );
}

/** Banner de live — destaque para aula em curso ou próxima */
function LiveBanner({ live }: { live: LiveSession }) {
  const isLive = live.status === "live";
  return (
    <Link
      href={isLive ? `/dashboard/lives/${live.id}` : "/dashboard/lives"}
      className="group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 overflow-hidden border border-gray-800/60 bg-gray-900/20 hover:border-gray-700 p-4 transition-all"
    >
      {/* Thumbnail de fundo */}
      {live.thumbnail && (
        <>
          <img
            src={live.thumbnail}
            alt={live.title}
            className="absolute inset-0 h-full w-full object-cover opacity-10 group-hover:opacity-15 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 to-gray-950/60" />
        </>
      )}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {isLive ? (
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              ao vivo agora
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-600">
              próxima aula · {fmtDate(live.scheduledAt)}
            </span>
          )}
        </div>
        <h3 className="text-sm sm:text-base font-bold text-gray-100 truncate">{live.title}</h3>
        {live.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1 hidden sm:block">{live.description}</p>
        )}
      </div>
      <div className={`relative shrink-0 self-start sm:self-auto flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-colors ${
        isLive
          ? "bg-red-600 text-white hover:bg-red-500"
          : "border border-gray-700 text-gray-400 group-hover:text-gray-200 group-hover:border-gray-600"
      }`}>
        {isLive ? <><Play className="h-3.5 w-3.5" /> Entrar</> : <><Radio className="h-3.5 w-3.5" /> Ver</>}
      </div>
    </Link>
  );
}

/** Secção com título editorial */
function Section({
  tag, title, action, children,
}: {
  tag?: string;
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          {tag && (
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-700 mb-1">{tag}</p>
          )}
          <h2 className="text-base font-bold text-gray-200">{title}</h2>
        </div>
        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors font-mono"
          >
            {action.label} <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

// ── página principal ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { track } = useTrack();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [nextLive, setNextLive] = useState<LiveSession | null>(null);
  const [trendingCourses, setTrendingCourses] = useState<Course[]>([]);
  const [continueCourses, setContinueCourses] = useState<Course[]>([]);
  const [personalizedCourses, setPersonalizedCourses] = useState<Course[]>([]);

  const enrolledSet = useMemo(() => new Set(enrolledCourses), [enrolledCourses]);
  const isNewUser = !loading && enrolledCourses.length === 0;

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return; }
      try {
        // Perfil do utilizador
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const enrolled: string[] = userSnap.exists()
          ? (userSnap.data().enrolledCourses ?? [])
          : [];
        setEnrolledCourses(enrolled);

        // Cursos publicados
        const coursesSnap = await getDocs(
          query(collection(db, "courses"), where("status", "==", "published"), orderBy("createdAt", "desc"))
        );
        const allCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        setCourses(allCourses);

        // Próxima live
        const livesSnap = await getDocs(
          query(collection(db, "lives"), orderBy("scheduledAt", "asc"), limit(20))
        );
        const upcoming = livesSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as LiveSession))
          .find(l => l.status === "scheduled" || l.status === "live");
        setNextLive(upcoming ?? null);

        // Trending
        try {
          const res = await fetch("/api/recommendations/trending");
          const data = await res.json();
          if (data.courses?.length > 0) setTrendingCourses(data.courses as Course[]);
        } catch { /* ok */ }

        // Personalizados
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/recommendations/personalized", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.courses?.length > 0) setPersonalizedCourses(data.courses as Course[]);
        } catch { /* ok */ }

        // Continuar a aprender
        if (allCourses.length > 0) {
          const progressSnap = await getDocs(
            collection(db, "progress", user.uid, "courses")
          );
          const courseMap = new Map(allCourses.map(c => [c.id, c]));
          const toContinue: Course[] = [];
          progressSnap.forEach(pDoc => {
            const p = pDoc.data();
            if (p.completedCount < p.totalCount) {
              const c = courseMap.get(pDoc.id);
              if (c) toContinue.push(c);
            }
          });
          setContinueCourses(toContinue.slice(0, 6));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!loading) track("page_view", undefined, undefined, { page: "dashboard" }).catch(() => {});
  }, [loading, track]);

  const firstName = user?.displayName?.split(" ")[0];

  return (
    <div className="max-w-[80rem] mx-auto space-y-10 animate-in fade-in duration-300">

      {/* ─────────────────────────────────────────
          HERO — cabeçalho editorial assimétrico
      ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        {/* Saudação */}
        <div className="border border-gray-800/60 bg-gray-900/20 p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple/60 mb-3">
            // dashboard · aluno
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100 leading-snug">
            {firstName ? (
              <>
                Olá, <span className="text-white">{firstName}</span>
                {isNewUser && <span className="text-gray-500"> — bem-vindo</span>}
              </>
            ) : "Bem-vindo ao teu painel"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isNewUser
              ? "Explora os cursos, participa em aulas ao vivo e conecta-te com a comunidade."
              : "Continua de onde paraste. Aqui tens a actividade mais recente."}
          </p>

          {/* Links rápidos */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/dashboard/courses"
              className="flex items-center gap-1.5 bg-purple px-3 py-2 text-xs font-bold text-white hover:bg-purple-light transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" /> Cursos
            </Link>
            <Link
              href="/dashboard/lives"
              className="flex items-center gap-1.5 border border-gray-800 bg-gray-900/60 px-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-all"
            >
              <Radio className="h-3.5 w-3.5 text-red-400/80" /> Ao vivo
            </Link>
            <Link
              href="/dashboard/trails"
              className="flex items-center gap-1.5 border border-gray-800 bg-gray-900/60 px-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-all"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400/80" /> Trilhas
            </Link>
          </div>
        </div>

        {/* Stats rápidas — horizontais em mobile, verticais em md+ */}
        <div className="flex flex-row md:flex-col gap-3 md:min-w-[200px]">
          {[
            { label: "Inscrições",        value: enrolledCourses.length || (loading ? "—" : "0"), icon: BookOpen, color: "text-purple/70" },
            { label: "Disponíveis",       value: courses.length         || (loading ? "—" : "0"), icon: Star,     color: "text-amber-400/70" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex-1 border border-gray-800/60 bg-gray-900/20 p-3 sm:p-4 flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-4 w-4 shrink-0 ${color}`} strokeWidth={1.5} />
                <span className="font-mono text-[9px] uppercase tracking-widest text-gray-700 text-right leading-tight">{label}</span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-gray-200">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      ) : (
        <>
          {/* ─────────────────────────────────────────
              LIVE — destaque se existir
          ───────────────────────────────────────── */}
          {nextLive && (
            <Section tag="// ao vivo" title="Próxima aula" action={{ label: "ver todas", href: "/dashboard/lives" }}>
              <LiveBanner live={nextLive} />
            </Section>
          )}

          {/* ─────────────────────────────────────────
              CONTINUAR A APRENDER
          ───────────────────────────────────────── */}
          {continueCourses.length > 0 && (
            <Section
              tag="// em curso"
              title="Continua de onde paraste"
              action={{ label: "ver tudo", href: "/dashboard/courses" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {continueCourses.map(c => (
                  <CourseCard key={c.id} course={c} enrolled={enrolledSet.has(c.id!)} size="lg" />
                ))}
              </div>
            </Section>
          )}

          {/* ─────────────────────────────────────────
              LAYOUT EDITORIAL: destaque + lista lateral
              (só aparece se houver cursos)
          ───────────────────────────────────────── */}
          {courses.length > 0 && (
            <Section
              tag="// catálogo"
              title="Todos os cursos"
              action={{ label: "explorar todos", href: "/dashboard/courses" }}
            >
              {/* Mobile/tablet: grid simples. Desktop: destaque + lista lateral */}
              <div className="block lg:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {courses.slice(0, 4).map(c => (
                    <CourseCard key={c.id} course={c} enrolled={enrolledSet.has(c.id!)} size="lg" />
                  ))}
                </div>
                {courses.length > 4 && (
                  <Link
                    href="/dashboard/courses"
                    className="mt-3 flex items-center justify-center gap-1.5 border border-gray-800/60 py-3 text-xs text-gray-600 hover:text-gray-400 hover:border-gray-700 transition-all font-mono"
                  >
                    +{courses.length - 4} mais cursos <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              <div className="hidden lg:grid lg:grid-cols-[1fr_300px] gap-4">
                {/* Curso em destaque — grande */}
                <CourseCard course={courses[0]} enrolled={enrolledSet.has(courses[0].id!)} size="lg" />
                {/* Lista lateral — compacta */}
                <div className="space-y-2">
                  {courses.slice(1, 6).map(c => (
                    <CourseCard key={c.id} course={c} enrolled={enrolledSet.has(c.id!)} size="sm" />
                  ))}
                  {courses.length > 6 && (
                    <Link
                      href="/dashboard/courses"
                      className="flex items-center justify-center gap-1.5 border border-gray-800/60 py-3 text-xs text-gray-600 hover:text-gray-400 hover:border-gray-700 transition-all font-mono"
                    >
                      +{courses.length - 6} mais <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* ─────────────────────────────────────────
              TRENDING — grid 2 colunas
          ───────────────────────────────────────── */}
          {trendingCourses.length > 0 && (
            <Section
              tag="// trending"
              title="Em destaque esta semana"
              action={{ label: "ver todos", href: "/dashboard/courses" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {trendingCourses.slice(0, 4).map(c => (
                  <CourseCard key={c.id} course={c} enrolled={enrolledSet.has(c.id!)} size="lg" />
                ))}
              </div>
            </Section>
          )}

          {/* ─────────────────────────────────────────
              RECOMENDADOS — lista compacta
          ───────────────────────────────────────── */}
          {personalizedCourses.length > 0 && (
            <Section
              tag="// para ti"
              title="Recomendados com base no teu perfil"
              action={{ label: "ver todos", href: "/dashboard/courses" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {personalizedCourses.slice(0, 6).map(c => (
                  <CourseCard key={c.id} course={c} enrolled={enrolledSet.has(c.id!)} size="sm" />
                ))}
              </div>
            </Section>
          )}

          {/* ─────────────────────────────────────────
              EMPTY STATE — aluno sem inscrições
          ───────────────────────────────────────── */}
          {isNewUser && (
            <Section tag="// começar" title="Por onde queres começar?">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: BookOpen,
                    label: "Explorar cursos",
                    sub: "Escolhe o teu primeiro curso",
                    href: "/dashboard/courses",
                    accent: "hover:border-purple/30",
                    iconAccent: "group-hover:text-purple/70",
                  },
                  {
                    icon: Radio,
                    label: "Aulas ao vivo",
                    sub: "Participa numa sessão em directo",
                    href: "/dashboard/lives",
                    accent: "hover:border-red-500/20",
                    iconAccent: "group-hover:text-red-400/70",
                  },
                  {
                    icon: Award,
                    label: "Ver trilhas",
                    sub: "Percursos estruturados do básico ao avançado",
                    href: "/dashboard/trails",
                    accent: "hover:border-amber-500/20",
                    iconAccent: "group-hover:text-amber-400/70",
                  },
                ].map(({ icon: Icon, label, sub, href, accent, iconAccent }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-4 border border-gray-800/60 bg-gray-900/20 p-4 transition-all ${accent}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 group-hover:border-gray-700 transition-colors">
                      <Icon className={`h-4 w-4 text-gray-600 transition-colors ${iconAccent}`} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-300 group-hover:text-gray-100 transition-colors truncate">{label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Sem live agendada — mensagem subtil */}
          {!nextLive && !loading && (
            <div className="flex items-center justify-between border-t border-gray-800/40 pt-6">
              <p className="text-xs text-gray-700 font-mono">
                // sem aulas ao vivo agendadas de momento
              </p>
              <Link
                href="/dashboard/lives"
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                ver agenda →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
