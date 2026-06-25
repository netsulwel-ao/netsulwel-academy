"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Users, GraduationCap, Search, ArrowUpDown, Loader2, Shield, ShieldOff, Mail, Calendar, BookOpen, UserCheck, X, UserPlus, Check, Clock, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { toast } from "sonner";

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  specialty?: string;
  bio?: string;
  createdAt: Date;
  enrolledCourses?: string[];
  photoURL?: string;
}

export default function AdminTeachersPage() {
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [filtered, setFiltered] = useState<Teacher[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "approved" | "pending">("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent">("recent");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "teacher"));
        const snap = await getDocs(q);
        const list: Teacher[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Sem nome",
            email: data.email || "",
            role: data.role || "teacher",
            status: data.status,
            specialty: data.specialty,
            bio: data.bio,
            createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string),
            enrolledCourses: data.enrolledCourses,
            photoURL: data.photoURL,
          };
        });
        const approved = list.filter(t => t.status !== "pending");
        const pending = list.filter(t => t.status === "pending");
        setTeachers(approved);
        setPendingTeachers(pending);
        setFiltered(approved);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    const source = filterTab === "pending" ? pendingTeachers : filterTab === "approved" ? teachers : [...teachers, ...pendingTeachers];
    let result = [...source];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
    }
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    setFiltered(result);
  }, [search, sortBy, teachers, pendingTeachers, filterTab]);

  const handleApprove = async (teacher: Teacher) => {
    try {
      await updateDoc(doc(db, "users", teacher.id), { status: "approved" });
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setTeachers((prev) => [...prev, { ...teacher, status: "approved" }]);
      setSelectedTeacher(null);
      toast.success(`${teacher.name} aprovado como professor.`);
    } catch {
      toast.error("Erro ao aprovar professor.");
    }
  };

  const handleReject = async (teacher: Teacher) => {
    try {
      await updateDoc(doc(db, "users", teacher.id), { role: "aluno", status: "rejected" });
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setSelectedTeacher(null);
      toast.success(`${teacher.name} foi rejeitado.`);
    } catch {
      toast.error("Erro ao rejeitar professor.");
    }
  };

  const handleRoleChange = async (teacher: Teacher, newRole: "aluno" | "admin") => {
    try {
      await updateDoc(doc(db, "users", teacher.id), { role: newRole });
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setSelectedTeacher(null);
      toast.success(`${teacher.name} agora é ${newRole === "admin" ? "Administrador" : "Aluno"}.`);
    } catch {
      toast.error("Erro ao alterar cargo.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <ShieldOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400">Apenas administradores podem gerir professores.</p>
      </div>
    );
  }

  const totalPending = pendingTeachers.length;

  return (
    <div className="max-w-[100rem] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Professores</h1>
          <p className="mt-2 text-gray-400">Gerir professores da plataforma.</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          {totalPending > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <Clock className="h-4 w-4" />
              <span className="font-bold">{totalPending}</span> pendente(s)
            </div>
          )}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-white">{teachers.length}</span> professores
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text" placeholder="Pesquisar professor..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple"
          />
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 p-1">
          <button onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterTab === "all" ? "bg-purple text-white" : "text-gray-400 hover:text-white"}`}>
            Todos ({teachers.length + pendingTeachers.length})
          </button>
          <button onClick={() => setFilterTab("approved")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterTab === "approved" ? "bg-purple text-white" : "text-gray-400 hover:text-white"}`}>
            Aprovados ({teachers.length})
          </button>
          <button onClick={() => setFilterTab("pending")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterTab === "pending" ? "bg-yellow-500 text-white" : "text-gray-400 hover:text-white"}`}>
            Pendentes ({pendingTeachers.length})
          </button>
        </div>
        <button onClick={() => setSortBy(sortBy === "recent" ? "name" : "recent")}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowUpDown className="h-4 w-4" />
          {sortBy === "recent" ? "Nome" : "Recentes"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={search ? "Nenhum professor encontrado" : filterTab === "pending" ? "Nenhum pendente" : "Ainda não há professores"}
            description={search ? "Tenta pesquisar por outro termo." : filterTab === "pending" ? "Todos os pedidos foram processados." : "Pode promover um aluno a professor na página de alunos."}
            action={!search && filterTab !== "pending" ? { label: "Ver alunos", href: "/admin/students", icon: Users } as const : undefined}
            compact
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 font-medium">Professor</th>
                  <th className="py-4 px-6 font-medium">Email</th>
                  <th className="py-4 px-6 font-medium">Estado</th>
                  <th className="py-4 px-6 font-medium">Especialidade</th>
                  <th className="py-4 px-6 font-medium">Registado</th>
                  <th className="py-4 px-6 font-medium">Cursos</th>
                  <th className="py-4 px-6 font-medium">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((teacher) => {
                  const isPending = teacher.status === "pending";
                  return (
                    <tr key={teacher.id} className={`hover:bg-white/[0.02] transition-colors ${isPending ? "bg-yellow-500/5" : ""}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                            {teacher.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{teacher.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{teacher.id.slice(0, 12)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-400">{teacher.email}</td>
                      <td className="py-4 px-6">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            <Clock className="h-3 w-3" /> Pendente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="h-3 w-3" /> Aprovado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-400">{teacher.specialty || "—"}</td>
                      <td className="py-4 px-6 text-sm text-gray-400">{teacher.createdAt.toLocaleDateString("pt-PT")}</td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-400">{teacher.enrolledCourses?.length || 0}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedTeacher(teacher)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                            Detalhes
                          </button>
                          {isPending && (
                            <>
                              <button onClick={() => handleApprove(teacher)}
                                className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                                <Check className="h-3 w-3 inline mr-1" />Aprovar
                              </button>
                              <button onClick={() => handleReject(teacher)}
                                className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                <X className="h-3 w-3 inline mr-1" />Rejeitar
                              </button>
                            </>
                          )}
                          {isAdmin && !isPending && (
                            <>
                              <button onClick={() => handleRoleChange(teacher, "admin")}
                                className="px-3 py-1.5 text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors">
                                <Shield className="h-3 w-3 inline mr-1" />Admin
                              </button>
                              <button onClick={() => handleRoleChange(teacher, "aluno")}
                                className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                Remover
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedTeacher(null)} />
          <div className="relative w-96 bg-gray-900 border-l border-gray-800 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white">Detalhes</h3>
              <button onClick={() => setSelectedTeacher(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="h-20 w-20 bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-2xl mb-4">
                {selectedTeacher.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-xl font-bold text-white">{selectedTeacher.name}</h4>
              {selectedTeacher.status === "pending" ? (
                <span className="mt-1 px-3 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  <Clock className="h-3 w-3 inline mr-1" />Pendente
                </span>
              ) : (
                <span className="mt-1 px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400">Professor</span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">{selectedTeacher.email}</span>
              </div>
              {selectedTeacher.specialty && (
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-300">{selectedTeacher.specialty}</span>
                </div>
              )}
              {selectedTeacher.bio && (
                <div className="flex items-start gap-3 text-sm">
                  <BookOpen className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="text-gray-300">{selectedTeacher.bio}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">Registado a {selectedTeacher.createdAt.toLocaleDateString("pt-PT")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserCheck className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">ID: {selectedTeacher.id}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800 space-y-3">
              {selectedTeacher.status === "pending" ? (
                <>
                  <button onClick={() => { handleApprove(selectedTeacher); }}
                    className="w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                    <Check className="h-4 w-4 inline mr-2" />Aprovar Professor
                  </button>
                  <button onClick={() => { handleReject(selectedTeacher); }}
                    className="w-full py-3 text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors">
                    <X className="h-4 w-4 inline mr-2" />Rejeitar Pedido
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { handleRoleChange(selectedTeacher, "admin"); }}
                    className="w-full py-3 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors">
                    <Shield className="h-4 w-4 inline mr-2" />Promover a Administrador
                  </button>
                  <button onClick={() => { handleRoleChange(selectedTeacher, "aluno"); }}
                    className="w-full py-3 text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors">
                    Remover Cargo de Professor
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}