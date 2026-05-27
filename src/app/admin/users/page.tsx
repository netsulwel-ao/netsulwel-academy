"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, doc, updateDoc, orderBy, query,
} from "firebase/firestore";
import {
  Users, Search, Shield, ShieldOff, Loader2, ChevronDown,
  Mail, Calendar, BookOpen, MoreVertical, X, CheckCircle2,
  AlertCircle, UserCheck, UserX, Filter,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  role: "aluno" | "admin";
  createdAt: Date;
  enrolledCourses?: string[];
  photoURL?: string;
}

type RoleFilter = "all" | "aluno" | "admin";
type SortBy = "name" | "date" | "role";

export default function UsersPage() {
  const [users, setUsers] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [selectedUser, setSelectedUser] = useState<Student | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch ─────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      })) as Student[];
      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar utilizadores.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  // ── Role change ───────────────────────────────────────────
  const handleRoleChange = async (user: Student, newRole: "aluno" | "admin") => {
    setActionLoading(user.id);
    setMenuOpen(null);
    try {
      await updateDoc(doc(db, "users", user.id), { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
      if (selectedUser?.id === user.id) setSelectedUser((prev) => prev ? { ...prev, role: newRole } : null);
      showToast(
        newRole === "admin"
          ? `${user.name || user.email} promovido a Admin.`
          : `${user.name || user.email} voltou a Aluno.`,
        "success"
      );
    } catch {
      showToast("Erro ao alterar permissão.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filtered + sorted list ────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...users];
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "role") return a.role.localeCompare(b.role);
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    return list;
  }, [users, search, roleFilter, sortBy]);

  const stats = useMemo(() => ({
    total: users.length,
    alunos: users.filter((u) => u.role === "aluno").length,
    admins: users.filter((u) => u.role === "admin").length,
  }), [users]);

  // ── Helpers ───────────────────────────────────────────────
  const getInitials = (name: string, email: string) => {
    if (name?.trim()) return name.trim().substring(0, 2).toUpperCase();
    return email?.substring(0, 2).toUpperCase() ?? "??";
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 text-sm font-medium shadow-xl border animate-in slide-in-from-top-2 duration-300 ${
          toast.type === "success"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)}><X className="h-4 w-4 ml-2" /></button>
        </div>
      )}

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-white">Alunos</h1>
        <p className="mt-1 text-gray-400">Gestão de utilizadores da plataforma</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "blue" },
          { label: "Alunos", value: stats.alunos, icon: UserCheck, color: "green" },
          { label: "Admins", value: stats.admins, icon: Shield, color: "purple" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900/40 backdrop-blur-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? <Loader2 className="h-7 w-7 animate-spin text-gray-600" /> : value}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center ${
              color === "blue" ? "bg-blue-500/10" : color === "green" ? "bg-green-500/10" : "bg-purple-500/10"
            }`}>
              <Icon className={`h-6 w-6 ${
                color === "blue" ? "text-blue-400" : color === "green" ? "text-green-400" : "text-purple-400"
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="flex border border-gray-800 overflow-hidden shrink-0">
          {(["all", "aluno", "admin"] as RoleFilter[]).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                roleFilter === r ? "bg-blue-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              {r === "all" ? "Todos" : r === "aluno" ? "Alunos" : "Admins"}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-gray-900 border border-gray-800 text-gray-300 text-sm py-2.5 pl-9 pr-8 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer">
            <option value="date">Mais recentes</option>
            <option value="name">Nome A-Z</option>
            <option value="role">Por role</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/40 text-center">
          <Users className="h-12 w-12 text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">Nenhum utilizador encontrado</p>
          {search && <p className="text-gray-600 text-sm mt-1">Tenta pesquisar por outro termo</p>}
        </div>
      ) : (
        <div className="bg-gray-900/40 backdrop-blur-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_120px_120px_48px] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Utilizador</span>
            <span>Email</span>
            <span>Registado</span>
            <span>Role</span>
            <span></span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-800/60">
            {filtered.map((user) => (
              <div key={user.id}
                className="grid grid-cols-[1fr_1fr_120px_120px_48px] gap-4 px-5 py-4 items-center hover:bg-gray-800/30 transition-colors group">

                {/* Avatar + nome */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xs font-bold overflow-hidden">
                    {user.photoURL
                      ? <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                      : getInitials(user.name, user.email)
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name || "—"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.id.substring(0, 12)}...</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                  <span className="text-sm text-gray-300 truncate">{user.email || "—"}</span>
                </div>

                {/* Data */}
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Calendar className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                  {formatDate(user.createdAt)}
                </div>

                {/* Role badge */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    user.role === "admin"
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {user.role === "admin" ? <Shield className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                    {user.role}
                  </span>
                </div>

                {/* Actions menu */}
                <div className="relative flex justify-center">
                  {actionLoading === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  ) : (
                    <>
                      <button
                        onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                        className="p-1.5 text-gray-600 hover:text-white hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {menuOpen === user.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-8 z-20 w-52 bg-gray-900 border border-gray-700 shadow-2xl py-1">
                            <button
                              onClick={() => { setSelectedUser(user); setMenuOpen(null); }}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                            >
                              <Users className="h-4 w-4" /> Ver detalhes
                            </button>
                            {user.role === "aluno" ? (
                              <button
                                onClick={() => handleRoleChange(user, "admin")}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-purple-400 hover:bg-purple-500/10 transition-colors"
                              >
                                <Shield className="h-4 w-4" /> Promover a Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleChange(user, "aluno")}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                              >
                                <ShieldOff className="h-4 w-4" /> Remover Admin
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer count */}
          <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
            {filtered.length} de {users.length} utilizadores
          </div>
        </div>
      )}

      {/* ── User detail drawer ── */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 z-40 bg-gray-950/70 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Detalhes do Utilizador</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Avatar + info */}
              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-white text-2xl font-bold overflow-hidden">
                  {selectedUser.photoURL
                    ? <img src={selectedUser.photoURL} alt={selectedUser.name} className="h-full w-full object-cover" />
                    : getInitials(selectedUser.name, selectedUser.email)
                  }
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{selectedUser.name || "Sem nome"}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{selectedUser.email}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  selectedUser.role === "admin"
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}>
                  {selectedUser.role === "admin" ? <Shield className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                  {selectedUser.role}
                </span>
              </div>

              {/* Info fields */}
              <div className="space-y-3">
                {[
                  { label: "ID", value: selectedUser.id, icon: Users },
                  { label: "Email", value: selectedUser.email || "—", icon: Mail },
                  { label: "Registado em", value: formatDate(selectedUser.createdAt), icon: Calendar },
                  { label: "Cursos inscritos", value: String(selectedUser.enrolledCourses?.length ?? 0), icon: BookOpen },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-3 bg-gray-800/40 px-4 py-3">
                    <Icon className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <p className="text-sm text-white mt-0.5 break-all">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer actions */}
            <div className="p-6 border-t border-gray-800 space-y-3">
              {selectedUser.role === "aluno" ? (
                <button
                  onClick={() => handleRoleChange(selectedUser, "admin")}
                  disabled={actionLoading === selectedUser.id}
                  className="flex w-full items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 font-bold transition-colors disabled:opacity-60"
                >
                  {actionLoading === selectedUser.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Shield className="h-4 w-4" />
                  }
                  Promover a Admin
                </button>
              ) : (
                <button
                  onClick={() => handleRoleChange(selectedUser, "aluno")}
                  disabled={actionLoading === selectedUser.id}
                  className="flex w-full items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-3 font-bold transition-colors disabled:opacity-60"
                >
                  {actionLoading === selectedUser.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <ShieldOff className="h-4 w-4" />
                  }
                  Remover Admin
                </button>
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="flex w-full items-center justify-center bg-gray-800 hover:bg-gray-700 text-white py-3 font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
