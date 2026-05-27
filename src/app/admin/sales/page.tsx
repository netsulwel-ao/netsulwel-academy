"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query,
} from "firebase/firestore";
import {
  DollarSign, TrendingUp, Users, ShoppingCart, Plus,
  Search, Filter, XCircle, CheckCircle2, Clock, Pencil,
  Trash2, Loader2, X, Save, AlertCircle, ChevronDown,
  Download, Eye,
} from "lucide-react";
import type { Sale } from "@/types/settings";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending:   { label: "Pendente",   color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30",  icon: Clock },
  confirmed: { label: "Confirmado", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30",  icon: CheckCircle2 },
  cancelled: { label: "Cancelado",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",      icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  standalone: "Curso Avulso", smart: "Plano Smart", golden: "Plano Golden",
};

const PAYMENT_METHODS = ["Transferência Bancária", "Multicaixa", "PayPal", "Stripe", "Outro"];

const EMPTY_SALE: Omit<Sale, "id" | "createdAt" | "updatedAt"> = {
  userId: "", userName: "", userEmail: "", type: "standalone",
  itemTitle: "", amount: 0, paymentMethod: "Transferência Bancária",
  status: "pending", reference: "", notes: "",
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_SALE });

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Sale["status"]>("all");
  const [filterType, setFilterType] = useState<"all" | Sale["type"]>("all");

  const fetchSales = async () => {
    try {
      const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setSales(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sale)));
    } catch { toast.error("Erro ao carregar vendas."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSales();
  }, []);

  const openCreate = () => { setForm({ ...EMPTY_SALE }); setEditingId(null); setError(""); setModalOpen(true); };
  const openEdit = (s: Sale) => {
    setForm({
      userId: s.userId, userName: s.userName, userEmail: s.userEmail,
      type: s.type, itemTitle: s.itemTitle ?? "", amount: s.amount,
      paymentMethod: s.paymentMethod, status: s.status,
      reference: s.reference ?? "", notes: s.notes ?? "",
    });
    setEditingId(s.id!); setError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.userName.trim() || !form.amount) { setError("Nome e valor são obrigatórios."); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, updatedAt: serverTimestamp() };
      if (editingId) {
        await updateDoc(doc(db, "sales", editingId), payload);
        toast.success("Venda atualizada.");
      } else {
        await addDoc(collection(db, "sales"), { ...payload, createdAt: serverTimestamp() });
        toast.success("Venda registada.");
      }
      setModalOpen(false); fetchSales();
    } catch { setError("Erro ao guardar."); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: Sale["status"]) => {
    try {
      await updateDoc(doc(db, "sales", id), { status, updatedAt: serverTimestamp() });
      setSales((p) => p.map((s) => s.id === id ? { ...s, status } : s));
      toast.success("Status atualizado.");
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
          <h1 className="text-3xl font-bold text-white">Vendas</h1>
          <p className="mt-1 text-gray-400">Gestão de pagamentos e subscrições</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Registar Venda
        </button>
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
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/40 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-700 mb-3" />
          <p className="text-gray-400">Nenhuma venda encontrada</p>
        </div>
      ) : (
        <div className="bg-gray-900/40 backdrop-blur-xl overflow-hidden">
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
                  {/* Status dropdown */}
                  <div className="relative">
                    <select value={sale.status}
                      onChange={(e) => updateStatus(sale.id!, e.target.value as Sale["status"])}
                      className={`w-full text-xs font-bold px-2 py-1.5 border appearance-none cursor-pointer focus:outline-none ${sc.bg} ${sc.color}`}>
                      <option value="pending">Pendente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(sale)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(sale.id!)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
            {filtered.length} de {sales.length} vendas
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
                <h2 className="text-lg font-bold text-white">{editingId ? "Editar Venda" : "Registar Venda"}</h2>
                <button onClick={() => setModalOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome *</label>
                    <input type="text" value={form.userName} onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
                      placeholder="Nome do aluno"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                    <input type="email" value={form.userEmail} onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo</label>
                    <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Sale["type"] }))}
                      className="w-full bg-gray-950 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                      <option value="standalone">Curso Avulso</option>
                      <option value="smart">Plano Smart</option>
                      <option value="golden">Plano Golden</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Valor (Kz) *</label>
                    <input type="number" min="0" value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                  </div>
                </div>

                {form.type === "standalone" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Curso</label>
                    <input type="text" value={form.itemTitle ?? ""} onChange={(e) => setForm((f) => ({ ...f, itemTitle: e.target.value }))}
                      placeholder="Nome do curso"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Método de Pagamento</label>
                    <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                      className="w-full bg-gray-950 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                      {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                    <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Sale["status"] }))}
                      className="w-full bg-gray-950 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                      <option value="pending">Pendente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Referência</label>
                  <input type="text" value={form.reference ?? ""} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                    placeholder="Nº de referência ou comprovativo"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notas</label>
                  <textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Observações internas..."
                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all resize-none" />
                </div>
              </div>
              <div className="flex gap-3 px-6 py-5 border-t border-gray-800">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingId ? "Atualizar" : "Registar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
