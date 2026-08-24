"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Search, Loader2, Link2, Copy, CheckCheck,
  Calendar, GraduationCap, UserPlus, X, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { logger } from "@/lib/logger";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  photoURL?: string;
  role: string;
  addedAt: Date | null;
  source: "collection" | "legacy";
}

interface SearchResult {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  alreadyMember: boolean;
}

const ROLE_MAP: Record<string, { cls: string; label: string }> = {
  admin:   { cls: "border-purple text-purple",       label: "Admin"     },
  teacher: { cls: "border-green text-green",         label: "Professor" },
  student: { cls: "border-blue-500 text-blue-400",   label: "Aluno"     },
  aluno:   { cls: "border-blue-500 text-blue-400",   label: "Aluno"     },
};
function RoleBadge({ role }: { role: string }) {
  const { cls, label } = ROLE_MAP[role] ?? ROLE_MAP.aluno;
  return <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${cls}`}>{label}</span>;
}

const inputCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors";

export default function InstitutionMembersPage() {
  const { institutionId } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Invite link state
  const [studentLink, setStudentLink] = useState("");
  const [teacherLink, setTeacherLink] = useState("");
  const [generatingRole, setGeneratingRole] = useState<"student" | "teacher" | null>(null);
  const [copiedRole, setCopiedRole] = useState<"student" | "teacher" | null>(null);

  // Add professor modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addResults, setAddResults] = useState<SearchResult[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!institutionId) return;
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/members`);
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await res.json();
      const list: Member[] = (data.members || []).map((m: Record<string, unknown>) => ({
        id: m.id,
        userId: m.userId,
        name: m.name || "Sem nome",
        email: m.email || "",
        photoURL: m.photoURL,
        role: m.role || "student",
        addedAt: m.addedAt ? new Date(m.addedAt as string | number | Date) : null,
        source: m.source || "collection",
      }));
      setMembers(list);
    } catch (err) {
      logger.error("InstitutionMembers: failed to load", err, { institutionId });
      toast.error("Erro ao carregar membros.");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [search, members]);

  // ── Search professors to add ──
  useEffect(() => {
    if (!showAddModal || !institutionId) return;
    const timer = setTimeout(async () => {
      if (addSearch.length < 2) { setAddResults([]); return; }
      setAddLoading(true);
      try {
        const res = await fetchWithAuth(`/api/institutions/${institutionId}/search-professors?q=${encodeURIComponent(addSearch)}`);
        if (!res.ok) throw new Error("Falha");
        const data = await res.json();
        setAddResults(data.professors || []);
      } catch {
        toast.error("Erro ao pesquisar professores.");
      } finally {
        setAddLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [addSearch, institutionId, showAddModal]);

  // ── Add member ──
  const handleAdd = async (prof: SearchResult) => {
    if (!institutionId || addingUid) return;
    setAddingUid(prof.uid);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/members/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: prof.uid, role: "teacher" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha");
      toast.success(`${prof.name} adicionado(a)!`);
      setAddResults(prev => prev.filter(p => p.uid !== prof.uid));
      loadMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar.");
    } finally {
      setAddingUid(null);
    }
  };

  // ── Remove member ──
  const handleRemove = async (member: Member) => {
    if (!institutionId) return;
    if (!confirm(`Remover ${member.name} da instituição?`)) return;
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/members/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id, source: member.source }),
      });
      if (!res.ok) throw new Error("Falha");
      toast.success(`${member.name} removido(a).`);
      loadMembers();
    } catch {
      toast.error("Erro ao remover membro.");
    }
  };

  const generateLink = async (role: "student" | "teacher") => {
    if (!institutionId || generatingRole) return;
    setGeneratingRole(role);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/invite-link`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Falha ao gerar link");
      const data = await res.json();
      if (role === "student") setStudentLink(data.link);
      else setTeacherLink(data.link);
    } catch (err) {
      logger.error("InstitutionMembers: generate link failed", err, { role });
      toast.error("Erro ao gerar link de convite.");
    } finally {
      setGeneratingRole(null);
    }
  };

  const copyLink = (link: string, role: "student" | "teacher") => {
    navigator.clipboard.writeText(link);
    setCopiedRole(role);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedRole(null), 2000);
  };

  const teacherCount = members.filter(m => m.role === "teacher").length;
  const studentCount = members.filter(m => ["student", "aluno"].includes(m.role)).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-8 w-48 bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map(i => <div key={i} className="h-32 bg-gray-800 animate-pulse" />)}
        </div>
        <div className="h-80 bg-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-2">// membros</p>
          <h1 className="text-2xl font-bold text-gray-100">Membros</h1>
          <p className="mt-1 text-sm text-gray-600">
            {members.length} membro{members.length !== 1 ? "s" : ""} ·{" "}
            <span className="text-green">{teacherCount} professor{teacherCount !== 1 ? "es" : ""}</span> ·{" "}
            <span className="text-blue-400">{studentCount} aluno{studentCount !== 1 ? "s" : ""}</span>
          </p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setAddSearch(""); setAddResults([]); }}
          className="flex items-center gap-2 border border-green bg-green/8 px-4 py-2.5 font-mono text-[13px] uppercase tracking-widest text-green hover:bg-green/15 transition-all"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Adicionar Professor
        </button>
      </div>

      {/* ── Invite Links ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Students */}
        <div className="border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center border border-blue-500 bg-blue-500/8">
              <UserPlus className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">Link para Alunos</p>
              <p className="font-mono text-[13px] text-gray-700">Partilha com alunos para se registarem · 30 dias</p>
            </div>
          </div>
          {!studentLink ? (
            <button
              onClick={() => generateLink("student")}
              disabled={!!generatingRole}
              className="flex items-center gap-1.5 border border-blue-500 bg-blue-500/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-blue-400 hover:bg-blue-500/15 disabled:opacity-40 transition-all"
            >
              {generatingRole === "student" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
              {generatingRole === "student" ? "A gerar..." : "Gerar link"}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" value={studentLink} readOnly className={`${inputCls} flex-1 font-mono text-sm`} />
                <button onClick={() => copyLink(studentLink, "student")} className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all">
                  {copiedRole === "student" ? <CheckCheck className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
                </button>
                <button onClick={() => setStudentLink("")} className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-gray-700 hover:text-gray-400 transition-all" title="Limpar">
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
              <button onClick={() => generateLink("student")} disabled={!!generatingRole} className="font-mono text-[13px] text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-40">
                Gerar novo link →
              </button>
            </div>
          )}
        </div>

        {/* Teachers */}
        <div className="border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center border border-green bg-green/8">
              <GraduationCap className="h-4 w-4 text-green" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">Link para Professores</p>
              <p className="font-mono text-[13px] text-gray-700">Partilha com professores para se associarem · 30 dias</p>
            </div>
          </div>
          {!teacherLink ? (
            <button
              onClick={() => generateLink("teacher")}
              disabled={!!generatingRole}
              className="flex items-center gap-1.5 border border-green bg-green/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-green hover:bg-green/15 disabled:opacity-40 transition-all"
            >
              {generatingRole === "teacher" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
              {generatingRole === "teacher" ? "A gerar..." : "Gerar link"}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" value={teacherLink} readOnly className={`${inputCls} flex-1 font-mono text-sm`} />
                <button onClick={() => copyLink(teacherLink, "teacher")} className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all">
                  {copiedRole === "teacher" ? <CheckCheck className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
                </button>
                <button onClick={() => setTeacherLink("")} className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-gray-700 hover:text-gray-400 transition-all" title="Limpar">
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
              <button onClick={() => generateLink("teacher")} disabled={!!generatingRole} className="font-mono text-[13px] text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-40">
                Gerar novo link →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Members List ── */}
      <div className="border border-gray-800">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-gray-800 bg-gray-900">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar membro..."
              className="w-full border border-gray-800 bg-gray-900 pl-9 pr-3 py-2 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors"
            />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="hidden lg:grid grid-cols-[2fr_2fr_1fr_1fr_60px] gap-4 px-5 py-3 border-b border-gray-800 bg-gray-900">
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Membro</p>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Email</p>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Cargo</p>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Desde</p>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700"></p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center border border-gray-800 bg-gray-900">
              <Users className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
            </div>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
              {search ? "// sem resultados" : "// sem membros"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {search ? "Tenta outro termo." : "Adiciona professores ou convida alunos para começar."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map(member => (
              <div key={member.id} className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1fr_1fr_60px] gap-3 items-center px-5 py-3.5 hover:bg-gray-900 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-sm font-semibold text-gray-500">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">{member.name}</p>
                    <p className="font-mono text-[13px] text-gray-700 truncate lg:hidden">{member.email}</p>
                  </div>
                </div>

                <p className="hidden lg:block font-mono text-sm text-gray-500 truncate">{member.email}</p>

                <div className="flex items-center gap-2">
                  <RoleBadge role={member.role} />
                </div>

                <p className="hidden lg:flex items-center gap-1 font-mono text-sm text-gray-700">
                  <Calendar className="h-3 w-3" strokeWidth={1.5} />
                  {member.addedAt ? member.addedAt.toLocaleDateString("pt-PT") : "—"}
                </p>

                <button
                  onClick={() => handleRemove(member)}
                  className="flex h-7 w-7 items-center justify-center text-gray-700 hover:text-red-400 transition-colors"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-800 bg-gray-900">
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
            {members.length} membro{members.length !== 1 ? "s" : ""} no total
          </p>
        </div>
      </div>

      {/* ── Add Professor Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-100">Adicionar Professor</h2>
                <p className="text-sm text-gray-600">Pesquisa por nome ou email</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-700 hover:text-gray-400 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-4 border-b border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-700" strokeWidth={1.5} />
                <input
                  type="text" autoFocus value={addSearch}
                  onChange={e => setAddSearch(e.target.value)}
                  placeholder="Nome ou email do professor..."
                  className="w-full border border-gray-800 bg-gray-950 pl-10 pr-4 py-3 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {addLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-purple" />
                </div>
              )}

              {!addLoading && addSearch.length >= 2 && addResults.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-600">Nenhum professor encontrado.</p>
                  <p className="text-xs text-gray-700 mt-1">O professor precisa ter uma conta criada na plataforma.</p>
                </div>
              )}

              {!addLoading && addResults.length > 0 && (
                <div className="divide-y divide-gray-800">
                  {addResults.map(prof => (
                    <div key={prof.uid} className="flex items-center justify-between px-5 py-3 hover:bg-gray-900/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gray-800 bg-gray-950 text-sm font-semibold text-gray-500">
                          {prof.photoURL ? (
                            <img src={prof.photoURL} alt="" className="h-full w-full object-cover" />
                          ) : (
                            prof.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{prof.name}</p>
                          <p className="font-mono text-xs text-gray-600 truncate">{prof.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdd(prof)}
                        disabled={addingUid === prof.uid}
                        className="flex items-center gap-1.5 border border-green bg-green/8 px-3 py-1.5 font-mono text-[13px] uppercase tracking-widest text-green hover:bg-green/15 disabled:opacity-40 transition-all shrink-0 ml-3"
                      >
                        {addingUid === prof.uid ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" strokeWidth={2} />
                        )}
                        {addingUid === prof.uid ? "A adicionar..." : "Adicionar"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!addLoading && addSearch.length < 2 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-700">Escreve pelo menos 2 caracteres para pesquisar.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
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
