"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  BookOpen, Loader2, Eye, Share2, CheckCircle2,
  ArrowRight, Search, X, UserPlus,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { logger } from "@/lib/logger";
import type { Course } from "@/types/course";

interface Member {
  userId: string;
  name: string;
  email: string;
}

function toDate(raw: unknown): Date {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  return new Date(0);
}

export default function InstitutionCoursesPage() {
  const { institutionId } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Assign professor modal
  const [assignModal, setAssignModal] = useState<{ open: boolean; course: Course | null }>({ open: false, course: null });
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const loadCourses = useCallback(async () => {
    if (!institutionId) return;
    try {
      const membersSnap = await getDocs(
        query(collection(db, "users"), where("institutionId", "==", institutionId))
      );
      const teacherUids = membersSnap.docs
        .filter(d => d.data().institutionRole === "teacher")
        .map(d => d.id);

      // Also check institutionMembers collection
      const instMembersSnap = await getDocs(
        query(collection(db, "institutionMembers"),
          where("institutionId", "==", institutionId),
          where("status", "==", "active"),
          where("role", "==", "teacher")
        )
      );
      instMembersSnap.docs.forEach(d => {
        const uid = d.data().userId;
        if (!teacherUids.includes(uid)) teacherUids.push(uid);
      });

      if (teacherUids.length === 0) { setLoading(false); return; }

      const chunks: string[][] = [];
      for (let i = 0; i < teacherUids.length; i += 30) chunks.push(teacherUids.slice(i, i + 30));

      const allCourses: Course[] = [];
      await Promise.all(chunks.map(async chunk => {
        const snap = await getDocs(
          query(collection(db, "courses"), where("createdBy", "in", chunk))
        );
        snap.docs.forEach(d => allCourses.push({ id: d.id, ...d.data() } as Course));
      }));

      allCourses.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
      setCourses(allCourses);
    } catch (err) {
      logger.error("InstitutionCourses: failed to load", err, { institutionId });
      toast.error("Erro ao carregar cursos.");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

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

  // ── Assign professor ──
  const openAssignModal = async (e: React.MouseEvent, course: Course) => {
    e.preventDefault(); e.stopPropagation();
    setAssignModal({ open: true, course });
    setMembersLoading(true);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/members`);
      if (!res.ok) throw new Error("Falha");
      const data = await res.json();
      setMembers(
        (data.members || [])
          .filter((m: { role: string }) => m.role === "teacher")
          .map((m: { userId: string; name: string; email: string }) => ({
            userId: m.userId, name: m.name, email: m.email,
          }))
      );
    } catch {
      toast.error("Erro ao carregar professores.");
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAssign = async (member: Member) => {
    if (!institutionId || !assignModal.course || assigning) return;
    setAssigning(true);
    try {
      const res = await fetchWithAuth(`/api/courses/${assignModal.course.id}/assign-professor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: assignModal.course.id,
          instructorUid: member.userId,
          instructorName: member.name,
          instructorEmail: member.email,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha");
      }
      toast.success(`${member.name} atribuído(a) ao curso!`);
      setAssignModal({ open: false, course: null });
      loadCourses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atribuir professor.");
    } finally {
      setAssigning(false);
    }
  };

  const hasFilters = filter !== "all" || search.trim() !== "";

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-8 w-40 bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-gray-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-2">// cursos</p>
          <h1 className="text-2xl font-bold text-gray-100">Cursos</h1>
          <p className="mt-1 text-sm text-gray-600">
            {filtered.length} de {courses.length} curso{courses.length !== 1 ? "s" : ""} dos teus professores
          </p>
        </div>
      </div>

      {/* ── Search + filter ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar cursos..."
            className="w-full border border-gray-800 bg-gray-900 pl-9 pr-9 py-2.5 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3 w-3 text-gray-700 hover:text-gray-500 transition-colors" />
            </button>
          )}
        </div>
        <select
          value={filter} onChange={e => setFilter(e.target.value as typeof filter)}
          className="border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-400 focus:border-purple focus:outline-none transition-colors"
        >
          <option value="all">Todos</option>
          <option value="published">Publicados</option>
          <option value="draft">Rascunho</option>
        </select>
      </div>

      {/* ── Empty ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <BookOpen className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            {hasFilters ? "// sem resultados" : "// sem cursos"}
          </p>
          <p className="text-sm text-gray-600 mb-5">
            {hasFilters
              ? "Nenhum curso corresponde aos filtros."
              : "Os cursos criados pelos professores da tua instituição aparecerão aqui."
            }
          </p>
          {hasFilters ? (
            <button onClick={() => { setSearch(""); setFilter("all"); }} className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
              ← Limpar filtros
            </button>
          ) : (
            <Link href="/dashboard/institution/members" className="flex items-center gap-1.5 border border-purple bg-purple/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-purple hover:bg-purple/15 transition-all">
              Adicionar Professores <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* ── Course Grid ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(course => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="group border border-gray-800 bg-gray-900 overflow-hidden hover:border-purple hover:bg-gray-900 transition-all"
            >
              <div className="relative h-40 bg-gray-900 overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-10 w-10 text-gray-800" strokeWidth={1} />
                  </div>
                )}

                <span className={`absolute top-3 left-3 font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${
                  course.status === "published" ? "border-green text-green bg-gray-950" : "border-amber-500 text-amber-400 bg-gray-950"
                }`}>
                  {course.status === "published" ? "pub" : "draft"}
                </span>

                <div className="absolute top-3 right-3 flex gap-1">
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setAssignModal({ open: true, course }); openAssignModal(e, course); }}
                    title="Atribuir professor"
                    className="flex h-7 w-7 items-center justify-center border border-gray-800 bg-gray-950 text-gray-500 hover:text-green transition-all"
                  >
                    <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={e => handleShare(e, course.id!)}
                    title="Copiar link de venda"
                    className="flex h-7 w-7 items-center justify-center border border-gray-800 bg-gray-950 text-gray-500 hover:text-gray-200 transition-all"
                  >
                    {copiedId === course.id ? <CheckCircle2 className="h-3.5 w-3.5 text-green" strokeWidth={1.5} /> : <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                  {course.title}
                </p>
                {course.instructorName && (
                  <p className="text-xs text-green mt-1">Prof: {course.instructorName}</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                  {course.description || "Sem descrição."}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-4">
                  <span className="flex items-center gap-1 font-mono text-[13px] text-gray-700">
                    <Eye className="h-3 w-3" strokeWidth={1.5} /> {course.views || 0}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[13px] text-gray-700">
                    <BookOpen className="h-3 w-3" strokeWidth={1.5} /> {course.lessonsCount || 0} aulas
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Assign Professor Modal ── */}
      {assignModal.open && assignModal.course && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-100">Atribuir Professor</h2>
                <p className="text-sm text-gray-600 truncate max-w-[300px]">Curso: {assignModal.course.title}</p>
              </div>
              <button onClick={() => setAssignModal({ open: false, course: null })} className="text-gray-700 hover:text-gray-400 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {membersLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-purple" />
                </div>
              )}

              {!membersLoading && members.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-600">Nenhum professor na instituição.</p>
                  <Link href="/dashboard/institution/members" className="text-sm text-purple hover:text-purple-light mt-2 inline-block">
                    Adicionar professores →
                  </Link>
                </div>
              )}

              {!membersLoading && members.length > 0 && (
                <div className="divide-y divide-gray-800">
                  {members.map(member => (
                    <div key={member.userId} className="flex items-center justify-between px-5 py-3 hover:bg-gray-900/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gray-800 bg-gray-950 text-sm font-semibold text-gray-500">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{member.name}</p>
                          <p className="font-mono text-xs text-gray-600 truncate">{member.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssign(member)}
                        disabled={assigning}
                        className="flex items-center gap-1.5 border border-green bg-green/8 px-3 py-1.5 font-mono text-[13px] uppercase tracking-widest text-green hover:bg-green/15 disabled:opacity-40 transition-all shrink-0 ml-3"
                      >
                        {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" strokeWidth={2} />}
                        Atribuir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setAssignModal({ open: false, course: null })}
                className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
