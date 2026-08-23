"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import {
  Users, Search, Loader2, Link2, Copy, CheckCheck,
  Calendar, GraduationCap, UserPlus, X,
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { logger } from "@/lib/logger";

interface Member {
  id: string; name: string; email: string;
  institutionRole: string; createdAt: Date;
}

// ── Role badge ────────────────────────────────────────────────
const ROLE_MAP: Record<string, { cls: string; label: string }> = {
  admin:   { cls: "border-purple/25 text-purple/70",       label: "Admin"     },
  teacher: { cls: "border-green/25 text-green/70",         label: "Professor" },
  student: { cls: "border-blue-500/25 text-blue-400/70",   label: "Aluno"     },
  aluno:   { cls: "border-blue-500/25 text-blue-400/70",   label: "Aluno"     },
};
function RoleBadge({ role }: { role: string }) {
  const { cls, label } = ROLE_MAP[role] ?? ROLE_MAP.aluno;
  return <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${cls}`}>{label}</span>;
}

const inputCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple/30 focus:outline-none transition-colors";

export default function InstitutionMembersPage() {
  const { institutionId } = useAuth();
  const [members,     setMembers]     = useState<Member[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");

  // Separate link state for each role to avoid confusion
  const [studentLink,      setStudentLink]      = useState("");
  const [teacherLink,      setTeacherLink]      = useState("");
  const [generatingRole,   setGeneratingRole]   = useState<"student" | "teacher" | null>(null);
  const [copiedRole,       setCopiedRole]       = useState<"student" | "teacher" | null>(null);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("institutionId", "==", institutionId))
        );
        if (cancelled) return;
        const list: Member[] = snap.docs
          .map(d => {
            const data = d.data();
            return {
              id: d.id, name: data.name || "Sem nome", email: data.email || "",
              institutionRole: data.institutionRole || "aluno",
              createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
            };
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setMembers(list);
      } catch (err) {
        logger.error("InstitutionMembers: failed to load", err, { institutionId });
        toast.error("Erro ao carregar membros.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [institutionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [search, members]);

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

  const teacherCount = members.filter(m => m.institutionRole === "teacher").length;
  const studentCount = members.filter(m => ["student","aluno"].includes(m.institutionRole)).length;

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

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">// membros</p>
        <h1 className="text-2xl font-bold text-gray-100">Membros</h1>
        <p className="mt-1 text-sm text-gray-600">
          {members.length} membro{members.length !== 1 ? "s" : ""} ·{" "}
          <span className="text-green/60">{teacherCount} professor{teacherCount !== 1 ? "es" : ""}</span> ·{" "}
          <span className="text-blue-400/60">{studentCount} aluno{studentCount !== 1 ? "s" : ""}</span>
        </p>
      </div>

      {/* ── Links de convite ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Alunos */}
        <div className="border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center border border-blue-500/25 bg-blue-500/8">
              <UserPlus className="h-4 w-4 text-blue-400/70" strokeWidth={1.5} />
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
              className="flex items-center gap-1.5 border border-blue-500/25 bg-blue-500/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-blue-400/80 hover:bg-blue-500/15 disabled:opacity-40 transition-all"
            >
              {generatingRole === "student" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
              {generatingRole === "student" ? "A gerar..." : "Gerar link"}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" value={studentLink} readOnly className={`${inputCls} flex-1 font-mono text-sm`} />
                <button onClick={() => copyLink(studentLink, "student")} className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all">
                  {copiedRole === "student" ? <CheckCheck className="h-3.5 w-3.5 text-green/60" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
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

        {/* Professores */}
        <div className="border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center border border-green/25 bg-green/8">
              <GraduationCap className="h-4 w-4 text-green/70" strokeWidth={1.5} />
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
              className="flex items-center gap-1.5 border border-green/25 bg-green/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-green/80 hover:bg-green/15 disabled:opacity-40 transition-all"
            >
              {generatingRole === "teacher" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
              {generatingRole === "teacher" ? "A gerar..." : "Gerar link"}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" value={teacherLink} readOnly className={`${inputCls} flex-1 font-mono text-sm`} />
                <button onClick={() => copyLink(teacherLink, "teacher")} className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all">
                  {copiedRole === "teacher" ? <CheckCheck className="h-3.5 w-3.5 text-green/60" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
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

      {/* ── Lista ── */}
      <div className="border border-gray-800">
        {/* Pesquisa */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-gray-800 bg-gray-900">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar membro..."
              className="w-full border border-gray-800 bg-gray-900 pl-9 pr-3 py-2 text-sm text-gray-200 focus:border-purple/30 focus:outline-none transition-colors"
            />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Cabeçalho */}
        <div className="hidden lg:grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-5 py-3 border-b border-gray-800 bg-gray-900">
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Membro</p>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Email</p>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Cargo</p>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Desde</p>
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
              {search ? "Tenta outro termo." : "Convida professores ou alunos para começar."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map(member => (
              <div key={member.id} className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1fr_1fr] gap-3 items-center px-5 py-3.5 hover:bg-gray-900 transition-colors">
                {/* Nome */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-sm font-semibold text-gray-500">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">{member.name}</p>
                    <p className="font-mono text-[13px] text-gray-700 truncate lg:hidden">{member.email}</p>
                  </div>
                </div>

                {/* Email */}
                <p className="hidden lg:block font-mono text-sm text-gray-500 truncate">{member.email}</p>

                {/* Cargo */}
                <div className="flex items-center gap-2">
                  <RoleBadge role={member.institutionRole} />
                </div>

                {/* Data */}
                <p className="hidden lg:flex items-center gap-1 font-mono text-sm text-gray-700">
                  <Calendar className="h-3 w-3" strokeWidth={1.5} />
                  {member.createdAt.toLocaleDateString("pt-PT")}
                </p>
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
    </div>
  );
}
