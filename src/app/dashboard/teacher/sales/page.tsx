"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  DollarSign, Clock, CheckCircle2, AlertCircle,
  Search, Loader2, X, ShoppingCart, AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import type { Sale } from "@/types/settings";

// ── Helper: timestamp → Date ──────────────────────────────────
function toDate(d: unknown): Date | null {
  if (!d) return null;
  if (typeof d === "object" && "toDate" in (d as object))
    return (d as { toDate: () => Date }).toDate();
  return null;
}

function fmtDate(d: unknown): string {
  const dt = toDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtKz(v: number): string {
  return v.toLocaleString("pt-AO") + " Kz";
}

// ── Configuração de estado ────────────────────────────────────
const STATUS: Record<string, { label: string; classes: string }> = {
  pending:   { label: "Pendente",   classes: "border-amber-500/25 bg-amber-500/8 text-amber-400/80" },
  confirmed: { label: "Confirmado", classes: "border-green/25 bg-green/8 text-green/80" },
  cancelled: { label: "Cancelado",  classes: "border-red-500/25 bg-red-500/8 text-red-400/70" },
};

export default function TeacherSalesPage() {
  const { user, isTeacher } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  useEffect(() => {
    if (!user || !isTeacher) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        // Estratégia: buscar TODAS as vendas onde o seller é este professor
        // Sem orderBy para evitar índice composto — ordenar em memória
        const snap = await getDocs(
          query(
            collection(db, "sales"),
            where("sellerId", "==", user.uid)
          )
        );

        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Sale))
          .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));

        if (!cancelled) setSales(data);
      } catch (err) {
        logger.error("TeacherSales: failed to load", err);
        if (!cancelled) setError("Não foi possível carregar as vendas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    pending:       sales.filter(s => s.status === "pending").length,
    confirmed:     sales.filter(s => s.status === "confirmed").length,
    totalRevenue:  sales.filter(s => s.status === "confirmed").reduce((sum, s) => sum + (s.netAmount ?? s.amount), 0),
    totalPending:  sales.filter(s => s.status === "pending").reduce((sum, s) => sum + s.amount, 0),
  }), [sales]);

  // ── Filtro ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sales.filter(s => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (q) {
        return (
          s.userName?.toLowerCase().includes(q) ||
          s.userEmail?.toLowerCase().includes(q) ||
          s.itemTitle?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sales, filterStatus, search]);

  if (!isTeacher) return null;

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-green/60 mb-2">
            // vendas
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Vendas</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? "A carregar..." : `${sales.length} venda${sales.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/dashboard/wallet"
          className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-all shrink-0"
        >
          Ver carteira <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {!loading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Clock,         label: "Pendentes",      value: stats.pending,                        accent: "text-amber-400/70", sub: stats.totalPending > 0 ? fmtKz(stats.totalPending) + " em espera" : null },
              { icon: CheckCircle2,  label: "Confirmadas",    value: stats.confirmed,                      accent: "text-green/70",    sub: null },
              { icon: DollarSign,    label: "Receita líquida",value: fmtKz(stats.totalRevenue),            accent: "text-green/70",    sub: null },
            ].map(({ icon: Icon, label, value, accent, sub }) => (
              <div key={label} className="border border-gray-800 bg-gray-900 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-4 w-4 shrink-0 ${accent}`} strokeWidth={1.5} />
                  <span className="text-sm text-gray-600 uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-100 font-mono">{value}</p>
                {sub && <p className="mt-1 font-mono text-[13px] text-amber-400/60">{sub}</p>}
              </div>
            ))}
          </div>

          {/* Aviso pendentes */}
          {stats.pending > 0 && (
            <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold text-amber-400/80">
                  {stats.pending} venda{stats.pending !== 1 ? "s" : ""} por confirmar
                </p>
                <p className="text-sm text-amber-400/50 mt-0.5">
                  O aluno só terá acesso após o administrador confirmar o pagamento.
                </p>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar por aluno, email ou curso..."
                className="w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-8 text-sm text-gray-200 focus:border-green/40 focus:outline-none transition-colors"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-400 transition-colors"
                  aria-label="Limpar pesquisa">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {(["all", "pending", "confirmed", "cancelled"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(s)}
                  className={`border px-3 py-2 font-mono text-[13px] uppercase tracking-widest transition-colors ${
                    filterStatus === s
                      ? "border-green/30 bg-green/8 text-green/80"
                      : "border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-400"
                  }`}
                >
                  {s === "all" ? "Todas" : s === "pending" ? "Pendentes" : s === "confirmed" ? "Confirmadas" : "Canceladas"}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {sales.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
                <ShoppingCart className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
              </div>
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// sem vendas</p>
              <p className="text-sm text-gray-600">As vendas dos teus cursos aparecerão aqui.</p>
            </div>
          )}

          {/* Sem resultados de filtro */}
          {sales.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-12 text-center">
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// sem resultados</p>
              <p className="text-sm text-gray-600">Nenhuma venda corresponde aos filtros.</p>
            </div>
          )}

          {/* Lista de vendas */}
          {filtered.length > 0 && (
            <div className="border border-gray-800 divide-y divide-gray-800">
              {filtered.map(sale => {
                const cfg = STATUS[sale.status] ?? STATUS.pending;
                return (
                  <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-gray-900 transition-colors">

                    {/* Badge estado */}
                    <span className={`shrink-0 self-start sm:self-auto font-mono text-[13px] uppercase tracking-widest border px-2.5 py-1 ${cfg.classes}`}>
                      {cfg.label}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-200 truncate">
                        {sale.itemTitle ?? sale.type}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {sale.userName ?? "Aluno"} · {sale.userEmail ?? "Sem email"}
                      </p>
                      <p className="font-mono text-[13px] text-gray-700 mt-0.5">
                        {fmtDate(sale.createdAt)}
                      </p>
                    </div>

                    {/* Valor */}
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-bold text-gray-200">
                        {fmtKz(sale.amount)}
                      </p>
                      {sale.status === "confirmed" && sale.netAmount !== undefined && sale.netAmount !== sale.amount && (
                        <p className="font-mono text-[13px] text-green/60 mt-0.5">
                          líq. {fmtKz(sale.netAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
