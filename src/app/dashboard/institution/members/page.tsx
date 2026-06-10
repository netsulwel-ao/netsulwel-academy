"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Users, Search, Loader2, Mail, UserPlus, Check, Link2, Copy, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface Member {
  id: string;
  name: string;
  email: string;
  institutionRole: string;
  createdAt: Date;
}

export default function InstitutionMembersPage() {
  const { user, institutionId } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    loadMembers();
  }, [institutionId]);

  useEffect(() => {
    let result = [...members];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [search, members]);

  const loadMembers = async () => {
    try {
      const q = query(collection(db, "users"), where("institutionId", "==", institutionId));
      const snap = await getDocs(q);
      const list: Member[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id, name: data.name || "Sem nome", email: data.email || "",
          institutionRole: data.institutionRole || "aluno",
          createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
        };
      });
      setMembers(list);
      setFiltered(list);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar membros.");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !institutionId) {
      toast.error("Email é obrigatório.");
      return;
    }
    setInviting(true);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/invite`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: "teacher", invitedBy: user!.uid, inviterName: user!.displayName || "Administrador" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao enviar convite");
      }
      toast.success("Convite enviado para o professor!");
      setInviteEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar convite.");
    } finally {
      setInviting(false);
    }
  };

  const generateLink = async () => {
    if (!institutionId) return;
    setGeneratingLink(true);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/invite-link`, { method: "POST" });
      if (!res.ok) throw new Error("Falha ao gerar link");
      const data = await res.json();
      setInviteLink(data.link);
    } catch {
      toast.error("Erro ao gerar link de convite.");
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const roleBadge = (role: string) => {
    const map: Record<string, { color: string; label: string }> = {
      admin: { color: "bg-purple-500/10 text-purple-400", label: "Admin" },
      teacher: { color: "bg-emerald-500/10 text-emerald-400", label: "Professor" },
      aluno: { color: "bg-blue-500/10 text-blue-400", label: "Aluno" },
      student: { color: "bg-blue-500/10 text-blue-400", label: "Aluno" },
    };
    return map[role] || map.aluno;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Membros</h1>
        <p className="mt-2 text-gray-400">Gere os membros da tua instituição.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invite Teacher by Email */}
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-400" />
            Convidar Professor
          </h3>
          <p className="text-sm text-gray-400 mb-4">Envia um convite por email para um professor se juntar à instituição.</p>
          <form onSubmit={handleInviteTeacher} className="flex gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email do professor" required
                className="w-full bg-gray-800 border border-gray-700 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 rounded-lg" />
            </div>
            <button type="submit" disabled={inviting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Convidar
            </button>
          </form>
        </div>

        {/* Generate Invite Link for Students */}
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-400" />
            Link de Convite para Alunos
          </h3>
          <p className="text-sm text-gray-400 mb-4">Gera um link para partilhares com os alunos. Ao clicarem, farão login e entrarão automaticamente na instituição.</p>
          
          {!inviteLink ? (
            <button onClick={generateLink} disabled={generatingLink}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
              {generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Gerar Link
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="text" value={inviteLink} readOnly
                  className="flex-1 bg-gray-800 border border-gray-700 py-2.5 px-4 text-sm text-white rounded-lg" />
                <button onClick={copyLink}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2.5 rounded-lg transition-colors">
                  {copied ? <CheckCheck className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              <button onClick={generateLink} disabled={generatingLink}
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                Gerar novo link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-gray-900/40 border border-gray-800">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input type="text" placeholder="Pesquisar membro..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple rounded-lg" />
          </div>
          <span className="text-sm text-gray-500">{members.length} membro{members.length !== 1 ? "s" : ""}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{search ? "Nenhum membro encontrado" : "Ainda não há membros"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 font-medium">Membro</th>
                  <th className="py-4 px-6 font-medium">Email</th>
                  <th className="py-4 px-6 font-medium">Cargo</th>
                  <th className="py-4 px-6 font-medium">Membro desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(member => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">{member.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-xs font-medium ${roleBadge(member.institutionRole).color}`}>
                        {roleBadge(member.institutionRole).label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">
                      {member.createdAt.toLocaleDateString("pt-PT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}