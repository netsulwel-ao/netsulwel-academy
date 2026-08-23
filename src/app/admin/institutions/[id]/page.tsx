"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, ArrowLeft, Search, Loader2,
  Mail, UserPlus, GraduationCap, Users,
  Check, X, AlertTriangle, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { logger } from "@/lib/logger";
import type { Institution } from "@/types/institution";

// ── Types ─────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  email: string;
  institutionRole: string;
  createdAt: Date;
}

// ── Role badge ────────────────────────────────────────────────
const ROLE_MAP: Record<string, { cls: string; label: string }> = {
  admin:   { cls: "border-purple/25 text-purple/70",          label: "Admin"     },
  teacher: { cls: "border-green/25 text-green/70",            label: "Professor" },
  student: { cls: "border-blue-500/25 text-blue-400/70",      label: "Aluno"     },
  aluno:   { cls: "border-blue-500/25 text-blue-400/70",      label: "Aluno"     },
};

function RoleBadge({ role }: { role: string }) {
  const { cls, label } = ROLE_MAP[role] ?? ROLE_MAP.aluno;
  return (
    <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${cls}`}>
      {label}
    </span>
  );
}

const inputCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple/30 focus:outline-none transition-colors";

// ── Page ──────────────────────────────────────────────────────
export default function InstitutionDetailPage() {
  const { isAdmin }       = useAuth();
  const { id }            = useParams<{ id: string }>();
  const router            = useRouter();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [members,     setMembers]     = useState<Member[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState<"teacher" | "student">("teacher");
  const [inviting,    setInviting]    = useState(false);

  // ── Load ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [instSnap, membersSnap] = await Promise.all([
        getDoc(doc(db, "institutions", id)),
        getDocs(query(collection(db, "users"), where("institutionId", "==", id))),
      ]);

      if (!instSnap.exists()) {
        router.push("/admin/institutions");
        return;
      }
      setInstitution({ id: instSnap.id, ...instSnap.data() } as Institution);

      const list: Member[] = membersSnap.docs.map(d => {
        const data = d.data();
        return {
          id:              d.id,
          name:            data.name       || "Sem nome",
          email:           data.email      || "",
          institutionRole: data.institutionRole || "aluno",
          createdAt:       (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
        };
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setMembers(list);
    } catch (err) {
      logger.error("InstitutionDetail: failed to load", err, { id });
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  // ── Filter ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [members, search]);

  // ── Invite ────────────────────────────────────────────────
  const handleInvite = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) { toast.error("Email é obrigatório."); return; }
    setInviting(true);
    try {
      const res = await fetchWithAuth(`/api/institutions/${id}/invite`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, invitedBy: "admin", inviterName: "Administrador" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao enviar convite.");
      }
      toast.success(`Convite enviado para ${inviteEmail}.`);
      setInviteEmail("");
    } catch (err) {
      logger.error("InstitutionDetail: invite failed", err, { id, email: inviteEmail });
      toast.error(err instanceof Error ? err.message : "Erro ao enviar convite.");
    } finally {
      setInviting(false);
    }
  }, [id, inviteEmail, inviteRole]);

  if (!isAdmin) return null;

  // ── Counts ────────────────────────────────────────────────
  const teacherCount = members.filter(m => m.institutionRole === "teacher").length;
  const studentCount = members.filter(m => ["student", "aluno"].includes(m.institutionRole)).length;

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/institutions")}
          className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-700">// membros da instituição</p>
          {loading
            ? <div className="h-6 w-48 bg-gray-800 animate-pulse mt-0.5" />
            : <h1 className="text-xl font-bold text-gray-100">{institution?.name}</h1>
          }
        </div>
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

      {!loading && (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-3 gap-px bg-gray-800">
            {[
              { label: "Total",      value: members.length,  icon: Users },
              { label: "Professores",value: teacherCount,    icon: GraduationCap },
              { label: "Alunos",     value: studentCount,    icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="border border-gray-800 bg-gray-900 px-4 py-3">
                <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1 flex items-center gap-1.5">
                  <Icon className="h-3 w-3" strokeWidth={1.5} /> {label}
                </p>
                <p className="text-xl font-bold text-gray-200 tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          {/* ── Convidar ── */}
          <div className="border border-gray-800 bg-gray-900 p-5">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-4 flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
              // convidar membro
            </p>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
                <input
                  type="email" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="Email do convidado"
                  className={`${inputCls} pl-9`}
                />
              </div>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
                className="border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple/30 focus:outline-none sm:w-40 transition-colors"
              >
                <option value="teacher">Professor</option>
                <option value="student">Aluno</option>
              </select>
              <button
                type="submit" disabled={inviting}
                className="flex items-center justify-center gap-1.5 bg-purple px-5 py-2.5 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-purple-600 disabled:opacity-40 transition-all whitespace-nowrap"
              >
                {inviting
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> A enviar...</>
                  : <><Check className="h-3 w-3" strokeWidth={1.5} /> Convidar</>
                }
              </button>
            </form>
          </div>

          {/* ── Lista de membros ── */}
          <div className="border border-gray-800">
            {/* Pesquisa */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-800 bg-gray-900">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
                <input
                  type="text" value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar membro..."
                  className="w-full border border-gray-800 bg-gray-900 pl-9 pr-3 py-2 text-sm text-gray-200 focus:border-purple/30 focus:outline-none transition-colors"
                />
              </div>
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 ml-auto">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Header */}
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
                  {search ? "Tenta outro termo." : "Ainda não há membros nesta instituição."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filtered.map(member => (
                  <div
                    key={member.id}
                    className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1fr_1fr] gap-3 items-center px-5 py-3.5 hover:bg-gray-900 transition-colors"
                  >
                    {/* Nome */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 font-semibold text-sm text-gray-500">
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
                      {/* Mobile badge inline com email */}
                    </div>

                    {/* Data */}
                    <p className="hidden lg:block font-mono text-sm text-gray-700">
                      {member.createdAt.toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-800 bg-gray-900">
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
                {members.length} membro{members.length !== 1 ? "s" : ""} no total
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
