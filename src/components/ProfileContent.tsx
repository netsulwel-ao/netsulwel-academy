"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { BookOpen, Radio, Users, GraduationCap, Loader2, Play, X } from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Avatar } from "@/components/ui/Avatar";
import type { Course } from "@/types/course";
import type { LiveSession } from "@/types/live";

interface ProfileData {
  name: string;
  photoURL?: string;
  role: string;
  bio?: string;
  bannerURL?: string;
  promoVideoUrl?: string;
}

function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "").trim() || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return id;
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
    return null;
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

function buildVideoSource(url: string) {
  const youtubeId = getYoutubeId(url);
  if (youtubeId) return { type: "youtube" as const, youtubeId };
  const vimeoId = getVimeoId(url);
  if (vimeoId) return { type: "vimeo" as const, vimeoId };
  return { type: "direct" as const, src: url };
}

function PromoVideoCard({ url }: { url: string; youtubeId: string | null }) {
  return (
    <div className="aspect-video max-w-lg rounded-lg overflow-hidden bg-black">
      <VideoPlayer source={buildVideoSource(url)} />
    </div>
  );
}

export const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  teacher: { label: "Professor", color: "bg-green-500/15 text-green-400 border-green-500" },
  institution: { label: "Instituição", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500" },
  admin: { label: "Admin", color: "bg-purple-500/15 text-purple-400 border-purple-500" },
  aluno: { label: "Aluno", color: "bg-blue-500/15 text-blue-400 border-blue-500" },
};

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      try {
        const [userSnap, coursesSnap, livesSnap] = await Promise.all([
          getDoc(doc(db, "users", userId)),
          getDocs(query(collection(db, "courses"), where("createdBy", "==", userId), where("status", "==", "published"), orderBy("createdAt", "desc"))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, "lives"), where("createdBy", "==", userId))).catch(() => ({ docs: [] })),
        ]);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({ name: data.name || "Utilizador", photoURL: data.photoURL || "", role: data.role || "aluno", bio: data.bio || "", bannerURL: data.bannerURL || "", promoVideoUrl: data.promoVideoUrl || "" });
        }
        setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
        setLives(livesSnap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSession)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  return { profile, courses, lives, loading };
}

