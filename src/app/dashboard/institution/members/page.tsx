"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Users, Search, Loader2, Link2, Copy, CheckCheck, Calendar, GraduationCap, UserPlus } from "lucide-react";
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
  const [linkRole, setLinkRole] = useState<"student" | "teacher">("student");
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

  const generateLink = async (role: "student" | "teacher") => {
    if (!institutionId) return;
    setGeneratingLink(true);
    setLinkRole(role);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/invite-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
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
      admin: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Admin" },
      teacher: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Professor" },
      student: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Aluno" },
    };
    return map[role] || map.student;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-3xl rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Membros</h1>
              <p className="text-sm sm:text-base text-gray-400">Gere os membros da tua instituição</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Invite Link for Students */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Link para Alunos</h3>
                <p className="text-xs sm:text-sm text-gray-400">Partilha com os alunos para se registarem</p>
              </div>
            </div>
            {!inviteLink || linkRole !== "student" ? (
              <button onClick={() => generateLink("student")} disabled={generatingLink}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20">
                {generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Gerar Link
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" value={inviteLink} readOnly
                    className="flex-1 bg-gray-800/80 border border-gray-700/50 py-2.5 px-4 text-sm text-white rounded-lg focus:outline-none" />
                  <button onClick={copyLink}
                    className="w-full sm:w-auto bg-gray-700/80 hover:bg-gray-600 text-white p-2.5 rounded-lg transition-all flex items-center justify-center">
                    {copied ? <CheckCheck className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <button onClick={() => generateLink("student")} disabled={generatingLink}
                  className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                  Gerar novo link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Invite Link for Teachers */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Link para Professores</h3>
                <p className="text-xs sm:text-sm text-gray-400">Partilha com professores para se associarem</p>
              </div>
            </div>
            {!inviteLink || linkRole !== "teacher" ? (
              <button onClick={() => generateLink("teacher")} disabled={generatingLink}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20">
                {generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Gerar Link
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" value={inviteLink} readOnly
                    className="flex-1 bg-gray-800/80 border border-gray-700/50 py-2.5 px-4 text-sm text-white rounded-lg focus:outline-none" />
                  <button onClick={copyLink}
                    className="w-full sm:w-auto bg-gray-700/80 hover:bg-gray-600 text-white p-2.5 rounded-lg transition-all flex items-center justify-center">
                    {copied ? <CheckCheck className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <button onClick={() => generateLink("teacher")} disabled={generatingLink}
                  className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                  Gerar novo link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 overflow-hidden hover:border-purple/20 transition-colors">
        <div className="p-4 border-b border-gray-800/70 flex flex-wrap items-center justify-between gap-4">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input type="text" placeholder="Pesquisar membro..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700/50 py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 rounded-lg focus:outline-none focus:border-purple/50 transition-all" />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
            <span className="text-gray-500">{members.length} membro{members.length !== 1 ? "s" : ""}</span>
            <span className="text-gray-600">•</span>
            <span className="text-purple-400">{members.filter(m => m.institutionRole === "teacher").length} professores</span>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <span className="text-blue-400">{members.filter(m => m.institutionRole === "student" || m.institutionRole === "aluno").length} alunos</span>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg font-medium">{search ? "Nenhum membro encontrado" : "Ainda não há membros"}</p>
            <p className="text-gray-500 text-sm mt-1">
              {search ? "Tenta outro termo de pesquisa." : "Convida professores ou alunos para começar."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Membros da instituição</caption>
              <thead>
                <tr className="border-b border-gray-800/70 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th scope="col" className="py-3 px-4 sm:py-4 sm:px-6 font-medium">Membro</th>
                  <th scope="col" className="py-3 px-4 sm:py-4 sm:px-6 font-medium hidden sm:table-cell">Email</th>
                  <th scope="col" className="py-3 px-4 sm:py-4 sm:px-6 font-medium">Cargo</th>
                  <th scope="col" className="py-3 px-4 sm:py-4 sm:px-6 font-medium hidden md:table-cell">Membro desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map(member => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 sm:py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center text-purple-400 font-bold text-xs sm:text-sm border border-purple-500/10 shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white truncate max-w-[100px] sm:max-w-none">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:py-4 sm:px-6 text-sm text-gray-400 hidden sm:table-cell">{member.email}</td>
                    <td className="py-3 px-4 sm:py-4 sm:px-6">
                      <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-medium rounded-full border ${roleBadge(member.institutionRole).color}`}>
                        {roleBadge(member.institutionRole).label}
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:py-4 sm:px-6 text-sm text-gray-500 items-center gap-1.5 hidden md:table-cell">
                      <Calendar className="h-3.5 w-3.5 inline" />
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
