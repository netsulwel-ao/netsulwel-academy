"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTrack } from "@/hooks/useTrack";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, where, doc, getDoc } from "firebase/firestore";
import {
  BookOpen,
  Radio,
  Crown,
  ArrowUpRight,
  Loader2,
  Calendar,
  Play,
  GraduationCap,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { Course } from "@/types/course";
import type { LiveSession } from "@/types/live";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { track } = useTrack();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [nextLive, setNextLive] = useState<LiveSession | null>(null);
  const [featuredCourse, setFeaturedCourse] = useState<string | null>(null);
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
  const [trendingCourses, setTrendingCourses] = useState<Course[]>([]);
  const [continueCourses, setContinueCourses] = useState<Course[]>([]);
  const [personalizedCourses, setPersonalizedCourses] = useState<Course[]>([]);

  const enrolledSet = useMemo(() => new Set(enrolledCourses), [enrolledCourses]);

  const toDate = (d: unknown): Date | null => {
    if (!d) return null;
    if (typeof d === "object" && "toDate" in (d as object)) return (d as { toDate: () => Date }).toDate();
    return new Date(d as string);
  };

  const rolePill = isAdmin ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-purple-500/15 text-purple-300 border-purple-500/25">
      <Crown className="h-4 w-4" /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-blue-500/15 text-blue-300 border-blue-500/25">
      <GraduationCap className="h-4 w-4" /> Aluno
    </span>
  );

  // Destacar primeiro curso quando carregar
  useEffect(() => {
    if (courses.length > 0 && !featuredCourse) {
      setFeaturedCourse(courses[0].id!);
    }
  }, [courses, featuredCourse]);

  // Auto-rotação do destaque a cada 30s (se nada hover)
  useEffect(() => {
    if (courses.length === 0) return;
    if (hoveredCourse) return;
    const interval = setInterval(() => {
      setFeaturedCourse(prev => {
        const others = courses.filter(c => c.id !== prev && c.id);
        if (others.length === 0) return prev;
        return others[Math.floor(Math.random() * others.length)].id!;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [courses, hoveredCourse]);

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const enrolled: string[] = userSnap.exists() ? (userSnap.data().enrolledCourses ?? []) : [];
        setEnrolledCourses(enrolled);

        const coursesSnap = await getDocs(
          query(collection(db, "courses"), where("status", "==", "published"), orderBy("createdAt", "desc"))
        );
        const allCourses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
        setCourses(allCourses);

        const livesSnap = await getDocs(
          query(
            collection(db, "lives"),
            orderBy("scheduledAt", "asc"),
            limit(20)
          )
        );
        const upcomingLive = livesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as LiveSession))
          .find((l) => l.status === "scheduled" || l.status === "live");
        setNextLive(upcomingLive || null);

        // Fetch trending courses
        try {
          const res = await fetch("/api/recommendations/trending");
          const data = await res.json();
          if (data.courses?.length > 0) setTrendingCourses(data.courses as Course[]);
        } catch { /* ok */ }

        // Fetch personalized recommendations
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/recommendations/personalized", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.courses?.length > 0) setPersonalizedCourses(data.courses as Course[]);
        } catch { /* ok */ }

        // Fetch progress for "continue learning"
        if (user && allCourses.length > 0) {
          const progressSnap = await getDocs(collection(db, "progress", user.uid, "courses"));
          const courseMap = new Map(allCourses.map(c => [c.id, c]));
          const toContinue: Course[] = [];
          progressSnap.forEach((pDoc) => {
            const p = pDoc.data();
            if (p.completedCount < p.totalCount) {
              const course = courseMap.get(pDoc.id);
              if (course) toContinue.push(course);
            }
          });
          setContinueCourses(toContinue.slice(0, 8));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Track page view
  useEffect(() => {
    if (!loading) track("page_view", undefined, undefined, { page: "dashboard" }).catch(() => {});
  }, [loading, track]);

 return (
 <div className="max-w-[100rem] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Olá{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-400">Bem-vindo ao teu painel. Aqui tens um resumo rápido do teu progresso.</p>
          <div className="mt-3 sm:mt-4 flex items-center gap-3 flex-wrap">
            {rolePill}
            <span className="text-xs sm:text-sm text-gray-500 truncate">Email: {user?.email}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center justify-center gap-2 bg-purple hover:bg-purple-light text-white px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-bold transition-colors"
          >
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            Ver cursos
            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
          <Link
            href="/dashboard/lives"
            className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-bold transition-colors border border-gray-800"
          >
            <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
            Aulas ao vivo
            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
        </div>
      ) : (
        <>
          {/* ── YouTube‑Style Course Videos ── */}
          {courses.length > 0 && (
            <div className="mt-8 sm:mt-10">
              {/* Curso em destaque (compacto) */}
              {(() => {
                const featuredId = hoveredCourse || featuredCourse;
                const feat = courses.find(c => c.id === featuredId) || courses[0];
                if (!feat) return null;
                return (
                  <Link href={`/dashboard/courses/${feat.id}`}
                    className="group flex items-center gap-4 bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden mb-6 p-2 sm:p-3 hover:bg-gray-900/60 transition-all">
                    <div className="relative w-32 sm:w-44 aspect-video bg-black rounded-lg overflow-hidden shrink-0">
                      {feat.thumbnail ? (
                        <img src={feat.thumbnail} alt={feat.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-gray-900">
                          <BookOpen className="h-8 w-8 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-10 w-10 flex items-center justify-center bg-red-600/90 rounded-full shadow-lg">
                          <Play className="h-5 w-5 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Em destaque</p>
                      <h3 className="text-base sm:text-lg font-bold text-white truncate group-hover:text-purple-300 transition-colors">{feat.title}</h3>
                      <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">{feat.description}</p>
                      <span className="inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                        {feat.price ? `${feat.price.toLocaleString("pt-AO")} Kz` : "Grátis"}
                      </span>
                    </div>
                  </Link>
                );
              })()}

              {/* Continue Learning */}
              {continueCourses.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-400" />
                    Continuar a aprender
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {continueCourses.map((course) => (
                      <CourseCard key={course.id} course={course}
                        onMouseEnter={() => setHoveredCourse(course.id!)}
                        onMouseLeave={() => setHoveredCourse(null)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              {trendingCourses.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-red-400" />
                    Tendências 🔥
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {trendingCourses.map((course) => (
                      <CourseCard key={course.id} course={course}
                        onMouseEnter={() => setHoveredCourse(course.id!)}
                        onMouseLeave={() => setHoveredCourse(null)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendados para ti */}
              {personalizedCourses.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    Recomendados para ti
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {personalizedCourses.map((course) => (
                      <CourseCard key={course.id} course={course}
                        onMouseEnter={() => setHoveredCourse(course.id!)}
                        onMouseLeave={() => setHoveredCourse(null)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Grid — todos os cursos publicados */}
              <h2 className="text-base font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-400" />
                Todos os Cursos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {courses.filter(c => c.id).map((course) => (
                  <CourseCard key={course.id} course={course}
                    onMouseEnter={() => setHoveredCourse(course.id!)}
                    onMouseLeave={() => setHoveredCourse(null)} />
                ))}
              </div>
            </div>
          )}

          {/* Next Live */}
          <div className="mt-10">
          <div className="bg-gray-900/40 border border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="h-5 w-5 text-red-400" />
                Próxima aula ao vivo
              </h2>
              <Link href="/dashboard/lives" className="text-sm text-purple-300 hover:text-purple-200 font-bold">
                Ver todas <span aria-hidden>→</span>
              </Link>
            </div>

            {nextLive ? (
              <div className="relative overflow-hidden bg-gray-950/40 border border-gray-800/80">
                {nextLive.thumbnail && (
                  <div className="absolute inset-0">
                     <img src={nextLive.thumbnail} alt={nextLive.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/40" />
                  </div>
                )}
                <div className="relative flex items-start gap-5 p-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                      {nextLive.status === "live" ? "A decorrer agora" : "Agendada"}
                    </p>
                    <p className="text-xl font-bold text-white truncate">{nextLive.title}</p>
                    {nextLive.description && <p className="mt-1 text-base text-gray-400 line-clamp-2">{nextLive.description}</p>}
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-500">
                        {toDate(nextLive.scheduledAt)?.toLocaleString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <Link
                        href={nextLive.status === "live" ? `/dashboard/lives/${nextLive.id}` : "/dashboard/lives"}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors ${
                          nextLive.status === "live"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-gray-900 hover:bg-gray-800 text-white border border-gray-800"
                        }`}
                      >
                        {nextLive.status === "live" ? (
                          <><Play className="h-4 w-4" /> Entrar agora</>
                        ) : (
                          <><Radio className="h-4 w-4 text-red-400" /> Ver agenda</>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-950/40 border border-gray-800/80 p-8 text-center">
                <div className="h-12 w-12 mx-auto flex items-center justify-center bg-gray-800/50 mb-3">
                  <Radio className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-base text-gray-400">Ainda não há aulas ao vivo agendadas.</p>
                <p className="mt-1 text-sm text-gray-600">Volta mais tarde para veres os próximos directos.</p>
                <Link href="/dashboard/lives" className="mt-4 inline-flex items-center gap-2 text-sm text-purple hover:text-purple-light font-bold transition-colors">
                  Ver agenda <span aria-hidden>→</span>
                </Link>
              </div>
            )}
          </div>
          </div>
          {enrolledCourses.length === 0 && (
          <div className="mt-10 bg-gray-900/40 border border-gray-800 p-8 space-y-5">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple" />
              Primeiros Passos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/courses"
                className="flex items-center gap-4 bg-gray-950/40 border border-gray-800/70 hover:border-purple/40 p-5 transition-colors group">
                <div className="h-12 w-12 shrink-0 flex items-center justify-center bg-purple/20 group-hover:bg-purple/30 transition-colors">
                  <BookOpen className="h-6 w-6 text-purple" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Explora os Cursos</p>
                  <p className="text-xs text-gray-500 mt-0.5">Escolhe o teu primeiro curso</p>
                </div>
              </Link>
              <Link href="/dashboard/lives"
                className="flex items-center gap-4 bg-gray-950/40 border border-gray-800/70 hover:border-purple/40 p-5 transition-colors group">
                <div className="h-12 w-12 shrink-0 flex items-center justify-center bg-purple/20 group-hover:bg-purple/30 transition-colors">
                  <Radio className="h-6 w-6 text-purple" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Aulas ao Vivo</p>
                  <p className="text-xs text-gray-500 mt-0.5">Participa numa sessão ao vivo</p>
                </div>
              </Link>
              <Link href="/dashboard/community"
                className="flex items-center gap-4 bg-gray-950/40 border border-gray-800/70 hover:border-purple/40 p-5 transition-colors group">
                <div className="h-12 w-12 shrink-0 flex items-center justify-center bg-purple/20 group-hover:bg-purple/30 transition-colors">
                  <Users className="h-6 w-6 text-purple" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Comunidade</p>
                  <p className="text-xs text-gray-500 mt-0.5">Conecta-te com outros alunos</p>
                </div>
              </Link>
            </div>
          </div>
          )}
        </>
      )}
  </div>
  );
}

function CourseCard({ course, onMouseEnter, onMouseLeave }: { course: Course; onMouseEnter: () => void; onMouseLeave: () => void }) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="group cursor-pointer bg-gray-900/40 border border-gray-800 hover:bg-gray-900/60 transition-all rounded-xl overflow-hidden"
    >
      <Link href={`/dashboard/courses/${course.id}`} className="block relative aspect-video bg-black overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-gray-900">
            <BookOpen className="h-14 w-14 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 flex items-center justify-center bg-red-600/90 rounded-full shadow-lg transform group-hover:scale-110 transition-transform opacity-80 group-hover:opacity-100">
            <Play className="h-6 w-6 text-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 text-[11px] font-medium text-white">
          {course.price ? `${course.price.toLocaleString("pt-AO")} Kz` : "Grátis"}
        </div>
      </Link>
      <div className="p-3 sm:p-4">
        <Link href={`/dashboard/courses/${course.id}`}>
          <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">{course.title}</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>
        </Link>
      </div>
    </div>
  );
}

