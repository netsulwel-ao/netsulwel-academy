"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, where, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  Plus, Pencil, Trash2, Loader2, BookOpen, AlertTriangle,
  Share2, CheckCircle2, Radio, Search, X, Filter,
  Eye, EyeOff, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// ── Types ─────────────────────────────────────────────────────
interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  modulesCount: number;
  lessonsCount: number;
  status: "published" | "draft";
  format?: "recorded" | "live";
  type?: "standalone" | "smart" | "golden";
  category?: string;
  level?: string;
  price?: number;
  createdBy?: string;
  createdAt: unknown;
}

function toDate(raw: unknown): Date {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  return new Date(0);
}

function formatKz(v: number) {
  return v.toLocaleString("pt-AO") + " Kz";
}

// ── Badge helpers ─────────────────────────────────────────────
function StatusBadge({ status }: { status: "published" | "draft" }) {
  return (
    <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${
      status === "published"
        ? "border-green/30 text-green/70 bg-green/8"
        : "border-amber-500/30 text-amber-400/70 bg-amber-500/8"
    }`}>
      {status === "published" ? "pub" : "draft"}
    </span>
  );
}

function TypeBadge({ type }: { type?: string }) {
  const map: Record<string, string> = {
    standalone: "border-blue-500/25 text-blue-400/70",
    smart:      "border-green/25 text-green/70",
    golden:     "border-amber-500/25 text-amber-400/70",
  };
  if (!type) return null;
  return (
    <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${map[type] ?? "border-gray-700 text-gray-600"}`}>
      {type}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function CoursesPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Filtros / pesquisa ──────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [filterType, setFilterType]     = useState<"all" | "standalone" | "smart" | "golden">("all");
  const [filterFormat, setFilterFormat] = useState<"all" | "recorded" | "live">("all");
  const [showFilters, setShowFilters]   = useState(false);

  // ── Load ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Sem orderBy composto — ordena em memória
      const q = isTeacher && !isAdmin
        ? query(collection(db, "courses"), where("createdBy", "==", user.uid))
        : query(collection(db, "courses"));

      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Course))
        .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
      setCourses(data);
    } catch (err) {
      logger.error("AdminCourses: failed to load", err);
      setError("Não foi possível carregar os cursos.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isTeacher, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Filtrar/pesquisar ────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return courses.filter(c => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterType   !== "all" && c.type   !== filterType)   return false;
      if (filterFormat !== "all" && c.format !== filterFormat) return false;
      if (q) return c.title.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false);
      return true;
    });
  }, [courses, search, filterStatus, filterType, filterFormat]);

  // ── Acções ──────────────────────────────────────────────────
  const handleDelete = useCallback((course: Course) => {
    toast.error(`Apagar "${course.title}"?`, {
      description: "Esta acção é irreversível.",
      action: {
        label: "Apagar",
        onClick: async () => {
          setDeletingId(course.id);
          try {
            await deleteDoc(doc(db, "courses", course.id));
            setCourses(prev => prev.filter(c => c.id !== course.id));
            toast.success("Curso apagado.");
          } catch (err) {
            logger.error("AdminCourses: delete failed", err, { courseId: course.id });
            toast.error("Erro ao apagar o curso.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    });
  }, []);

  const handleToggleStatus = useCallback(async (course: Course) => {
    const next = course.status === "published" ? "draft" : "published";
    setTogglingId(course.id);
    try {
      await updateDoc(doc(db, "courses", course.id), { status: next, updatedAt: serverTimestamp() });
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: next } : c));
      toast.success(next === "published" ? `"${course.title}" publicado.` : `"${course.title}" movido para rascunho.`);
    } catch (err) {
      logger.error("AdminCourses: toggle status failed", err, { courseId: course.id });
      toast.error("Erro ao alterar estado do curso.");
    } finally {
      setTogglingId(null);
    }
  }, []);

  const handleCopyLink = useCallback((id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/courses/${id}`);
    setCopiedId(id);
    toast.success("Link copiado.");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const hasFilters = filterStatus !== "all" || filterType !== "all" || filterFormat !== "all" || search.trim() !== "";
  const clearFilters = () => { setSearch(""); setFilterStatus("all"); setFilterType("all"); setFilterFormat("all"); };

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">
            // gestão de cursos
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Cursos</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? "A carregar..." : `${filtered.length} de ${courses.length} curso${courses.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-1.5 bg-purple px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-purple-600 transition-all shrink-0"
        >
          <Plus className="h-3 w-3" /> Novo curso
        </Link>
      </div>

      {/* ── Barra de pesquisa + filtros ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por título ou descrição..."
              className="w-full border border-gray-800 bg-gray-900 pl-9 pr-9 py-2.5 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-gray-700 hover:text-gray-500 transition-colors" />
              </button>
            )}
          </div>

          {/* Toggle filtros */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 border px-3 py-2.5 font-mono text-[13px] uppercase tracking-widest transition-all shrink-0 ${
              hasFilters
                ? "border-purple/30 bg-purple/8 text-purple/70"
                : "border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-400"
            }`}
          >
            <Filter className="h-3 w-3" strokeWidth={1.5} />
            Filtros
            {hasFilters && <span className="h-1.5 w-1.5 bg-purple/70 rounded-full" />}
          </button>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 border border-gray-800 bg-gray-900 px-4 py-3">
            {/* Status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
              className="border border-gray-800 bg-gray-900 text-sm text-gray-400 px-3 py-1.5 focus:outline-none focus:border-purple/30 transition-colors"
            >
              <option value="all">Todos os estados</option>
              <option value="published">Publicado</option>
              <option value="draft">Rascunho</option>
            </select>

            {/* Tipo */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as typeof filterType)}
              className="border border-gray-800 bg-gray-900 text-sm text-gray-400 px-3 py-1.5 focus:outline-none focus:border-purple/30 transition-colors"
            >
              <option value="all">Todos os tipos</option>
              <option value="standalone">Standalone</option>
              <option value="smart">Smart</option>
              <option value="golden">Golden</option>
            </select>

            {/* Formato */}
            <select
              value={filterFormat}
              onChange={e => setFilterFormat(e.target.value as typeof filterFormat)}
              className="border border-gray-800 bg-gray-900 text-sm text-gray-400 px-3 py-1.5 focus:outline-none focus:border-purple/30 transition-colors"
            >
              <option value="all">Todos os formatos</option>
              <option value="recorded">Gravado</option>
              <option value="live">Ao vivo</option>
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <BookOpen className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            {hasFilters ? "// sem resultados" : "// sem cursos"}
          </p>
          <p className="text-sm text-gray-600 mb-5">
            {hasFilters ? "Nenhum curso corresponde aos filtros activos." : "Cria o primeiro curso para os alunos começarem a aprender."}
          </p>
          {hasFilters ? (
            <button
              onClick={clearFilters}
              className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
            >
              ← Limpar filtros
            </button>
          ) : (
            <Link
              href="/admin/courses/new"
              className="flex items-center gap-1.5 bg-purple px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-purple-600 transition-all"
            >
              <Plus className="h-3 w-3" /> Criar curso
            </Link>
          )}
        </div>
      )}

      {/* ── Tabela de cursos ── */}
      {!loading && filtered.length > 0 && (
        <div className="border border-gray-800">
          {/* Cabeçalho da tabela */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-800 bg-gray-900">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Curso</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Tipo · Formato</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Aulas</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Estado</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Acções</p>
          </div>

          <div className="divide-y divide-gray-800">
            {filtered.map(course => (
              <div
                key={course.id}
                className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-gray-900 transition-colors"
              >
                {/* Curso: thumb + título */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-16 shrink-0 overflow-hidden border border-gray-800 bg-gray-900">
                    {course.thumbnail
                      ? <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center">
                          <BookOpen className="h-4 w-4 text-gray-800" strokeWidth={1} />
                        </div>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-200 truncate">{course.title}</p>
                    <p className="text-sm text-gray-600 truncate mt-0.5 line-clamp-1">
                      {course.description || "Sem descrição"}
                    </p>
                  </div>
                </div>

                {/* Tipo + Formato */}
                <div className="flex flex-wrap items-center gap-1.5 lg:flex-col lg:items-start">
                  <TypeBadge type={course.type} />
                  {course.format === "live" && (
                    <span className="font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border border-red-500/25 text-red-400/70 flex items-center gap-1">
                      <Radio className="h-2.5 w-2.5" strokeWidth={1.5} /> live
                    </span>
                  )}
                  {course.price !== undefined && course.price > 0 && (
                    <span className="font-mono text-[13px] text-gray-600">{formatKz(course.price)}</span>
                  )}
                </div>

                {/* Aulas */}
                <div className="hidden lg:block">
                  <p className="font-mono text-sm text-gray-300">{course.lessonsCount ?? 0}</p>
                  <p className="font-mono text-[13px] text-gray-700">{course.modulesCount ?? 0} módulo{(course.modulesCount ?? 0) !== 1 ? "s" : ""}</p>
                </div>

                {/* Estado */}
                <div className="hidden lg:flex items-center gap-2">
                  <StatusBadge status={course.status} />
                </div>

                {/* Acções */}
                <div className="flex items-center gap-1.5 flex-wrap lg:flex-nowrap">
                  {/* Mobile: badges inline */}
                  <div className="flex items-center gap-1.5 lg:hidden">
                    <StatusBadge status={course.status} />
                    <TypeBadge type={course.type} />
                  </div>

                  {/* Toggle pub/draft */}
                  <button
                    onClick={() => handleToggleStatus(course)}
                    disabled={togglingId === course.id}
                    title={course.status === "published" ? "Mover para rascunho" : "Publicar"}
                    className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 disabled:opacity-50 transition-all"
                  >
                    {togglingId === course.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : course.status === "published"
                        ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
                        : <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    }
                  </button>

                  {/* Copiar link */}
                  <button
                    onClick={() => handleCopyLink(course.id)}
                    title="Copiar link"
                    className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all"
                  >
                    {copiedId === course.id
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green/60" strokeWidth={1.5} />
                      : <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    }
                  </button>

                  {/* Live studio (se formato live) */}
                  {course.format === "live" && (
                    <Link
                      href={`/admin/courses/${course.id}/live-studio`}
                      title="Estúdio ao vivo"
                      className="flex h-8 w-8 items-center justify-center border border-red-500/25 bg-red-500/5 text-red-400/70 hover:bg-red-500/15 transition-all"
                    >
                      <Radio className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Link>
                  )}

                  {/* Editar */}
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    title="Editar curso"
                    className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-purple/30 hover:text-purple/70 transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Link>

                  {/* Apagar */}
                  <button
                    onClick={() => handleDelete(course)}
                    disabled={deletingId === course.id}
                    title="Apagar curso"
                    className="flex h-8 w-8 items-center justify-center border border-red-500/15 bg-red-500/5 text-red-400/50 hover:border-red-500/30 hover:text-red-400/80 disabled:opacity-40 transition-all"
                  >
                    {deletingId === course.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer com contagem */}
          <div className="px-5 py-3 border-t border-gray-800 bg-gray-900">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              {hasFilters && ` (filtrado de ${courses.length})`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
