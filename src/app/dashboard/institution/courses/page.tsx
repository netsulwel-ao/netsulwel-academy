"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  BookOpen, Loader2, Eye, Share2, CheckCircle2,
  ArrowRight, Search, X, Filter,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { Course } from "@/types/course";

function toDate(raw: unknown): Date {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  return new Date(0);
}

export default function InstitutionCoursesPage() {
  const { institutionId } = useAuth();
  const [courses,   setCourses]   = useState<Course[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<"all" | "published" | "draft">("all");
  const [copiedId,  setCopiedId]  = useState<string | null>(null);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    (async () => {
      try {
        // 1. Get teacher UIDs in this institution
        const membersSnap = await getDocs(
          query(collection(db, "users"), where("institutionId", "==", institutionId))
        );
        const teacherUids = membersSnap.docs
          .filter(d => d.data().institutionRole === "teacher")
          .map(d => d.id);

        if (teacherUids.length === 0) { if (!cancelled) setLoading(false); return; }

        // 2. Fetch courses — sem orderBy composto, sem "in" + orderBy
        //    Divide into chunks of 30 (Firestore "in" limit)
        const chunks: string[][] = [];
        for (let i = 0; i < teacherUids.length; i += 30) chunks.push(teacherUids.slice(i, i + 30));

        const allCourses: Course[] = [];
        await Promise.all(chunks.map(async chunk => {
          const snap = await getDocs(
            query(collection(db, "courses"), where("createdBy", "in", chunk))
          );
          snap.docs.forEach(d => allCourses.push({ id: d.id, ...d.data() } as Course));
        }));

        if (cancelled) return;
        // Sort in memory
        allCourses.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
        setCourses(allCourses);
      } catch (err) {
        logger.error("InstitutionCourses: failed to load", err, { institutionId });
        toast.error("Erro ao carregar cursos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [institutionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return courses.filter(c => {
      if (filter !== "all" && c.status !== filter) return false;
      if (q) return c.title.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false);
      return true;
    });
  }, [courses, search, filter]);

  const handleShare = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/s/${courseId}`;
    try {
      if (navigator.share) await navigator.share({ url });
      else { await navigator.clipboard.writeText(url); setCopiedId(courseId); setTimeout(() => setCopiedId(null), 2500); }
    } catch { /* cancelled */ }
  };

  const hasFilters = filter !== "all" || search.trim() !== "";

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-8 w-40 bg-gray-800/40 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-gray-800/40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[80rem] space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple/60 mb-2">// cursos</p>
          <h1 className="text-2xl font-bold text-gray-100">Cursos</h1>
          <p className="mt-1 text-sm text-gray-600">
            {filtered.length} de {courses.length} curso{courses.length !== 1 ? "s" : ""} dos teus professores
          </p>
        </div>
      </div>

      {/* ── Pesquisa + filtro ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar cursos..."
            className="w-full border border-gray-800/60 bg-gray-900/10 pl-9 pr-9 py-2.5 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3 w-3 text-gray-700 hover:text-gray-500 transition-colors" />
            </button>
          )}
        </div>
        <select
          value={filter} onChange={e => setFilter(e.target.value as typeof filter)}
          className="border border-gray-800/60 bg-gray-900/10 py-2.5 px-3 text-sm text-gray-400 focus:border-purple/30 focus:outline-none transition-colors"
        >
          <option value="all">Todos</option>
          <option value="published">Publicados</option>
          <option value="draft">Rascunho</option>
        </select>
      </div>

      {/* ── Empty ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800/60 bg-gray-900/10 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <BookOpen className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-2">
            {hasFilters ? "// sem resultados" : "// sem cursos"}
          </p>
          <p className="text-sm text-gray-600 mb-5">
            {hasFilters
              ? "Nenhum curso corresponde aos filtros."
              : "Os cursos criados pelos professores da tua instituição aparecerão aqui."
            }
          </p>
          {hasFilters ? (
            <button onClick={() => { setSearch(""); setFilter("all"); }} className="font-mono text-[10px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
              ← Limpar filtros
            </button>
          ) : (
            <Link href="/dashboard/institution/members" className="flex items-center gap-1.5 border border-purple/25 bg-purple/8 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-purple/70 hover:bg-purple/15 transition-all">
              Convidar Professores <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* ── Grid de cursos ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(course => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="group border border-gray-800/60 bg-gray-900/10 overflow-hidden hover:border-purple/30 hover:bg-gray-900/20 transition-all"
            >
              {/* Thumb */}
              <div className="relative h-40 bg-gray-900 overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail} alt={course.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-10 w-10 text-gray-800" strokeWidth={1} />
                  </div>
                )}

                {/* Status badge */}
                <span className={`absolute top-3 left-3 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                  course.status === "published"
                    ? "border-green/30 text-green/80 bg-gray-950/80"
                    : "border-amber-500/30 text-amber-400/80 bg-gray-950/80"
                }`}>
                  {course.status === "published" ? "pub" : "draft"}
                </span>

                {/* Share button */}
                <button
                  onClick={e => handleShare(e, course.id!)}
                  title="Copiar link de venda"
                  className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center border border-gray-800/60 bg-gray-950/80 text-gray-500 hover:text-gray-200 transition-all"
                >
                  {copiedId === course.id
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green/60" strokeWidth={1.5} />
                    : <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  }
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                  {course.title}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                  {course.description || "Sem descrição."}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-800/40 flex items-center gap-4">
                  <span className="flex items-center gap-1 font-mono text-[9px] text-gray-700">
                    <Eye className="h-3 w-3" strokeWidth={1.5} /> {course.views || 0}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[9px] text-gray-700">
                    <BookOpen className="h-3 w-3" strokeWidth={1.5} /> {course.lessonsCount || 0} aulas
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
