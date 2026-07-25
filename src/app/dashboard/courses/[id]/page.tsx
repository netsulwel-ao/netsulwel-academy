"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, increment, updateDoc, onSnapshot, setDoc, serverTimestamp, Timestamp, collection } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { useTrack } from "@/hooks/useTrack";
import {
  Lock, Play, BookOpen, Award, ChevronLeft, Clock,
  Loader2, CheckCircle2, ChevronDown, ChevronRight, Crown, Zap,
  Heart, HeartOff, Radio, Circle, Search, MessageCircle, Send, HelpCircle, ClipboardCheck,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { VideoPlayer } from "@/components/VideoPlayer";
import MaterialsList from "@/components/shared/MaterialsList";
import ExerciseBlock from "@/components/shared/ExerciseBlock";
import { getOrCreateGroupChat, getOrCreateIndividualChat, groupChatId } from "@/lib/chat";
import { listenQuizResults, getQuizModules } from "@/lib/quiz";
import type { ModuleQuizResult } from "@/types/quiz";
import type { Course, CourseType } from "@/types/course";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Iniciante", intermediate: "Intermédio", advanced: "Avançado",
};

function normalizeCourseType(type: unknown): CourseType {
  if (type === "standalone" || type === "smart" || type === "golden") return type;
  return "standalone";
}

function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      return id || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return id;
      // /embed/<id>
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeId(url);
  if (!id) return null;
  const embed = new URL(`https://www.youtube.com/embed/${id}`);
  // “mais parecido com o YouTube”, mas sem vídeos relacionados de outros canais
  embed.searchParams.set("rel", "0");
  embed.searchParams.set("modestbranding", "1");
  embed.searchParams.set("playsinline", "1");
  embed.searchParams.set("controls", "1");
  return embed.toString();
}

function getVimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    const id = u.pathname.split("/").filter(Boolean).pop();
    if (!id) return null;
    return `https://player.vimeo.com/video/${id}`;
  } catch {
    return null;
  }
}

function getVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    return u.pathname.split("/").filter(Boolean).pop() || null;
  } catch {
    return null;
  }
}

function buildVideoSource(url: string, poster?: string) {
  const youtubeId = getYoutubeId(url);
  if (youtubeId) return { type: "youtube" as const, youtubeId };
  const vimeoId = getVimeoId(url);
  if (vimeoId) return { type: "vimeo" as const, vimeoId };
  return { type: "direct" as const, src: url, poster };
}

