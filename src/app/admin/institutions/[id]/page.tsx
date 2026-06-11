"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, ArrowLeft, Search, Loader2, Mail, UserPlus, GraduationCap, Users, Check, X } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface InstitutionMember {
  id: string;
  name: string;
  email: string;
  institutionRole: string;
  createdAt: Date;
}

interface Institution {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default function InstitutionDetailPage() {
  const { isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const institutionId = params.id as string;
  
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [members, setMembers] = useState<InstitutionMember[]>([]);
  const [filtered, setFiltered] = useState<InstitutionMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"teacher" | "student">("teacher");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch institution
        const institutionDoc = await getDoc(doc(db, "institutions", institutionId));
        if (!institutionDoc.exists()) {
          toast.error("Instituição não encontrada");
          router.push("/admin/institutions");
          return;
        }
        setInstitution({ id: institutionDoc.id, ...institutionDoc.data() } as Institution);

        // Fetch members
        const membersQuery = query(collection(db, "users"), where("institutionId", "==", institutionId));
        const membersSnap = await getDocs(membersQuery);
        const membersList: InstitutionMember[] = membersSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Sem nome",
            email: data.email || "",
            institutionRole: data.institutionRole || "aluno",
            createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string),
          };
        });
        setMembers(membersList);
        setFiltered(membersList);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [institutionId, router]);

  useEffect(() => {
    let result = [...members];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [search, members]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteRole) {
      toast.error("Email e cargo são obrigatórios.");
      return;
    }

    setInviting(true);

    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          invitedBy: isAdmin ? "admin" : "teacher",
          inviterName: "Administrador",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invitation");
      }

      toast.success("Convite enviado com sucesso!");
      setInviteEmail("");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao enviar convite.");
    } finally {
      setInviting(false);
    }
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/10 text-purple-400",
      teacher: "bg-emerald-500/10 text-emerald-400",
      aluno: "bg-blue-500/10 text-blue-400",
    };
    const labels: Record<string, string> = {
      admin: "Administrador",
      teacher: "Professor",
      aluno: "Aluno",
    };
    return { color: colors[role] || colors.aluno, label: labels[role] || labels.aluno };
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400">Apenas administradores podem gerir instituições.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/institutions")}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">{institution?.name}</h1>
            <p className="mt-2 text-gray-400">Gerir membros da instituição.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="h-5 w-5 text-purple-400" />
          <span className="font-bold text-white">{members.length}</span> membros
        </div>
      </div>

      {/* Invite Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Convidar Novo Membro
        </h3>
        <form onSubmit={handleInvite} className="flex gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email do convidado"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "teacher" | "student")}
            className="bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-purple"
          >
            <option value="teacher">Professor</option>
            <option value="student">Aluno</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="bg-purple hover:bg-purple-light text-white font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {inviting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                A enviar...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Convidar
              </>
            )}
          </button>
        </form>
      </div>

      {/* Members List */}
      <div className="bg-gray-900 border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Pesquisar membro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple rounded-lg"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {search ? "Nenhum membro encontrado" : "Ainda não há membros nesta instituição"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 font-medium">Membro</th>
                  <th className="py-4 px-6 font-medium">Email</th>
                  <th className="py-4 px-6 font-medium">Cargo</th>
                  <th className="py-4 px-6 font-medium">Juntou-se</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{member.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{member.id.slice(0, 12)}...</p>
                        </div>
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
