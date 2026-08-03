"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, query, where, orderBy, getDocs, doc, getDoc,
} from "firebase/firestore";
import {
  DollarSign, Clock, CheckCircle2, AlertCircle,
  Search, Loader2, X, TrendingUp, ShoppingCart,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Sale } from "@/types/settings";
import type { Course } from "@/types/course";

const STATUS_CONFIG = {
  pending:   { label: "Pendente",   color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30",  icon: Clock },
  confirmed: { label: "Confirmado", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30",  icon: CheckCircle2 },
  cancelled: { label: "Cancelado",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",      icon: AlertCircle },
};

export default function TeacherSalesPage() {
  const { user, isTeacher } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Sale["status"]>("all");

  useEffect(() => {
    if (!user || !isTeacher) return;
    loadSales();
  }, [user, isTeacher]);

  const loadSales = async () => {
    try {
      // Fetch teacher's courses to get their IDs
      const coursesSnap = await getDocs(
        query(collection(db, "courses"), where("createdBy", "==", user!.uid))
      );
      const myCourseIds = coursesSnap.docs.map((d) => d.id);

      if (myCourseIds.length === 0) {
        setSales([]);
        return;
      }

      // Fetch all sales for teacher's courses (pending + confirmed)
      const salesSnap = await getDocs(
        query(
          collection(db, "sales"),
          where("itemId", "in", myCourseIds.slice(0, 30)),
          orderBy("createdAt", "desc")
        )
      );

      const salesData = salesSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Sale)
      );

      setSales(salesData);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatKz = (v: number) => v.toLocaleString("pt-AO") + " Kz";

  const formatDate = (ts: unknown) => {
    if (!ts) return "—";
    const d = (ts as { toDate?: () => Date })?.toDate?.();
    if (!d) return "—";
    return d.toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const stats = {
    pending: sales.filter((s) => s.status === "pending"),
    confirmed: sales.filter((s) => s.status === "confirmed"),
    totalRevenue: sales
      .filter((s) => s.status === "confirmed")
      .reduce((sum, s) => sum + (s.netAmount || s.amount), 0),
    totalPending: sales
      .filter((s) => s.status === "pending")
      .reduce((sum, s) => sum + s.amount, 0),
  };

  const filtered = sales.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.userName?.toLowerCase().includes(q) ||
        s.userEmail?.toLowerCase().includes(q) ||
        s.itemTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!isTeacher) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Acesso não autorizado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Vendas</h1>
        <p className="mt-1 text-gray-400">
          Vendas dos teus cursos. Apenas o administrador pode confirmar pagamentos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900/40 border border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <p className="text-sm text-gray-400">Pendentes</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pending.length}</p>
          {stats.totalPending > 0 && (
            <p className="text-xs text-amber-400 mt-1">{formatKz(stats.totalPending)} em espera</p>
          )}
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Confirmadas</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.confirmed.length}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <p className="text-sm text-gray-400">Receita Liquida</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatKz(stats.totalRevenue)}</p>
        </div>
      </div>

      {/* Pending alert */}
      {stats.pending.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 px-5 py-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">
              {stats.pending.length} venda{stats.pending.length !== 1 ? "s" : ""} pendente{stats.pending.length !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-amber-200/70 mt-1">
              Estes pagamentos aguardam confirmacao do administrador. O aluno so tera acesso apos a confirmacao.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por aluno ou curso..."
            className="w-full bg-gray-900 border border-gray-800 focus:border-green-500/50 py-2.5 pl-10 pr-9 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Limpar pesquisa"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "confirmed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-sm font-medium border transition-colors ${
                filterStatus === s
                  ? "border-green-500/50 bg-green-500/10 text-green-400"
                  : "border-gray-800 text-gray-500 hover:text-gray-300"
              }`}
            >
              {s === "all" ? "Todas" : s === "pending" ? "Pendentes" : "Confirmadas"}
            </button>
          ))}
        </div>
      </div>

      {/* Sales list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={search ? "Nenhuma venda encontrada" : "Ainda nao tens vendas"}
          description={
            search
              ? "Tenta com outros termos de pesquisa."
              : "As vendas dos teus cursos aparecerao aqui."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((sale) => {
            const cfg = STATUS_CONFIG[sale.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={sale.id}
                className={`bg-gray-900/40 border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                  sale.status === "pending"
                    ? "border-amber-500/20"
                    : "border-gray-800"
                }`}
              >
                {/* Status badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border shrink-0 ${cfg.bg} ${cfg.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {cfg.label}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {sale.itemTitle || sale.type}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {sale.userName || "Aluno"} &middot; {sale.userEmail || "Sem email"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatDate(sale.createdAt)}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-white">{formatKz(sale.amount)}</p>
                  {sale.status === "confirmed" && sale.netAmount !== undefined && sale.netAmount !== sale.amount && (
                    <p className="text-xs text-gray-500">
                      Liquido: {formatKz(sale.netAmount)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
