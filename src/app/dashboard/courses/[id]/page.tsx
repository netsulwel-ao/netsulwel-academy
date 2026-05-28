"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import {
  Lock, Play, BookOpen, Award, ChevronLeft, Clock,
  Loader2, CheckCircle2, ChevronDown, ChevronRight, Crown, Zap,
} from "lucide-react";
import Link from "next/link";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { Course } from "@/types/course";
import type { CourseType } from "@/types/course";

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

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { canAccessCourse, requiredPlanLabel } = useAccess();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<{ mi: number; vi: number } | null>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);

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

        // Abre automaticamente na primeira aula
        if (data.modules?.[0]?.videos?.[0]) setActiveLesson({ mi: 0, vi: 0 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user, router]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  if (!course) return null;

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
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* Back */}
      <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ChevronLeft className="h-4 w-4" /> Voltar ao catálogo
      </Link>

      <div className="flex flex-col xl:flex-row gap-8">

        {/* ── LEFT: Player + Info ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Player area */}
          <div className="relative w-full aspect-video bg-gray-900">
            {hasAccess && currentVideo?.url ? (
              <VideoPlayer source={buildVideoSource(currentVideo.url, course.thumbnail)} />
            ) : hasAccess && !currentVideo?.url ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <Play className="h-12 w-12" />
                <p className="text-sm">Seleciona uma aula para começar</p>
              </div>
            ) : (
              <div className="relative h-full">
                {course.thumbnail && (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-20 blur-sm" />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gray-950/80 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center bg-gray-900 border border-gray-700">
                    <Lock className="h-8 w-8 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Conteúdo Bloqueado</h3>
                    <p className="mt-2 text-gray-400 text-sm max-w-sm">
                      Este curso requer <span className="text-white font-semibold">{required}</span> para aceder.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {normalizedType === "standalone" ? (
                      <Link href={`/dashboard/finances?courseId=${course.id}`}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-bold transition-colors">
                        <Zap className="h-4 w-4" />
                        Comprar por {course.price ? `${course.price.toLocaleString("pt-AO")} Kz` : "Grátis"}
                      </Link>
                    ) : (
                      <Link href="/dashboard/plans"
                        className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
                          normalizedType === "golden"
                            ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
                            : "bg-green-600 hover:bg-green-500 text-white"
                        }`}>
                        <Crown className="h-4 w-4" />
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
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                Módulo {(activeLesson?.mi ?? 0) + 1} · Aula {(activeLesson?.vi ?? 0) + 1}
              </p>
              <h2 className="text-lg font-bold text-white">{currentVideo.title}</h2>
              {currentVideo.duration && (
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {currentVideo.duration}
                </p>
              )}
            </div>
          )}

          {/* Course info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${
                  normalizedType === "golden" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"
                  : normalizedType === "smart" ? "bg-green-500/15 text-green-400 border-green-500/25"
                  : "bg-blue-500/15 text-blue-400 border-blue-500/25"
                }`}>{normalizedType === "golden" ? "Golden" : normalizedType === "smart" ? "Smart" : "Avulso"}</span>
                {course.hasCertificate && (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase tracking-wider border bg-amber-500/15 text-amber-400 border-amber-500/25">
                    <Award className="h-3 w-3" /> Certificado
                  </span>
                )}
                <span className="text-xs text-gray-500">{LEVEL_LABEL[course.level] ?? course.level}</span>
                <span className="text-xs text-gray-500 flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{course.modulesCount} módulos · {course.lessonsCount} aulas</span>
              </div>
            </div>
            {course.description && <p className="text-gray-300 text-sm leading-relaxed">{course.description}</p>}
            {course.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-gray-800 text-gray-400 text-xs">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Curriculum ── */}
        <div className="xl:w-96 shrink-0">
          <div className="bg-gray-900/40 border border-gray-800 overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="font-bold text-white">Conteúdo do Curso</h3>
              <p className="text-xs text-gray-500 mt-0.5">{course.modulesCount} módulos · {course.lessonsCount} aulas</p>
              {!hasAccess && (
                <p className="text-xs text-amber-300 mt-2 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
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
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider shrink-0 w-16">Módulo {mi + 1}</span>
                    <span className="flex-1 text-sm font-medium text-white truncate">{module.title || `Módulo ${mi + 1}`}</span>
                    <span className="text-xs text-gray-500 shrink-0">{module.videos.length} aulas</span>
                    {expandedModules.includes(mi)
                      ? <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
                    }
                  </button>

                  {/* Lessons */}
                  {expandedModules.includes(mi) && (
                    <div className="bg-gray-950/30">
                      {module.videos.map((video, vi) => {
                        const isActive = activeLesson?.mi === mi && activeLesson?.vi === vi;
                        const lessonLocked = !hasAccess;
                        return (
                          <button key={vi}
                            onClick={() => { if (!lessonLocked) setActiveLesson({ mi, vi }); }}
                            disabled={lessonLocked}
                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                              isActive ? "bg-blue-600/20 border-l-2 border-blue-500" : "hover:bg-gray-800/30 border-l-2 border-transparent"
                            } ${lessonLocked ? "cursor-not-allowed" : "cursor-pointer"}`}>
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center ${
                              isActive ? "bg-blue-600" : lessonLocked ? "bg-gray-800" : "bg-gray-800 group-hover:bg-gray-700"
                            }`}>
                              {lessonLocked
                                ? <Lock className="h-3.5 w-3.5 text-gray-500" />
                                : isActive
                                  ? <Play className="h-3.5 w-3.5 text-white ml-0.5" />
                                  : <Play className="h-3.5 w-3.5 text-gray-400 ml-0.5" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${isActive ? "text-white font-medium" : lessonLocked ? "text-gray-600" : "text-gray-300"}`}>
                                {video.title || `Aula ${vi + 1}`}
                              </p>
                              {video.duration && <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" />{video.duration}</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA if locked */}
            {!hasAccess && (
              <div className="p-5 border-t border-gray-800 bg-gray-900/60">
                <p className="text-xs text-gray-400 mb-3 text-center">
                  Requer <span className="text-white font-semibold">{requiredPlanLabel(normalizedType)}</span>
                </p>
                {normalizedType === "standalone" ? (
                  <Link href={`/dashboard/finances?courseId=${course.id}`}
                    className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold transition-colors text-sm">
                    <Zap className="h-4 w-4" />
                    Comprar — {course.price ? `${course.price.toLocaleString("pt-AO")} Kz` : "Grátis"}
                  </Link>
                ) : (
                  <Link href="/dashboard/plans"
                    className={`flex w-full items-center justify-center gap-2 py-3 font-bold transition-colors text-sm ${
                      normalizedType === "golden" ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900" : "bg-green-600 hover:bg-green-500 text-white"
                    }`}>
                    <Crown className="h-4 w-4" />
                    Ativar {normalizedType === "golden" ? "Plano Golden" : "Plano Smart"}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
