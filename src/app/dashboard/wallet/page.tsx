"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { DollarSign, TrendingUp, ArrowDown, Calendar, Loader2, CreditCard } from "lucide-react";
import { logger } from "@/lib/logger";
import type { Sale } from "@/types/settings";

// ── Helpers ────────────────────────────────────────────────────
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

// ── Cartão virtual SVG ─────────────────────────────────────────
function VirtualCard({
  name,
  balance,
}: {
  name: string;
  balance: number;
}) {
  // Últimos 4 dígitos pseudo-aleatórios baseados no nome
  const last4 = useMemo(() => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return String(Math.abs(h) % 10000).padStart(4, "0");
  }, [name]);

  return (
    <div className="relative w-full max-w-sm aspect-[1.586/1] select-none">
      {/* Sombra de profundidade */}
      <div className="absolute inset-0 translate-y-3 translate-x-2 bg-gray-800 blur-sm" />

      {/* Cartão principal */}
      <div className="relative h-full w-full overflow-hidden border border-white"
        style={{
          background: "linear-gradient(135deg, #1a0533 0%, #2d0a5e 35%, #16213e 70%, #0f3460 100%)",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Círculos decorativos */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
        <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />
        <div className="absolute right-24 bottom-8 h-24 w-24 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />

        {/* Padrão de linhas */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 400 252" preserveAspectRatio="xMidYMid slice">
          {[...Array(12)].map((_, i) => (
            <line key={i} x1={-50 + i * 40} y1="0" x2={-50 + i * 40 + 100} y2="252"
              stroke="white" strokeWidth="1" />
          ))}
        </svg>

        <div className="relative flex h-full flex-col justify-between p-6">
          {/* Topo — logo e chip */}
          <div className="flex items-center justify-between">
            {/* Chip EMV */}
            <div className="h-9 w-12 rounded-md border border-amber-300 bg-gradient-to-br from-amber-200/80 to-amber-400/80 flex items-center justify-center"
              style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4)" }}>
              <div className="grid grid-cols-2 gap-[2px] opacity-60">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-2 w-3 bg-amber-700/60 rounded-[1px]" />
                ))}
              </div>
            </div>

            {/* Logo */}
            <div className="text-right">
              <p className="font-mono text-[13px] uppercase tracking-[0.3em] text-white">Academia</p>
              <p className="font-mono text-sm font-bold text-white tracking-wider">NETSULWEL</p>
            </div>
          </div>

          {/* Número do cartão */}
          <div>
            <p className="font-mono text-sm tracking-[0.3em] text-white mb-1">
              •••• •••• •••• {last4}
            </p>
          </div>

          {/* Rodapé — nome e saldo */}
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-widest text-white mb-0.5">titular</p>
              <p className="font-mono text-sm font-bold text-white uppercase tracking-wider truncate max-w-[140px]">
                {name || "Professor"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[8px] uppercase tracking-widest text-white mb-0.5">saldo líquido</p>
              <p className="font-mono text-sm font-bold text-white">{fmtKz(balance)}</p>
            </div>
          </div>
        </div>

        {/* Reflexo de luz no topo */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/100 via-transparent to-transparent" />
      </div>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────
export default function WalletPage() {
  const { user, isTeacher, isInstitution } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) { setLoading(false); return; }

        const data = userSnap.data();
        setUserName(data.name ?? user.displayName ?? "");

        const isCreator = data.role === "teacher" || data.role === "institution";
        if (!isCreator) { if (!cancelled) setLoading(false); return; }

        // Sem orderBy para evitar índice composto — ordenar em memória
        const snap = await getDocs(
          query(
            collection(db, "sales"),
            where("sellerId", "==", user.uid),
            where("status", "==", "confirmed")
          )
        );

        const data2 = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Sale))
          .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));

        if (!cancelled) setSales(data2);
      } catch (err) {
        logger.error("Wallet: failed to load", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => ({
    balance:    sales.reduce((sum, s) => sum + (s.netAmount ?? s.amount), 0),
    totalSales: sales.reduce((sum, s) => sum + s.amount, 0),
    totalFees:  sales.reduce((sum, s) => sum + (s.fee ?? 0), 0),
  }), [sales]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!isTeacher && !isInstitution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
          <CreditCard className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// sem acesso</p>
        <p className="text-sm text-gray-600">A carteira está disponível apenas para professores e instituições.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* Cabeçalho */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-green mb-2">// carteira</p>
        <h1 className="text-2xl font-bold text-gray-100">Minha Carteira</h1>
        <p className="mt-1 text-sm text-gray-600">
          {sales.length} venda{sales.length !== 1 ? "s" : ""} confirmada{sales.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Layout: cartão + stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 lg:gap-8 items-start">

        {/* Cartão virtual */}
        <div className="flex flex-col items-center sm:items-start gap-4">
          <VirtualCard name={userName} balance={stats.balance} />
          <p className="font-mono text-[13px] text-gray-700 uppercase tracking-widest">
            cartão virtual · netsulwel academy
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          {[
            {
              icon: DollarSign,
              label: "Saldo líquido",
              value: fmtKz(stats.balance),
              sub: "Após dedução de taxas",
              accent: "text-green",
            },
            {
              icon: TrendingUp,
              label: "Total de vendas",
              value: fmtKz(stats.totalSales),
              sub: "Valor bruto",
              accent: "text-purple",
            },
            {
              icon: ArrowDown,
              label: "Taxas deduzidas",
              value: fmtKz(stats.totalFees),
              sub: "Comissão da plataforma",
              accent: "text-red-400",
            },
          ].map(({ icon: Icon, label, value, sub, accent }) => (
            <div key={label} className="flex items-center gap-4 border border-gray-800 bg-gray-900 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center border border-gray-800 bg-gray-900`}>
                <Icon className={`h-4 w-4 ${accent}`} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">{label}</p>
                <p className="font-mono text-lg font-bold text-gray-200">{value}</p>
                <p className="font-mono text-[13px] text-gray-700">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Histórico ── */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">
          // histórico · {sales.length}
        </p>

        {sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
              <Calendar className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
            </div>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// sem vendas</p>
            <p className="text-sm text-gray-600">Ainda não tens vendas confirmadas.</p>
          </div>
        ) : (
          <div className="border border-gray-800 divide-y divide-gray-800">
            {sales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-900 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-200 truncate">
                    {sale.itemTitle ?? sale.type}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 font-mono text-[13px] text-gray-700">
                    <span>{sale.userName ?? "Aluno"}</span>
                    <span>·</span>
                    <span>{fmtDate(sale.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold text-green">
                    +{fmtKz(sale.netAmount ?? sale.amount)}
                  </p>
                  {(sale.fee ?? 0) > 0 && (
                    <p className="font-mono text-[13px] text-gray-700">
                      taxa: {fmtKz(sale.fee ?? 0)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
