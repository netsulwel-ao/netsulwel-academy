"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, where, doc, getDoc } from "firebase/firestore";
import {
  BookOpen,
  Radio,
  Crown,
  Zap,
  ArrowUpRight,
  Loader2,
  Lock,
  Calendar,
  Play,
  GraduationCap,
  Users,
} from "lucide-react";
import type { Course } from "@/types/course";
import type { LiveSession } from "@/types/live";

export default function DashboardPage() {
  const { user, plan, isAdmin } = useAuth();
  const { planLabel, canAccessCourse } = useAccess();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [nextLive, setNextLive] = useState<LiveSession | null>(null);

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
        setCourses(coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));

        const livesSnap = await getDocs(
          query(
            collection(db, "lives"),
            where("status", "in", ["scheduled", "live"]),
            orderBy("scheduledAt", "asc"),
            limit(1)
          )
        );
        setNextLive(livesSnap.docs[0] ? ({ id: livesSnap.docs[0].id, ...livesSnap.docs[0].data() } as LiveSession) : null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const stats = useMemo(() => {
    const accessible = courses.filter((c) => canAccessCourse(c.type, c.id!, enrolledCourses, c.price));
    return {
      published: courses.length,
      accessible: accessible.length,
      enrolled: enrolledCourses.length,
    };
  }, [courses, enrolledCourses, canAccessCourse]);

  const quickStartCourses = useMemo(
    () => courses.filter((c) => canAccessCourse(c.type, c.id!, enrolledCourses, c.price)).slice(0, 4),
    [courses, enrolledCourses, canAccessCourse]
  );

  const planPill =
    isAdmin ? (
      <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-purple-500/15 text-purple-300 border-purple-500/25">
        <Crown className="h-4 w-4" /> Admin
      </span>
    ) : plan === "golden" ? (
      <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-yellow-500/15 text-yellow-300 border-yellow-500/25">
        <Crown className="h-4 w-4" /> {planLabel[plan]}
      </span>
    ) : plan === "smart" ? (
      <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-green-500/15 text-green-300 border-green-500/25">
        <Zap className="h-4 w-4" /> {planLabel[plan]}
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-gray-500/10 text-gray-300 border-gray-700/60">
        <Lock className="h-4 w-4" /> {planLabel[plan]}
      </span>
    );

 return (
 <div className="max-w-[100rem] mx-auto animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Olá{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-gray-400">Bem-vindo ao teu painel. Aqui tens um resumo rápido do teu progresso.</p>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {planPill}
            <span className="text-sm text-gray-500">Email: {user?.email}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-3 font-bold transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            Ver cursos
            <ArrowUpRight className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard/lives"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 font-bold transition-colors border border-gray-800"
          >
            <Radio className="h-5 w-5 text-red-400" />
            Aulas ao vivo
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="bg-gray-900/40 border border-gray-800 p-8 space-y-5">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Resumo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="Publicados" value={stats.published} />
              <Stat label="Disponíveis" value={stats.accessible} />
              <Stat label="Comprados" value={stats.enrolled} />
            </div>
            <div className="pt-3 border-t border-gray-800/80">
              <p className="text-sm text-gray-500">
                “Disponíveis” inclui os cursos do teu plano (e avulsos que compraste).
              </p>
            </div>
          </div>

          {/* Next live */}
          <div className="bg-gray-900/40 border border-gray-800 p-6 space-y-4 lg:col-span-2">
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
              <div className="flex items-start gap-5 bg-gray-950/40 border border-gray-800/80 p-6">
                <div className="h-14 w-14 shrink-0 flex items-center justify-center bg-red-500/10 border border-red-500/20">
                  {nextLive.status === "live" ? (
                    <Play className="h-6 w-6 text-red-400" />
                  ) : (
                    <Calendar className="h-6 w-6 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {nextLive.status === "live" ? "A decorrer agora" : "Agendada"}
                  </p>
                  <p className="text-xl font-bold text-white truncate">{nextLive.title}</p>
                  {nextLive.description && <p className="mt-1 text-base text-gray-400 line-clamp-2">{nextLive.description}</p>}
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-500">
                      {new Date(nextLive.scheduledAt).toLocaleString("pt-PT", {
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
                        <>
                          <Play className="h-4 w-4" /> Entrar agora
                        </>
                      ) : (
                        <>
                          <Radio className="h-4 w-4 text-red-400" /> Ver agenda
                        </>
                      )}
                    </Link>
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

          <div className="mt-8 bg-gray-900/40 border border-gray-800 p-8 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Play className="h-5 w-5 text-green-400" />
              Começar a ver agora
            </h2>
            <Link href="/dashboard/courses" className="text-sm text-purple-300 hover:text-purple-200 font-bold">
              Ver catálogo <span aria-hidden>→</span>
            </Link>
          </div>

          {quickStartCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {quickStartCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="group border border-gray-800 bg-gray-950/40 hover:bg-gray-900/70 transition-colors overflow-hidden"
                >
                  <div className="h-32 bg-gray-800">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-base font-bold text-white line-clamp-2">{course.title}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {course.price > 0 ? `${course.price.toLocaleString("pt-AO")} Kz` : "Gratuito"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-950/40 border border-gray-800/80 p-8 text-center">
              <div className="h-12 w-12 mx-auto flex items-center justify-center bg-gray-800/50 mb-3">
                <BookOpen className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-base text-gray-400">Ainda não tens cursos disponíveis para ver agora.</p>
              <p className="mt-1 text-sm text-gray-600">Faz upgrade do teu plano ou compra um curso avulso.</p>
              <Link href="/dashboard/finances" className="mt-4 inline-flex items-center gap-2 text-sm text-purple hover:text-purple-light font-bold transition-colors">
                Ver planos <span aria-hidden>→</span>
              </Link>
            </div>
          )}
          </div>
        </>
      )}
 </div>
 );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-950/40 border border-gray-800/70 p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-gray-500 whitespace-nowrap">{label}</p>
      <p className="mt-2 text-4xl font-extrabold text-white tabular-nums">{value}</p>
    </div>
  );
}
