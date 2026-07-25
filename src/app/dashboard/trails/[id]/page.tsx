"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import {
  Layers, BookOpen, Radio, Lock, Loader2, ChevronLeft, Play, Calendar, Clock,
  Award, CheckCircle2, Crown, Zap, Sparkles, Coins,
} from "lucide-react";
import Link from "next/link";
import type { Trail, Course, CourseType } from "@/types/course";
import type { LiveSession } from "@/types/live";

function normalizeCourseType(type: unknown): CourseType {
  if (type === "standalone" || type === "smart" || type === "golden") return type;
  return "standalone";
}

export default function TrailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, plan, isAdmin } = useAuth();
  const { canAccessCourse, requiredPlanLabel } = useAccess();

  const [trail, setTrail] = useState<Trail | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trailSnap = await getDoc(doc(db, "trails", id));
        if (!trailSnap.exists()) { router.push("/dashboard/trails"); return; }
        const trailData = { id: trailSnap.id, ...trailSnap.data() } as Trail;
        setTrail(trailData);

        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) setEnrolledCourses(userDoc.data().enrolledCourses ?? []);
        }

        // Fetch all referenced courses
        if (trailData.courseIds?.length > 0) {
          const coursesSnap = await getDocs(
            query(collection(db, "courses"), where("__name__", "in", trailData.courseIds))
          );
          const courseMap = new Map(
            coursesSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() } as Course])
          );
          setCourses(trailData.courseIds.map((cid) => courseMap.get(cid)).filter(Boolean) as Course[]);
        }

        // Fetch all referenced lives
        if (trailData.liveIds?.length > 0) {
          const livesSnap = await getDocs(
            query(collection(db, "lives"), where("__name__", "in", trailData.liveIds))
          );
          const liveMap = new Map(
            livesSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() } as LiveSession])
          );
          setLives(trailData.liveIds.map((lid) => liveMap.get(lid)).filter(Boolean) as LiveSession[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (!trail) return null;

  const canAccessByPlan = (): boolean => {
    if (isAdmin) return true;
    if (trail.type === "smart") return plan === "smart" || plan === "golden";
    if (trail.type === "golden") return plan === "golden";
    return false;
  };

  const hasTrailAccess = canAccessByPlan();

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const levelLabel = trail.level === "beginner" ? "Iniciante"
    : trail.level === "intermediate" ? "Intermédio" : "Avançado";

  const categoryLabel = trail.category === "tech" ? "Tecnologia"
    : trail.category === "finance" ? "Finanças"
    : trail.category === "investments" ? "Investimentos" : "Outro";

  return (
    <div className="max-w-[100rem] mx-auto animate-in fade-in duration-500">
      {/* Back */}
      <Link href="/dashboard/trails" className="inline-flex items-center gap-2 text-base text-gray-400 hover:text-white transition-colors mb-6">
        <ChevronLeft className="h-5 w-5" /> Voltar às trilhas
      </Link>

      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        <div className="w-full lg:w-96 shrink-0">
          <div className="relative aspect-video bg-gray-800 overflow-hidden">
            {trail.thumbnail ? (
              <img src={trail.thumbnail} alt={trail.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/40 to-gray-900">
                <Layers className="h-16 w-16 text-purple/40" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 text-sm font-bold uppercase tracking-wider border ${
              trail.type === "golden" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"
              : trail.type === "smart" ? "bg-green-500/15 text-green-400 border-green-500/25"
              : "bg-blue-500/15 text-blue-400 border-blue-500/25"
            }`}>
              {trail.type === "golden" ? "Golden" : trail.type === "smart" ? "Smart" : "Avulso"}
            </span>
            <span className="text-sm text-gray-500">{levelLabel}</span>
            <span className="text-sm text-gray-500">{categoryLabel}</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white">{trail.title}</h1>
          {trail.description && (
            <p className="text-gray-300 text-base leading-relaxed">{trail.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{trail.coursesCount ?? 0} cursos</span>
            <span className="flex items-center gap-1.5"><Radio className="h-4 w-4" />{trail.livesCount ?? 0} aulas ao vivo</span>
          </div>
        </div>
      </div>

      {/* ── TRAIL LOCKED MESSAGE ── */}
      {!hasTrailAccess && (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-900/40 border border-gray-800 text-center mb-10">
          <div className="flex h-16 w-16 items-center justify-center bg-gray-900 border border-gray-700 mb-4">
            <Lock className="h-10 w-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Trilha Bloqueada</h2>
          <p className="text-gray-400 max-w-md mb-6">
            Esta trilha requer <span className="text-white font-semibold">
              {trail.type === "golden" ? "Plano Golden" : trail.type === "smart" ? "Plano Smart ou Golden" : "Compra Individual"}
            </span> para aceder.
          </p>
          <Link href="/dashboard/finances"
            className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
              trail.type === "golden"
                ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
                : trail.type === "smart"
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}>
            {trail.type === "golden" ? <Crown className="h-5 w-5" /> : trail.type === "smart" ? <Zap className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
            {trail.type === "golden" ? "Ativar Plano Golden" : trail.type === "smart" ? "Ativar Plano Smart" : "Saber Mais"}
          </Link>
        </div>
      )}

      {/* ── COURSES ── */}
      {courses.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple" />
            Cursos na Trilha
          </h2>
          <div className="space-y-3">
            {courses.map((course, idx) => {
              const normType = normalizeCourseType(course.type);
              const hasAccess = canAccessCourse(normType, course.id!, enrolledCourses, course.price, course.accessCode);
              return (
                <div key={course.id}
                  className={`flex items-center gap-4 bg-gray-900/40 border p-4 transition-all ${
                    hasAccess ? "hover:bg-gray-900/60 border-gray-800" : "border-gray-800/50 opacity-75"
                  }`}>
                  <span className="text-xs font-bold text-gray-500 w-8 shrink-0 text-center">{idx + 1}</span>
                  <div className="w-16 h-12 bg-gray-800 overflow-hidden shrink-0">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <BookOpen className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{course.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{course.modulesCount ?? 0} módulos · {course.lessonsCount ?? 0} aulas</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasAccess ? (
                      <Link href={`/dashboard/courses/${course.id}`}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-bold transition-colors">
                        <Play className="h-4 w-4" /> Aceder
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-gray-800 text-gray-500 px-4 py-2 text-sm">
                        <Lock className="h-4 w-4" />
                        {normType === "standalone"
                          ? course.price ? `${course.price.toLocaleString("pt-AO")} Kz` : "Grátis"
                          : requiredPlanLabel(normType)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── LIVES (referenciadas) ── */}
      {lives.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Radio className="h-6 w-6 text-red-400" />
            Aulas ao Vivo na Trilha
          </h2>
          <div className="space-y-3">
            {lives.map((live, idx) => {
              const hasAccess = isAdmin || live.target === "free"
                || (live.target === "smart" && (plan === "smart" || plan === "golden"))
                || (live.target === "golden" && plan === "golden");

              return (
                <div key={live.id}
                  className="flex items-center gap-4 bg-gray-900/40 border border-gray-800 p-4">
                  <span className="text-xs font-bold text-gray-500 w-8 shrink-0 text-center">{idx + 1}</span>
                  <div className="w-16 h-12 bg-gray-800 overflow-hidden shrink-0">
                    {live.thumbnail ? (
                      <img src={live.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Radio className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{live.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {live.status === "live" ? (
                        <span className="text-red-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Ao Vivo agora
                        </span>
                      ) : live.status === "scheduled" ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(live.scheduledAt)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Encerrada · {formatDate(live.scheduledAt)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {live.status === "live" && hasAccess ? (
                      <Link href={`/dashboard/lives/${live.id}`}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold transition-colors">
                        <Play className="h-4 w-4" /> Entrar
                      </Link>
                    ) : live.status === "live" && !hasAccess ? (
                      <div className="flex items-center gap-1.5 bg-gray-800 text-gray-500 px-4 py-2 text-sm">
                        <Lock className="h-4 w-4" /> Requer {live.target === "golden" ? "Golden" : "Smart"}
                      </div>
                    ) : live.status === "scheduled" ? (
                      <div className="flex items-center gap-1.5 bg-gray-800 text-gray-400 px-4 py-2 text-sm">
                        <Calendar className="h-4 w-4" /> {new Date(live.scheduledAt).toLocaleDateString("pt-PT")}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 px-4 py-2">Encerrada</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── AULAS PRÓPRIAS DA TRILHA ── */}
      {trail.liveSessions?.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Radio className="h-6 w-6 text-orange-400" />
            Cronograma da Trilha
          </h2>
          <div className="space-y-3">
            {trail.liveSessions.map((sess, idx) => {
              const isPast = new Date(sess.scheduledAt) < new Date();
              const planLabel = sess.target === "free" ? "Grátis"
                : sess.target === "smart" ? "Smart"
                : sess.target === "golden" ? "Golden"
                : "Standalone";
              const planColor = sess.target === "free" ? "text-green-400 bg-green-500/10 border-green-500/20"
                : sess.target === "smart" ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                : sess.target === "golden" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                : "text-purple-400 bg-purple-500/10 border-purple-500/20";
              return (
                <div key={idx}
                  className="flex items-center gap-4 bg-gray-900/40 border border-gray-800 p-4">
                  <span className="text-xs font-bold text-gray-500 w-8 shrink-0 text-center">{idx + 1}</span>
                  <div className="w-16 h-12 bg-gray-800 overflow-hidden shrink-0">
                    {sess.thumbnail ? (
                      <img src={sess.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Calendar className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white truncate">{sess.title}</p>
                      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 border ${planColor}`}>
                        {planLabel}{sess.target === "standalone" && sess.price > 0 ? ` · ${sess.price.toLocaleString("pt-AO")} Kz` : ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isPast ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Realizada a {formatDate(sess.scheduledAt)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(sess.scheduledAt)}
                        </span>
                      )}
                    </p>
                    {sess.description && (
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{sess.description}</p>
                    )}
                  </div>
                  <div className={`text-xs font-medium px-3 py-1.5 shrink-0 ${
                    isPast ? "bg-gray-800 text-gray-500" : "bg-green-500/10 text-green-400 border border-green-500/20"
                  }`}>
                    {isPast ? "Realizada" : "Agendada"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── EMPTY ── */}
      {courses.length === 0 && lives.length === 0 && (!trail.liveSessions || trail.liveSessions.length === 0) && hasTrailAccess && (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-900/40 border border-gray-800 text-center">
          <Sparkles className="h-12 w-12 text-gray-700 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Trilha vazia</h2>
          <p className="text-gray-400">Esta trilha ainda não tem cursos ou aulas ao vivo.</p>
        </div>
      )}
    </div>
  );
}