function getLessonStatus(scheduledAt: string | undefined, durationStr: string | undefined): { status: "scheduled" | "live" | "ended"; label: string } {
  if (!scheduledAt) return { status: "scheduled", label: "Agendada" };
  const now = new Date();
  const start = new Date(scheduledAt);
  const durationMin = parseInt(durationStr || "0") || 0;
  const end = new Date(start.getTime() + durationMin * 60000);
  if (now >= start && now <= end) return { status: "live", label: "Ao Vivo" };
  if (now < start) return { status: "scheduled", label: "Agendada" };
  return { status: "ended", label: "Realizada" };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-AO", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { canAccessCourse, requiredPlanLabel } = useAccess();
  const { track } = useTrack();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<{ mi: number; vi: number } | null>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [followed, setFollowed] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [completed, setCompleted] = useState<Record<number, Record<number, boolean>>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const currentTimeRef = useRef(0);
  const [quizResults, setQuizResults] = useState<ModuleQuizResult[]>([]);
  const [quizModules, setQuizModules] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "courses", id));
        if (!snap.exists()) { router.push("/dashboard/courses"); return; }
        const data = { id: snap.id, ...snap.data() } as Course;
        setCourse(data);

        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) setEnrolledCourses(userDoc.data().enrolledCourses ?? []);
        }

        if (snap.exists()) {
          updateDoc(doc(db, "courses", id), { views: increment(1) }).catch(() => {});
          track("course_view", id, "course").catch(() => {});
        }

        // Abre automaticamente na primeira aula (ou restaura progresso)
        if (user) {
          const progressSnap = await getDoc(doc(db, "progress", user.uid, "courses", id));
          if (progressSnap.exists()) {
            const p = progressSnap.data();
            setCompleted(p.completed ?? {});
            setCompletedCount(p.completedCount ?? 0);
            setProgressLoaded(true);
            const mi = p.currentMi ?? 0;
            const vi = p.currentVi ?? 0;
            if (data.modules?.[mi]?.videos?.[vi]) {
              setActiveLesson({ mi, vi });
              // Expand the active module
              setExpandedModules(prev => prev.includes(mi) ? prev : [...prev, mi]);
            } else if (data.modules?.[0]?.videos?.[0]) {
              setActiveLesson({ mi: 0, vi: 0 });
            }
          } else {
            setProgressLoaded(true);
            if (data.modules?.[0]?.videos?.[0]) setActiveLesson({ mi: 0, vi: 0 });
          }
        } else {
          setProgressLoaded(true);
          if (data.modules?.[0]?.videos?.[0]) setActiveLesson({ mi: 0, vi: 0 });
        }
      // Buscar quizzes do curso para saber que módulos têm quiz
      try {
        const modules = await getQuizModules(id);
        setQuizModules(modules);
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
  }, [id, user, router]);

  useEffect(() => {
    if (!user || !course?.createdBy) return;
    const unsub = onSnapshot(doc(db, "ratings", `admin_${course.createdBy}_${user.uid}`), (snap) => {
      setFollowed(snap.exists() && snap.data()?.rating === 1);
    });
    const countUnsub = onSnapshot(doc(db, "ratings", `admin_${course.createdBy}_stats`), (snap) => {
      if (snap.exists()) setFollowCount(snap.data().count ?? 0);
    });
    return () => { unsub(); countUnsub(); };
  }, [course?.createdBy, user]);

  useEffect(() => {
    if (!user || !course?.id) return;
    const unsub = listenQuizResults(user.uid, course.id, setQuizResults);
    return () => unsub();
  }, [user?.uid, course?.id]);

  // Save progress periodically and on lesson change
  const saveProgress = useCallback(async (mi: number, vi: number, time?: number) => {
    if (!user || !course?.id) return;
    const totalLessons = course.modules?.reduce((acc, m) => acc + m.videos.length, 0) ?? 0;
    await setDoc(doc(db, "progress", user.uid, "courses", course.id), {
      userId: user.uid,
      courseId: course.id,
      currentMi: mi,
      currentVi: vi,
      currentTime: time ?? currentTimeRef.current,
      completed,
      completedCount,
      totalCount: totalLessons,
      lastAccessedAt: serverTimestamp(),
    }, { merge: true });
  }, [user, course?.id, course?.modules, completed, completedCount]);

  useEffect(() => {
    if (!user || !course?.id || !activeLesson) return;
    // Save immediately when lesson changes
    saveProgress(activeLesson.mi, activeLesson.vi);
    // Start periodic save every 30s
    saveTimerRef.current = setInterval(() => {
      saveProgress(activeLesson.mi, activeLesson.vi);
    }, 30000);
    return () => { clearInterval(saveTimerRef.current); };
  }, [activeLesson?.mi, activeLesson?.vi, user, course?.id]);

  const currentLessonKey = activeLesson ? `${activeLesson.mi}-${activeLesson.vi}` : "";
  const lessonCompleted = activeLesson ? completed[activeLesson.mi]?.[activeLesson.vi] ?? false : false;

  const totalLessons = course?.modules?.reduce((acc, m) => acc + m.videos.length, 0) ?? 0;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleComplete = async () => {
    if (!activeLesson || !user || !course?.id) return;
    const mi = activeLesson.mi;
    const vi = activeLesson.vi;
    const isCompleted = completed[mi]?.[vi] ?? false;
    const newCompleted = { ...completed };
    if (!newCompleted[mi]) newCompleted[mi] = {};
    newCompleted[mi] = { ...newCompleted[mi], [vi]: !isCompleted };
    const delta = !isCompleted ? 1 : -1;
    setCompleted(newCompleted);
    setCompletedCount(prev => prev + delta);
    const newCount = completedCount + delta;

    // Save immediately
    await setDoc(doc(db, "progress", user.uid, "courses", course.id), {
      userId: user.uid,
      courseId: course.id,
      currentMi: mi,
      currentVi: vi,
      completed: newCompleted,
      completedCount: newCount,
      totalCount: totalLessons,
      lastAccessedAt: serverTimestamp(),
    }, { merge: true });

    // Track lesson complete
    if (!isCompleted) {
      track("lesson_complete", course.id, "course", { moduleIndex: mi, lessonIndex: vi });
    }

    // Gerar certificado se completou 100% e o curso tem certificado ativo
    const justCompleted = !isCompleted && newCount >= totalLessons && totalLessons > 0;
    if (justCompleted) {
      track("course_complete", course.id, "course").catch(() => {});
    }
    if (justCompleted && course.hasCertificate) {
      const certId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const estHours = course.totalDuration ? parseInt(course.totalDuration) : course.lessonsCount ?? 0;
      await setDoc(doc(collection(db, "certificates", user.uid, "courses"), course.id), {
        userId: user.uid,
        courseId: course.id,
        courseTitle: course.title,
        studentName: user.displayName || user.email || "Aluno",
        completedAt: serverTimestamp(),
        hours: estHours,
        certificateId: certId,
      });
      // Notificar o aluno que o certificado está disponível
      await setDoc(
        doc(db, "users", user.uid, "notifications", `cert_${course.id}`),
        {
          uid: user.uid,
          type: "certificate_ready",
          title: "Certificado disponível!",
          message: `Concluíste "${course.title}". O teu certificado está pronto.`,
          link: `/dashboard/certificates/${course.id}`,
          read: false,
          createdAt: serverTimestamp(),
        }
      );
    }

    // Auto-avançar para a próxima aula não concluída
    if (!isCompleted && course.modules) {
      for (let m = mi; m < course.modules.length; m++) {
        const videos = course.modules[m].videos;
        for (let v = (m === mi ? vi + 1 : 0); v < videos.length; v++) {
          if (!newCompleted[m]?.[v]) {
            setActiveLesson({ mi: m, vi: v });
            setExpandedModules(prev => prev.includes(m) ? prev : [...prev, m]);
            return;
          }
        }
      }
    }
  };

  const toggleFollow = async () => {
    if (!user || !course?.createdBy) return;
    const ref = doc(db, "ratings", `admin_${course.createdBy}_${user.uid}`);
    const statsRef = doc(db, "ratings", `admin_${course.createdBy}_stats`);
    try {
      if (followed) {
        await Promise.all([
          setDoc(ref, { targetId: course.createdBy, targetType: "admin", userId: user.uid, rating: 0, createdAt: serverTimestamp() }),
          setDoc(statsRef, { count: increment(-1) }, { merge: true }),
        ]);
        setFollowed(false);
      } else {
        await Promise.all([
          setDoc(ref, { targetId: course.createdBy, targetType: "admin", userId: user.uid, rating: 1, createdAt: serverTimestamp() }),
          setDoc(statsRef, { count: increment(1) }, { merge: true }),
        ]);
        setFollowed(true);
      }
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;
  if (!course) return (
    <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <EmptyState
        icon={Search}
        title="Curso não encontrado"
        description="Este curso pode ter sido removido ou o link está incorrecto."
        action={{ label: "Ver catálogo", href: "/dashboard/courses", icon: BookOpen }}
        secondaryAction={{ label: "Voltar ao painel", href: "/dashboard" }}
      />
    </div>
  );

  const normalizedType = normalizeCourseType(course.type);
  const hasAccess = canAccessCourse(normalizedType, course.id!, enrolledCourses, course.price);
  const currentVideo = activeLesson ? course.modules?.[activeLesson.mi]?.videos?.[activeLesson.vi] : null;
  const required = requiredPlanLabel(normalizedType);
  const youtubeEmbed = currentVideo?.url ? getYoutubeEmbedUrl(currentVideo.url) : null;
  const vimeoEmbed = currentVideo?.url ? getVimeoEmbedUrl(currentVideo.url) : null;

  const toggleModule = (mi: number) => {
    setExpandedModules((prev) => prev.includes(mi) ? prev.filter((x) => x !== mi) : [...prev, mi]);
  };

  return (
    <div className="max-w-[100rem] mx-auto animate-in fade-in duration-500">

      {/* Back */}
      <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-base text-gray-400 hover:text-white transition-colors mb-6">
        <ChevronLeft className="h-5 w-5" /> Voltar ao catálogo
      </Link>

      <div className="flex flex-col xl:flex-row gap-8">

        {course.format === "live" ? (
          /* ── LIVE COURSE VIEW ── */
          <>
            {/* LEFT: Schedule timeline */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="bg-gray-900/40 border border-gray-800 p-6">
                <h2 className="text-lg font-bold text-white mb-1">{course.title}</h2>
                <p className="text-sm text-gray-400">{course.modules.reduce((a, m) => a + m.videos.length, 0)} aulas ao vivo</p>
              </div>

              <div className="space-y-3">
                {course.modules.map((module, mi) => (
                  <div key={mi} className="bg-gray-900/40 border border-gray-800 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-800">
                      <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">Módulo {mi + 1}{module.title ? ` — ${module.title}` : ""}</p>
                    </div>
                    <div className="divide-y divide-gray-800/60">
                      {module.videos.map((video, vi) => {
                        const st = getLessonStatus(video.scheduledAt, video.duration);
                        return (
                          <div key={vi} className="flex items-center gap-4 px-5 py-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${
                              st.status === "live" ? "bg-green-600 animate-pulse" :
                              st.status === "ended" ? "bg-gray-800" : "bg-gray-800"
                            }`}>
                              {st.status === "live" ? <Radio className="h-5 w-5 text-white" /> :
                               st.status === "ended" ? <CheckCircle2 className="h-5 w-5 text-gray-500" /> :
                               <Clock className="h-5 w-5 text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-white truncate">{video.title || `Aula ${vi + 1}`}</p>
                              {video.scheduledAt && (
                                <p className="text-sm text-gray-500 mt-0.5">{formatDate(video.scheduledAt)}</p>
                              )}
                              {video.duration && (
                                <p className="text-sm text-gray-500">Duração: {video.duration} min</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                st.status === "live" ? "bg-green-500/15 text-green-400 border border-green-500/25" :
                                st.status === "ended" ? "bg-gray-800 text-gray-500 border border-gray-700" :
                                "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                              }`}>{st.label}</span>
                              {st.status === "live" && hasAccess && (
                                <Link href={`/dashboard/courses/${course.id}/live/${mi}/${vi}`}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors">
                                  <Radio className="h-4 w-4" /> Entrar
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Course info sidebar */}
            <div className="xl:w-96 shrink-0">
              <div className="bg-gray-900/40 border border-gray-800 p-5 space-y-3 sticky top-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sobre o Curso</p>
                {course.description && <p className="text-sm text-gray-300 leading-relaxed">{course.description}</p>}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Formato</span><span className="text-purple-400 font-medium">Ao Vivo</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="text-white font-medium capitalize">{course.type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Módulos</span><span className="text-white font-medium">{course.modulesCount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Aulas</span><span className="text-white font-medium">{course.lessonsCount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Nível</span><span className="text-white font-medium">{LEVEL_LABEL[course.level] ?? course.level}</span></div>
                </div>
                {!hasAccess && (
                  <div className="pt-3 border-t border-gray-800">
                    <p className="text-sm text-amber-300 mb-2">Requer {required}</p>
                    {normalizedType === "standalone" ? (
                      <Link href={`/dashboard/finances?courseId=${course.id}`}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-bold text-sm transition-colors">
                        <Zap className="h-4 w-4" /> Comprar
                      </Link>
                    ) : (
                      <Link href="/dashboard/finances"
                        className={`flex items-center justify-center gap-2 py-2.5 font-bold text-sm transition-colors ${
                          normalizedType === "golden" ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900" : "bg-green-600 hover:bg-green-500 text-white"
                        }`}>
                        <Crown className="h-4 w-4" /> Ativar {normalizedType === "golden" ? "Golden" : "Smart"}
                      </Link>
                    )}
                  </div>
                )}
                {course.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-800">
                    {course.tags.map((t) => <span key={t} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs">{t}</span>)}
                  </div>
                )}
                {course.createdBy && (
                  <button onClick={toggleFollow}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-bold transition-colors w-full justify-center ${
                      followed ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}>
                    {followed ? <Heart className="h-4 w-4 fill-current" /> : <HeartOff className="h-4 w-4" />}
                    {followed ? "A Seguir" : "Seguir"}
                    {followCount > 0 && <span className="text-xs opacity-70">({followCount})</span>}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
        <>
        <div className="flex-1 min-w-0 space-y-6">

          {/* Player area */}
          <div className="relative w-full bg-gray-900">
            {hasAccess && currentVideo?.url ? (
              <VideoPlayer source={buildVideoSource(currentVideo.url, course.thumbnail)}
                onProgress={(time, dur) => {
                  currentTimeRef.current = time;
                  // Auto-marcar como completo se viu ≥90%
                  if (dur > 0 && (time / dur) >= 0.9 && activeLesson && !completed[activeLesson.mi]?.[activeLesson.vi]) {
                    toggleComplete();
                  }
                }}
              />
            ) : hasAccess && !currentVideo?.url ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <Play className="h-12 w-12" />
                <p className="text-base">Seleciona uma aula para começar</p>
              </div>
            ) : (
              <div className="relative h-full">
                {course.thumbnail && (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-20 blur-sm" />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gray-950/80 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center bg-gray-900 border border-gray-700">
                    <Lock className="h-10 w-10 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Conteúdo Bloqueado</h3>
                    <p className="mt-2 text-gray-400 text-base max-w-sm">
                      Este curso requer <span className="text-white font-semibold">{required}</span> para aceder.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {normalizedType === "standalone" ? (
                      <Link href={`/dashboard/finances?courseId=${course.id}`}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-bold transition-colors">
                        <Zap className="h-5 w-5" />
                        Comprar por {course.price ? `${course.price.toLocaleString("pt-AO")} Kz` : "Grátis"}
                      </Link>
                    ) : (
                      <Link href="/dashboard/finances"
                        className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
                          normalizedType === "golden"
                            ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
                            : "bg-green-600 hover:bg-green-500 text-white"
                        }`}>
                        <Crown className="h-5 w-5" />
                        Ativar {normalizedType === "golden" ? "Plano Golden" : "Plano Smart"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current lesson title */}
          {hasAccess && currentVideo && (
            <div className="bg-gray-900/40 px-5 py-4 border border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">
                    Módulo {(activeLesson?.mi ?? 0) + 1} · Aula {(activeLesson?.vi ?? 0) + 1}
                  </p>
                  <h2 className="text-xl font-bold text-white">{currentVideo.title}</h2>
                  {currentVideo.duration && (
                    <p className="text-base text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {currentVideo.duration}
                    </p>
                  )}
                </div>
                <button onClick={toggleComplete}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors ${
                    lessonCompleted
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  }`}>
                  {lessonCompleted ? <><CheckCircle2 className="h-4 w-4" /> Concluída</> : <><Circle className="h-4 w-4" /> Marcar conclusão</>}
                </button>
              </div>
            </div>
          )}

          {/* Materials */}
          {hasAccess && currentVideo?.materials && currentVideo.materials.length > 0 && (
            <div className="bg-gray-900/40 px-5 py-4 border border-gray-800">
              <MaterialsList materials={currentVideo.materials} />
            </div>
          )}

          {/* Exercises */}
          {hasAccess && currentVideo?.exercises && currentVideo.exercises.length > 0 && (
            <div className="bg-gray-900/40 px-5 py-4 border border-gray-800">
              <ExerciseBlock exercises={currentVideo.exercises} />
            </div>
          )}

          {/* Course info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`px-2.5 py-1 text-sm font-bold uppercase tracking-wider border ${
                  normalizedType === "golden" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"
                  : normalizedType === "smart" ? "bg-green-500/15 text-green-400 border-green-500/25"
                  : "bg-blue-500/15 text-blue-400 border-blue-500/25"
                }`}>{normalizedType === "golden" ? "Golden" : normalizedType === "smart" ? "Smart" : "Avulso"}</span>
                {course.hasCertificate && (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-sm font-bold uppercase tracking-wider border bg-amber-500/15 text-amber-400 border-amber-500/25">
                    <Award className="h-4 w-4" /> Certificado
                  </span>
                )}
                <span className="text-sm text-gray-500">{LEVEL_LABEL[course.level] ?? course.level}</span>
                <span className="text-sm text-gray-500 flex items-center gap-1"><BookOpen className="h-4 w-4" />{course.modulesCount} módulos · {course.lessonsCount} aulas</span>
              </div>
            </div>
            {course.description && <p className="text-gray-300 text-base leading-relaxed">{course.description}</p>}
            {course.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-gray-800 text-gray-400 text-sm">{t}</span>
                ))}
              </div>
            )}
            {course.createdBy && (
              <button onClick={toggleFollow}
                className={`flex items-center gap-2 px-3 py-2 font-bold text-base transition-colors ${
                  followed
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {followed ? <Heart className="h-5 w-5 fill-current" /> : <HeartOff className="h-5 w-5" />}
                {followed ? "A Seguir" : "Seguir"}
                {followCount > 0 && <span className="text-sm opacity-70">({followCount})</span>}
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Curriculum ── */}
        <div className="xl:w-96 shrink-0">
          <div className="bg-gray-900/40 border border-gray-800 overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="font-bold text-white">Conteúdo do Curso</h3>
              <p className="text-sm text-gray-500 mt-0.5">{course.modulesCount} módulos · {course.lessonsCount} aulas</p>
              {progressLoaded && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>{completedCount} de {totalLessons} concluídas</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                  {progressPct === 100 && course?.hasCertificate && (
                    <Link href={`/dashboard/certificates/${course.id}`}
                      className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-bold hover:bg-amber-500/30 transition-colors">
                      <Award className="h-4 w-4" />
                      Ver Certificado
                    </Link>
                  )}
                </div>
              )}
              {!hasAccess && (
                <p className="text-sm text-amber-300 mt-3 flex items-center gap-1.5">
                  <Lock className="h-4 w-4" />
                  Requer {required}
                </p>
              )}
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              {course.modules?.map((module, mi) => (
                <div key={mi} className="border-b border-gray-800/60 last:border-0">
                  {/* Module header */}
                  <button onClick={() => toggleModule(mi)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/40 transition-colors text-left">
                    <span className="text-sm font-bold text-blue-400 uppercase tracking-wider shrink-0 w-16">Módulo {mi + 1}</span>
                    <span className="flex-1 text-base font-medium text-white truncate">{module.title || `Módulo ${mi + 1}`}</span>
                    <span className="text-sm text-gray-500 shrink-0">{module.videos.length} aulas</span>
                    {expandedModules.includes(mi)
                      ? <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
                      : <ChevronRight className="h-5 w-5 text-gray-500 shrink-0" />
                    }
                  </button>

                  {/* Lessons */}
                  {expandedModules.includes(mi) && (
                    <div className="bg-gray-950/30">
                      {module.videos.map((video, vi) => {
                        const isActive = activeLesson?.mi === mi && activeLesson?.vi === vi;
                        const lessonLocked = !hasAccess;
                        const isCompleted = completed[mi]?.[vi] ?? false;
                        return (
                          <button key={vi}
                            onClick={() => { if (!lessonLocked) setActiveLesson({ mi, vi }); }}
                            disabled={lessonLocked}
                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                              isActive ? "bg-blue-600/20 border-l-2 border-blue-500" : "hover:bg-gray-800/30 border-l-2 border-transparent"
                            } ${lessonLocked ? "cursor-not-allowed" : "cursor-pointer"}`}>
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center ${
                              isCompleted ? "bg-green-600"
                                : isActive ? "bg-blue-600"
                                : lessonLocked ? "bg-gray-800"
                                : "bg-gray-800 group-hover:bg-gray-700"
                            }`}>
                              {isCompleted
                                ? <CheckCircle2 className="h-4 w-4 text-white" />
                                : lessonLocked
                                  ? <Lock className="h-4 w-4 text-gray-500" />
                                  : isActive
                                    ? <Play className="h-4 w-4 text-white ml-0.5" />
                                    : <Circle className="h-4 w-4 text-gray-500" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-base truncate ${isCompleted ? "text-green-400" : isActive ? "text-white font-medium" : lessonLocked ? "text-gray-600" : "text-gray-300"}`}>
                                {video.title || `Aula ${vi + 1}`}
                              </p>
                              <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
                                <Clock className="h-4 w-4" />{video.duration || "—"}
                                {isCompleted && <span className="text-green-500 ml-1">Concluída</span>}
                              </p>
                            </div>
                          </button>
                        );
                      })}

                      {/* Quiz link */}
                      {(() => {
                        const qr = quizResults.filter((r) => r.moduleIndex === mi);
                        const best = qr.reduce((b, r) => (r.score > (b?.score ?? 0) ? r : b), qr[0]);
                        if (!quizModules.includes(mi)) return null;
                        return (
                          <Link href={`/dashboard/courses/${course.id}/quiz/${mi}`}
                            className={`flex items-center gap-3 px-5 py-3 transition-colors border-l-2 ${
                              best?.passed
                                ? "border-green-600 bg-green-950/10 hover:bg-green-950/20"
                                : best && !best.passed
                                  ? "border-red-600 bg-red-950/10 hover:bg-red-950/20"
                                  : "border-transparent hover:bg-gray-800/30"
                            }`}>
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center ${
                              best?.passed ? "bg-green-600" : best && !best.passed ? "bg-red-600" : "bg-gray-800"
                            }`}>
                              {best?.passed
                                ? <CheckCircle2 className="h-4 w-4 text-white" />
                                : best && !best.passed
                                  ? <HelpCircle className="h-4 w-4 text-white" />
                                  : <ClipboardCheck className="h-4 w-4 text-gray-500" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-base truncate ${
                                best?.passed ? "text-green-400" : best && !best.passed ? "text-red-400" : "text-gray-300"
                              }`}>
                                Quiz do Módulo
                              </p>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {best ? `Nota: ${best.score}% ${best.passed ? "✓" : "✗"}` : "Por fazer"}
                              </p>
                            </div>
                          </Link>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Chat do curso */}
            {hasAccess && (
              <div className="border-t border-gray-800 p-5">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                  <MessageCircle className="h-3.5 w-3.5" /> Chat do Curso
                </h4>
                <div className="space-y-2">
                  <Link href={`/dashboard/chats/${groupChatId(course.id!)}`}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                    <MessageCircle className="h-4 w-4 text-purple-400" />
                    Grupo do curso
                  </Link>
                  {course.createdBy && course.createdBy !== user?.uid && (
                    <button onClick={async () => {
                      if (!user || !course.createdBy) return;
                      try {
                        const chatId = await getOrCreateIndividualChat(
                          course.id!, course.title,
                          course.createdBy, "Professor", undefined,
                          user.uid, user.displayName || "Aluno", user.photoURL || undefined,
                        );
                        router.push(`/dashboard/chats/${chatId}`);
                      } catch {}
                    }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors text-left">
                      <Send className="h-4 w-4 text-green-400" />
                      Falar com o professor
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CTA if locked */}
            {!hasAccess && (
              <div className="p-5 border-t border-gray-800 bg-gray-900/60">
                <p className="text-sm text-gray-400 mb-3 text-center">
                  Requer <span className="text-white font-semibold">{requiredPlanLabel(normalizedType)}</span>
                </p>
                {normalizedType === "standalone" ? (
                  <Link href={`/dashboard/finances?courseId=${course.id}`}
                    className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold transition-colors text-base">
                    <Zap className="h-5 w-5" />
                    Comprar — {course.price ? `${course.price.toLocaleString("pt-AO")} Kz` : "Grátis"}
                  </Link>
                ) : (
                  <Link href="/dashboard/finances"
                    className={`flex w-full items-center justify-center gap-2 py-3 font-bold transition-colors text-base ${
                      normalizedType === "golden" ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900" : "bg-green-600 hover:bg-green-500 text-white"
                    }`}>
                    <Crown className="h-5 w-5" />
                    Ativar {normalizedType === "golden" ? "Plano Golden" : "Plano Smart"}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        </>
      )}
      </div>
    </div>
  );
}
