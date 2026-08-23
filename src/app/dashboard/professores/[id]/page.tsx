"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Loader2, GraduationCap,
  BookOpen, Radio, Users, X,
} from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/components/ProfileContent";
import { Avatar } from "@/components/ui/Avatar";
import type { Course } from "@/types/course";
import type { LiveSession } from "@/types/live";

// ── Labels ────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  teacher:     { label: "Professor",  color: "border-green bg-green/8 text-green" },
  institution: { label: "Instituição",color: "border-blue-500 bg-blue-500/8 text-blue-400" },
  admin:       { label: "Admin",      color: "border-purple bg-purple/8 text-purple" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Card de curso (inline) ─────────────────────────────────────
function ProfileCourseCard({ course, href }: { course: Course; href: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-700 hover:bg-gray-900 transition-all"
    >
      <div className="relative aspect-video bg-gray-900 shrink-0">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title}
            className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-8 w-8 text-gray-800" strokeWidth={1} />
          </div>
        )}
        <div className="absolute right-2.5 top-2.5">
          <span className={`font-mono text-[13px] font-bold border px-2 py-0.5 ${
            (course.price ?? 0) === 0
              ? "border-green bg-gray-950 text-green"
              : "border-gray-700 bg-gray-950 text-gray-400"
          }`}>
            {(course.price ?? 0) === 0 ? "Grátis" : `${course.price!.toLocaleString("pt-AO")} Kz`}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {course.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 font-mono text-[13px] text-gray-700">
          <span>{course.modulesCount ?? 0} mód.</span>
          <span>·</span>
          <span>{course.lessonsCount ?? 0} aulas</span>
        </div>
      </div>
    </Link>
  );
}

// ── Card de live (inline) ──────────────────────────────────────
function ProfileLiveCard({ live }: { live: LiveSession }) {
  return (
    <div className="flex items-center gap-3 border border-gray-800 bg-gray-900 p-3">
      <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-gray-900 border border-gray-800">
        {live.thumbnail ? (
          <img src={live.thumbnail} alt={live.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Radio className="h-4 w-4 text-gray-800" strokeWidth={1} />
          </div>
        )}
        {live.status === "live" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-300 truncate">{live.title}</p>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-[13px] text-gray-700">
          {live.status === "live" && (
            <span className="text-red-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              ao vivo
            </span>
          )}
          {live.status !== "live" && <span>{fmtDate(live.scheduledAt)}</span>}
          {live.status === "ended" && <span className="text-gray-700">· encerrada</span>}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────
export default function DashboardProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, courses, lives, loading } = useProfile(id);
  const [photoPreview, setPhotoPreview] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-[56rem] mx-auto py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900 mx-auto">
          <GraduationCap className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">// não encontrado</p>
        <p className="text-sm text-gray-600 mb-6">Utilizador não encontrado.</p>
        <button
          onClick={() => router.push("/dashboard/professores")}
          className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  const roleBadge = ROLE_BADGE[profile.role] ?? ROLE_BADGE.teacher;
  const totalViews = courses.reduce((sum, c) => sum + (c.views ?? 0), 0);

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => router.push("/dashboard/professores")}
        className="flex items-center gap-1 font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors"
      >
        <ChevronLeft className="h-3 w-3" /> Professores
      </button>

      {/* ── Hero — layout limpo sem sobreposição frágil ── */}
      <div className="border border-gray-800 overflow-hidden">
        {/* Banner */}
        <div className="relative h-28 sm:h-40 bg-gray-900">
          {profile.bannerURL ? (
            <>
              <img src={profile.bannerURL} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
            </>
          ) : profile.photoURL ? (
            <>
              <img src={profile.photoURL} alt="" className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl brightness-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 grid-bg opacity-60" />
          )}
        </div>

        {/* Barra de perfil */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-900 border-t border-gray-800 px-5 sm:px-8 py-5">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => profile.photoURL && setPhotoPreview(true)}
            className={`shrink-0 h-16 w-16 sm:h-20 sm:w-20 overflow-hidden border-2 border-gray-800 ${
              profile.photoURL ? "cursor-pointer hover:brightness-75 transition-all" : "cursor-default"
            }`}
          >
            <Avatar
              uid={id}
              photoURL={profile.photoURL}
              name={profile.name}
              size={80}
              className="h-full w-full"
            />
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-100">{profile.name}</h1>
              <span className={`font-mono text-[13px] uppercase tracking-widest border px-2 py-0.5 ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
            {profile.bio && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2 max-w-xl">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: BookOpen, label: "Cursos",  value: courses.length, color: "text-purple" },
          { icon: Radio,    label: "Ao vivo", value: lives.length,   color: "text-red-400" },
          { icon: Users,    label: "Alcance", value: totalViews,     color: "text-blue-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="border border-gray-800 bg-gray-900 px-4 py-4 flex items-center gap-3">
            <Icon className={`h-5 w-5 shrink-0 ${color}`} strokeWidth={1.5} />
            <div>
              <p className="font-mono text-base font-bold text-gray-200">{value}</p>
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bio completa (se longa) — só se não aparecer truncada no header ── */}
      {profile.bio && profile.bio.length > 120 && (
        <div className="border border-gray-800 bg-gray-900 p-5">
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">// sobre</p>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{profile.bio}</p>
        </div>
      )}

      {/* ── Cursos ── */}
      {courses.length > 0 && (
        <section>
          <div className="mb-4">
            <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-1">// cursos</p>
            <h2 className="text-base font-bold text-gray-200">
              Cursos publicados
              <span className="ml-2 font-mono text-sm text-gray-700">({courses.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.filter(c => c.id).map(c => (
              <ProfileCourseCard
                key={c.id}
                course={c}
                href={`/dashboard/courses/${c.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Lives ── */}
      {lives.length > 0 && (
        <section>
          <div className="mb-4">
            <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-red-400 mb-1">// ao vivo</p>
            <h2 className="text-base font-bold text-gray-200">
              Aulas ao vivo
              <span className="ml-2 font-mono text-sm text-gray-700">({lives.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lives.filter(l => l.id).map(l => (
              <ProfileLiveCard key={l.id} live={l} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty ── */}
      {courses.length === 0 && lives.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <GraduationCap className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// sem conteúdo</p>
          <p className="text-sm text-gray-600">Este utilizador ainda não publicou conteúdo.</p>
        </div>
      )}

      {/* ── Preview da foto ── */}
      {photoPreview && profile.photoURL && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-950 p-4"
          onClick={() => setPhotoPreview(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors"
            onClick={() => setPhotoPreview(false)}
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={profile.photoURL}
            alt={profile.name}
            className="max-h-[80vh] max-w-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
