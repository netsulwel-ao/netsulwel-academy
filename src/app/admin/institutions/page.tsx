"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Search, ArrowUpDown, Loader2, Check, X, Mail, Calendar, Users, Plus, Eye } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface Institution {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: "pending" | "approved" | "suspended";
  adminId: string;
  createdAt: Date;
}

export default function AdminInstitutionsPage() {
  const { isAdmin } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filtered, setFiltered] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent">("recent");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "suspended">("all");
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const q = query(collection(db, "institutions"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list: Institution[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Sem nome",
            email: data.email || "",
            phone: data.phone,
            address: data.address,
            status: data.status || "pending",
            adminId: data.adminId || "",
            createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string),
          };
        });
        setInstitutions(list);
        setFiltered(list);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar instituições.");
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutions();
  }, []);

  useEffect(() => {
    let result = [...institutions];
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q));
    }
    
    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }
    
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    setFiltered(result);
  }, [search, sortBy, statusFilter, institutions]);

  const handleApprove = async (institution: Institution) => {
    try {
      const res = await fetchWithAuth(`/api/institutions/${institution.id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to approve");
      
      setInstitutions((prev) => prev.map((i) => i.id === institution.id ? { ...i, status: "approved" } : i));
      setSelectedInstitution(null);
      toast.success(`${institution.name} aprovada com sucesso.`);
    } catch {
      toast.error("Erro ao aprovar instituição.");
    }
  };

  const handleSuspend = async (institution: Institution) => {
    try {
      const res = await fetchWithAuth(`/api/institutions/${institution.id}/suspend`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to suspend");
      
      setInstitutions((prev) => prev.map((i) => i.id === institution.id ? { ...i, status: "suspended" } : i));
      setSelectedInstitution(null);
      toast.success(`${institution.name} suspensa com sucesso.`);
    } catch {
      toast.error("Erro ao suspender instituição.");
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-400",
      approved: "bg-green-500/10 text-green-400",
      suspended: "bg-red-500/10 text-red-400",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovada",
      suspended: "Suspensa",
    };
    return { color: colors[status] || colors.pending, label: labels[status] || labels.pending };
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400">Apenas administradores podem gerir instituições.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Instituições</h1>
          <p className="mt-2 text-gray-400">Gerir instituições educativas registadas na plataforma.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Building2 className="h-5 w-5 text-purple-400" />
          <span className="font-bold text-white">{institutions.length}</span> instituições
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text" placeholder="Pesquisar instituição..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-gray-900 border border-gray-800 py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-purple"
        >
          <option value="all">Todos os estados</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovadas</option>
          <option value="suspended">Suspensas</option>
        </select>
        <button
          onClick={() => setSortBy(sortBy === "recent" ? "name" : "recent")}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortBy === "recent" ? "Nome" : "Recentes"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={search ? "Nenhuma instituição encontrada" : "Ainda não há instituições"}
            description={search ? "Tenta pesquisar por outro termo." : "As instituições aparecerão aqui depois de se registarem."}
            compact
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 font-medium">Instituição</th>
                  <th className="py-4 px-6 font-medium">Email</th>
                  <th className="py-4 px-6 font-medium">Estado</th>
                  <th className="py-4 px-6 font-medium">Registada</th>
                  <th className="py-4 px-6 font-medium">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((institution) => (
                  <tr
                    key={institution.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedInstitution(institution)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                          {institution.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{institution.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{institution.id.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">{institution.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-xs font-medium ${statusBadge(institution.status).color}`}>
                        {statusBadge(institution.status).label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">
                      {institution.createdAt.toLocaleDateString("pt-PT")}
                    </td>
                    <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedInstitution(institution)}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          <Eye className="h-3 w-3 inline mr-1" />Detalhes
                        </button>
                        {institution.status === "pending" && (
                          <button
                            onClick={() => handleApprove(institution)}
                            className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                          >
                            <Check className="h-3 w-3 inline mr-1" />Aprovar
                          </button>
                        )}
                        {institution.status === "approved" && (
                          <button
                            onClick={() => handleSuspend(institution)}
                            className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <X className="h-3 w-3 inline mr-1" />Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedInstitution && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedInstitution(null)} />
          <div className="relative w-96 bg-gray-900 border-l border-gray-800 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white">Detalhes da Instituição</h3>
              <button onClick={() => setSelectedInstitution(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="h-20 w-20 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-2xl mb-4">
                {selectedInstitution.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-xl font-bold text-white">{selectedInstitution.name}</h4>
              <span className={`mt-2 px-3 py-1 text-xs font-medium ${statusBadge(selectedInstitution.status).color}`}>
                {statusBadge(selectedInstitution.status).label}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-300">{selectedInstitution.email}</span>
              </div>
              {selectedInstitution.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-gray-300">{selectedInstitution.phone}</span>
                </div>
              )}
              {selectedInstitution.address && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-gray-300">{selectedInstitution.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-300">Registada a {selectedInstitution.createdAt.toLocaleDateString("pt-PT")}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800 space-y-3">
              {selectedInstitution.status === "pending" && (
                <button
                  onClick={() => handleApprove(selectedInstitution)}
                  className="w-full py-3 text-sm font-bold bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <Check className="h-4 w-4 inline mr-2" />Aprovar Instituição
                </button>
              )}
              {selectedInstitution.status === "approved" && (
                <button
                  onClick={() => handleSuspend(selectedInstitution)}
                  className="w-full py-3 text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <X className="h-4 w-4 inline mr-2" />Suspender Instituição
                </button>
              )}
              <Link
                href={`/admin/institutions/${selectedInstitution.id}`}
                className="block w-full py-3 text-sm font-bold bg-gray-700 hover:bg-gray-600 text-white text-center transition-colors"
              >
                <Users className="h-4 w-4 inline mr-2" />Gerir Membros
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