export function ProfileContent({ profile, courses, lives, courseHref, coverClassName, contentClassName, userId }: {
  profile: ProfileData;
  courses: Course[];
  lives: LiveSession[];
  courseHref: (courseId: string) => string;
  coverClassName?: string;
  contentClassName?: string;
  userId?: string;
}) {
  const roleInfo = ROLE_LABELS[profile.role] || ROLE_LABELS.aluno;
  const totalStudents = courses.reduce((sum, c) => sum + (c.views || 0), 0);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });

  const hasBanner = !!profile.bannerURL;
  const hasPhoto = !!profile.photoURL;

  return (
    <div>
      {/* Cover */}
      <div className={`relative h-32 sm:h-48 overflow-hidden ${coverClassName || ""}`}>
        {hasBanner ? (
          <div className="absolute inset-0 w-full h-full">
            <img src={profile.bannerURL} alt={`Banner de ${profile.name}`} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent" />
          </div>
        ) : hasPhoto ? (
          <div className="absolute inset-0 w-full h-full">
            <img src={profile.photoURL} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl brightness-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900/30 via-gray-900 to-gray-950" />
        )}
      </div>

      <div className={`-mt-16 sm:-mt-20 ${contentClassName || ""}`}>
      {/* Profile Header */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6 border-b border-gray-800">
        {profile.photoURL ? (
          <button type="button" onClick={() => setPhotoPreviewUrl(profile.photoURL!)}
            className="shrink-0 cursor-pointer focus:outline-none">
             <img src={profile.photoURL} alt={profile.name} className="h-20 w-20 sm:h-28 sm:w-28 border-4 border-gray-950 object-cover hover:brightness-75 transition-all" />
          </button>
        ) : (
          <div className="h-20 w-20 sm:h-28 sm:w-28 border-4 border-gray-950 overflow-hidden shrink-0">
            <Avatar uid={userId ?? ""} name={profile.name} size={112} className="h-full w-full" />
          </div>
        )}
        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-white truncate" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>{profile.name}</h1>
            <span className={`text-sm font-bold px-2.5 py-1 border ${roleInfo.color}`}>{roleInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-900 border border-gray-800 p-5 text-center rounded-xl">
          <BookOpen className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{courses.length}</p>
          <p className="text-sm text-gray-500">{courses.length === 1 ? "Curso" : "Cursos"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-5 text-center rounded-xl">
          <Radio className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{lives.length}</p>
          <p className="text-sm text-gray-500">{lives.length === 1 ? "Live" : "Lives"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-5 text-center rounded-xl">
          <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalStudents}</p>
          <p className="text-sm text-gray-500">Alunos</p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mt-8 bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold text-white mb-3">Sobre</h2>
          <p className="text-gray-400 leading-relaxed whitespace-pre-line">{profile.bio}</p>
        </div>
      )}

      {/* Promo Video */}
      {profile.promoVideoUrl && (() => {
        const youtubeId = profile.promoVideoUrl ? getYoutubeId(profile.promoVideoUrl) : null;
        return (
          <div className="mt-8 bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Play className="h-5 w-5 text-red-400" />
              Vídeo de Apresentação
            </h2>
            <PromoVideoCard url={profile.promoVideoUrl} youtubeId={youtubeId} />
          </div>
        );
      })()}

      {/* Content */}
      <div className="mt-8 space-y-10">
        {courses.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              Cursos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {courses.filter(c => c.id).map((course) => (
                <Link key={course.id} href={courseHref(course.id ?? "")}
                  className="group flex flex-col bg-gray-900 overflow-hidden transition-all hover:bg-gray-900 rounded-xl">
                   <div className="relative h-36 sm:h-44 bg-gray-800">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-900/40 to-gray-900">
                        <BookOpen className="h-12 w-12 text-blue-500" />
                      </div>
                    )}
                    {course.price ? (
                      <span className="absolute top-3 right-3 px-2 py-1 text-sm font-bold bg-gray-900 text-white border border-gray-700">
                        {course.price.toLocaleString("pt-AO")} Kz
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 px-2 py-1 text-sm font-bold bg-green-500/15 text-green-400 border border-green-500">
                        Grátis
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-4 sm:p-5">
                    <h3 className="font-bold text-white text-base sm:text-lg leading-snug line-clamp-2">{course.title}</h3>
                    <p className="mt-2 text-sm text-gray-400 line-clamp-2">{course.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                      <span><BookOpen className="h-3.5 w-3.5 inline mr-1" />{course.modulesCount ?? 0} módulos</span>
                      <span><Play className="h-3.5 w-3.5 inline mr-1" />{course.lessonsCount ?? 0} aulas</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {lives.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-400" />
              Aulas ao Vivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lives.filter(l => l.id).map((live) => (
                <div key={live.id} className="bg-gray-900 overflow-hidden group hover:bg-gray-900 transition-all rounded-xl">
                  <div className="relative h-32 overflow-hidden">
                    {live.thumbnail ? (
                      <img src={live.thumbnail} alt={live.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-gray-900 flex items-center justify-center">
                        <Radio className="h-10 w-10 text-gray-700" />
                      </div>
                    )}
                    {live.status === "live" && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-sm font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />AO VIVO
                      </div>
                    )}
                    {live.status === "ended" && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-gray-800 text-gray-400 text-sm font-bold">Encerrada</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white truncate">{live.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(live.scheduledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {courses.length === 0 && lives.length === 0 && (
          <div className="text-center py-20">
            <GraduationCap className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">Este utilizador ainda não publicou conteúdo.</p>
          </div>
        )}
      </div>
      </div>

      {photoPreviewUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-4"
          onClick={() => setPhotoPreviewUrl(null)}>
          <div className="relative max-w-lg w-full max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPhotoPreviewUrl(null)}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
            <img src={photoPreviewUrl} alt={profile.name}
              className="w-full h-full object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
