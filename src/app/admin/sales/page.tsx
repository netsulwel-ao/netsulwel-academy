"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query, where, arrayUnion, arrayRemove,
} from "firebase/firestore";
import {
  DollarSign, TrendingUp, ShoppingCart,
  Search, XCircle, CheckCircle2, Clock,
  Trash2, Loader2, FileText,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Sale } from "@/types/settings";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_CONFIG = {
  pending:   { label: "Pendente",   color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30",  icon: Clock },
  confirmed: { label: "Confirmado", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30",  icon: CheckCircle2 },
  cancelled: { label: "Cancelado",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",      icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  standalone: "Curso Avulso", smart: "Plano Smart", golden: "Plano Golden",
};

export default function SalesPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Sale["status"]>("all");
  const [filterType, setFilterType] = useState<"all" | Sale["type"]>("all");

  const fetchSales = async () => {
    try {
      if (isTeacher && user?.uid) {
        // Teacher: busca só cursos seus e filtra as vendas por itemId
        const coursesSnap = await getDocs(
          query(collection(db, "courses"), where("createdBy", "==", user.uid))
        );
        const myCourseIds = coursesSnap.docs.map(d => d.id);
        if (myCourseIds.length === 0) { setSales([]); return; }

        const salesSnap = await getDocs(
          query(
            collection(db, "sales"),
            where("itemId", "in", myCourseIds.slice(0, 30)),
            orderBy("createdAt", "desc")
          )
        );
        setSales(salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
      } else {
        // Admin: vê todas as vendas de alunos
        const [studentsSnap, salesSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), where("role", "==", "aluno"))),
          getDocs(query(collection(db, "sales"), orderBy("createdAt", "desc"))),
        ]);
        const studentIds = new Set(studentsSnap.docs.map(d => d.id));
        setSales(
          salesSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Sale))
            .filter(s => studentIds.has(s.userId))
        );
      }
    } catch { toast.error("Erro ao carregar vendas."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSales();
  }, [isTeacher, user?.uid]);

  const updateStatus = async (id: string, newStatus: Sale["status"]) => {
    try {
      const sale = sales.find((s) => s.id === id);
      if (!sale) return;
      const userRef = doc(db, "users", sale.userId);

      if (newStatus === "confirmed" && sale.status !== "confirmed") {
        if (sale.type === "standalone" && sale.itemId) {
          await updateDoc(userRef, { enrolledCourses: arrayUnion(sale.itemId) });
        } else if (sale.type === "smart" || sale.type === "golden") {
          await updateDoc(userRef, { plan: sale.type });
        }
        await addDoc(collection(db, "users", sale.userId, "notifications"), {
          uid: sale.userId,
          type: "payment_approved",
          title: "Pagamento Confirmado",
          message: `O teu pagamento para "${sale.itemTitle || sale.type}" foi aprovado.`,
          link: sale.type === "standalone" && sale.itemId ? `/dashboard/courses/${sale.itemId}` : "/dashboard",
          read: false,
          createdAt: serverTimestamp(),
        });
      } else if (newStatus !== "confirmed" && sale.status === "confirmed") {
        if (sale.type === "standalone" && sale.itemId) {
          await updateDoc(userRef, { enrolledCourses: arrayRemove(sale.itemId) });
        } else if (sale.type === "smart" || sale.type === "golden") {
          await updateDoc(userRef, { plan: "free" });
        }
      }

      await updateDoc(doc(db, "sales", id), { status: newStatus, updatedAt: serverTimestamp() });
      setSales((p) => p.map((s) => s.id === id ? { ...s, status: newStatus } : s));
      toast.success(newStatus === "confirmed" ? "Pagamento confirmado — acesso atribuído." : "Status atualizado.");
    } catch { toast.error("Erro ao atualizar status."); }
  };

  const handleDelete = async (id: string) => {
    toast("Apagar esta venda?", {
      action: { label: "Apagar", onClick: async () => {
        try {
          await deleteDoc(doc(db, "sales", id));
          setSales((p) => p.filter((s) => s.id !== id));
          toast.success("Venda apagada.");
        } catch { toast.error("Erro ao apagar venda."); }
      }},
      cancel: "Cancelar",
      duration: Infinity,
    });
  };

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const confirmed = sales.filter((s) => s.status === "confirmed");
    const thisMonth = confirmed.filter((s) => {
      const d = (s.createdAt as { toDate?: () => Date })?.toDate?.();
      if (!d) return false;
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      total: confirmed.reduce((a, s) => a + s.amount, 0),
      thisMonth: thisMonth.reduce((a, s) => a + s.amount, 0),
      count: confirmed.length,
      pending: sales.filter((s) => s.status === "pending").length,
    };
  }, [sales]);

  // ── Filtered ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterType !== "all" && s.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return s.userName.toLowerCase().includes(q) ||
          s.userEmail.toLowerCase().includes(q) ||
          s.itemTitle?.toLowerCase().includes(q) ||
          s.reference?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [sales, filterStatus, filterType, search]);

  const formatKz = (v: number) => v.toLocaleString("pt-AO") + " Kz";
  const formatDate = (ts: unknown) => {
    const d = (ts as { toDate?: () => Date })?.toDate?.();
    if (!d) return "—";
    return d.toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            {isTeacher ? "As Minhas Vendas" : "Vendas"}
          </h1>
          <p className="mt-1 text-gray-400">
            {isTeacher
              ? "Vendas confirmadas dos teus cursos."
              : "Gestão de pagamentos e subscrições"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita Total", value: formatKz(stats.total), icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Este Mês", value: formatKz(stats.thisMonth), icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Vendas Confirmadas", value: stats.count, icon: ShoppingCart, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900/40 p-5 flex items-center justify-between backdrop-blur-xl">
            <div>
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center ${bg}`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, email, referência..."
            className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="bg-gray-900 border border-gray-800 text-gray-300 text-sm py-2.5 px-4 focus:outline-none appearance-none cursor-pointer">
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="bg-gray-900 border border-gray-800 text-gray-300 text-sm py-2.5 px-4 focus:outline-none appearance-none cursor-pointer">
          <option value="all">Todos os tipos</option>
          <option value="standalone">Curso Avulso</option>
          <option value="smart">Plano Smart</option>
          <option value="golden">Plano Golden</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={search ? "Nenhuma venda encontrada" : "Ainda não há vendas"}
          description={search ? "Tenta pesquisar por outro termo." : "As vendas aparecerão aqui depois de os alunos comprarem cursos ou planos."}
          compact
        />
      ) : (
        <div className="bg-gray-900/40 backdrop-blur-xl overflow-x-auto">
          <div className="min-w-[700px]">
          <div className="grid grid-cols-[1fr_120px_120px_140px_120px_80px] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Cliente / Item</span>
            <span>Tipo</span>
            <span>Valor</span>
            <span>Pagamento</span>
            <span>Status</span>
            <span></span>
          </div>
          <div className="divide-y divide-gray-800/60">
            {filtered.map((sale) => {
              const sc = STATUS_CONFIG[sale.status];
              const StatusIcon = sc.icon;
              return (
                <div key={sale.id} className="grid grid-cols-[1fr_120px_120px_140px_120px_80px] gap-4 px-5 py-4 items-center hover:bg-gray-800/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{sale.userName}</p>
                    <p className="text-xs text-gray-500 truncate">{sale.userEmail}</p>
                    {sale.itemTitle && <p className="text-xs text-gray-600 truncate mt-0.5">{sale.itemTitle}</p>}
                    <p className="text-xs text-gray-700 mt-0.5">{formatDate(sale.createdAt)}</p>
                  </div>
                  <span className="text-xs text-gray-400">{TYPE_LABELS[sale.type]}</span>
                  <span className="text-sm font-bold text-white">{formatKz(sale.amount)}</span>
                  <span className="text-xs text-gray-400 truncate">{sale.paymentMethod}</span>
                  {/* Status — admin pode alterar, teacher só vê */}
                  <div className="relative">
                    {isAdmin ? (
                      <select value={sale.status}
                        onChange={(e) => updateStatus(sale.id!, e.target.value as Sale["status"])}
                        className={`w-full text-xs font-bold px-2 py-1.5 border appearance-none cursor-pointer focus:outline-none ${sc.bg} ${sc.color}`}>
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1.5 border ${sc.bg} ${sc.color}`}>
                        <StatusIcon className="h-3 w-3" />{sc.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {sale.receiptUrl && (
                      <a href={sale.receiptUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors" title="Ver comprovativo">
                        <FileText className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(sale.id!)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
            {filtered.length} de {sales.length} vendas
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
