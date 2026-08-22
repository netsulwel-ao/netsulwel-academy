"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users, DollarSign, BookOpen, Loader2, TrendingUp,
  GraduationCap, Radio, Settings, Megaphone,
  ArrowUpRight, Video, MailQuestion, Building2,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import type { Sale } from "@/types/settings";

// ── Helpers ──────────────────────────────────────────────────
function toDate(raw: unknown): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  if (typeof raw === "string") { const d = new Date(raw); return isNaN(d.getTime()) ? null : d; }
  return null;
}

function formatKz(v: number) {
  return v.toLocaleString("pt-AO") + " Kz";
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shortMonth(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString("pt-PT", { month: "short" })
    .replace(".", "");
}

// ── Quick action card ─────────────────────────────────────────
function QuickAction({ icon: Icon, label, href, accent }: {
  icon: React.ElementType; label: string; href: string; accent: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 border border-gray-800 bg-gray-900 px-4 py-3.5 hover:bg-gray-900 transition-all`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center border ${accent}`}>
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <span className="flex-1 text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
      <ChevronRight className="h-3 w-3 text-gray-700 group-hover:text-gray-500 transition-colors shrink-0" />
    </Link>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = "text-gray-200", loading = false }: {
  label: string; value: string | number; sub?: string; accent?: string; loading?: boolean;
}) {
  return (
    <div className="border border-gray-800 bg-gray-900 p-5 flex flex-col gap-2">
      <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-700">{label}</p>
      <div className={`text-2xl font-bold tabular-nums leading-none ${accent}`}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-700" /> : value}
      </div>
      {sub && <p className="text-sm text-gray-600 leading-snug">{sub}</p>}
    </div>
  );
}

// ── Mini bar chart (CSS only) ─────────────────────────────────
function MiniBar({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {data.map(({ label, value }) => {
        const pct = value > 0 ? Math.max((value / max) * 100, 5) : 3;
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
            <div
              className="w-full bg-purple/25 group-hover:bg-purple/40 transition-colors"
              style={{ height: `${pct}%` }}
              title={`${label}: ${value}`}
            />
            <p className="font-mono text-[7px] uppercase text-gray-700">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Revenue bar chart (green) ─────────────────────────────────
function RevenueBar({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {data.map(({ label, value }) => {
        const pct = value > 0 ? Math.max((value / max) * 100, 5) : 3;
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
            <div
              className="w-full bg-green/20 group-hover:bg-green/35 transition-colors"
              style={{ height: `${pct}%` }}
              title={`${label}: ${formatKz(value)}`}
            />
            <p className="font-mono text-[7px] uppercase text-gray-700">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { isAdmin, user } = useAuth();

  // Counts
  const [studentsCount,    setStudentsCount]    = useState<number | null>(null);
  const [teachersCount,    setTeachersCount]    = useState<number | null>(null);
  const [institutionsCount,setInstitutionsCount]= useState<number | null>(null);
  const [coursesCount,     setCoursesCount]     = useState<number | null>(null);
  const [livesCount,       setLivesCount]       = useState<number | null>(null);
  const [recentSales,      setRecentSales]      = useState<Sale[]>([]);
  const [allSales,         setAllSales]         = useState<Sale[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        const [
          studentsSnap, teachersSnap, institutionsSnap,
          coursesSnap, livesSnap, salesSnap,
        ] = await Promise.all([
          getDocs(query(collection(db, "users"), where("role", "==", "aluno"))),
          getDocs(query(collection(db, "users"), where("role", "==", "teacher"))),
          getDocs(collection(db, "institutions")),
          getDocs(collection(db, "courses")),
          getDocs(collection(db, "lives")),
          // Últimas vendas confirmadas — ordena em memória
          getDocs(query(collection(db, "sales"), where("status", "==", "confirmed"))),
        ]);
        if (cancelled) return;

        setStudentsCount(studentsSnap.size);
        setTeachersCount(teachersSnap.size);
        setInstitutionsCount(institutionsSnap.size);
        setCoursesCount(coursesSnap.size);
        setLivesCount(livesSnap.size);

        const sales = salesSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Sale))
          .sort((a, b) => {
            const ta = toDate(a.createdAt)?.getTime() ?? 0;
            const tb = toDate(b.createdAt)?.getTime() ?? 0;
            return tb - ta;
          });
        setAllSales(sales);
        setRecentSales(sales.slice(0, 6));
      } catch (err) {
        logger.error("AdminDashboard: failed to load", err);
        if (!cancelled) setError("Não foi possível carregar os dados.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Métricas financeiras ──────────────────────────────────
  const financials = useMemo(() => {
    const now = new Date();
    const curMonth = monthKey(now);
    const prevMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const totalRevenue = allSales.reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0);
    const curRevenue   = allSales
      .filter(s => monthKey(toDate(s.createdAt) ?? new Date(0)) === curMonth)
      .reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0);
    const prevRevenue  = allSales
      .filter(s => monthKey(toDate(s.createdAt) ?? new Date(0)) === prevMonth)
      .reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0);

    return { totalRevenue, curRevenue, prevRevenue };
  }, [allSales]);

  // ── Gráfico: vendas por mês (últimos 6) ──────────────────
  const revenueChart = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = monthKey(d);
      const value = allSales
        .filter(s => monthKey(toDate(s.createdAt) ?? new Date(0)) === key)
        .reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0);
      return { label: shortMonth(key), value };
    });
  }, [allSales]);

  // ── Gráfico: vendas por tipo ──────────────────────────────
  const typeChart = useMemo(() => {
    const map: Record<string, number> = { standalone: 0, smart: 0, golden: 0, live: 0 };
    allSales.forEach(s => { if (s.type in map) map[s.type]++; });
    return [
      { label: "avulso", value: map.standalone },
      { label: "smart",  value: map.smart },
      { label: "golden", value: map.golden },
      { label: "live",   value: map.live },
    ];
  }, [allSales]);

  // ── Quick actions ────────────────────────────────────────
  const quickActions = isAdmin
    ? [
        { icon: Video,        label: "Criar Curso",        href: "/admin/courses/new",         accent: "border-purple/30 text-purple/70" },
        { icon: Radio,        label: "Aula ao Vivo",        href: "/admin/lives/new",           accent: "border-red-500/30 text-red-400/70" },
        { icon: Users,        label: "Alunos",              href: "/admin/students",            accent: "border-blue-500/30 text-blue-400/70" },
        { icon: GraduationCap,label: "Professores",         href: "/admin/teachers",            accent: "border-green/30 text-green/70" },
        { icon: Building2,    label: "Instituições",        href: "/admin/institutions",        accent: "border-cyan-500/30 text-cyan-400/70" },
        { icon: Megaphone,    label: "Anúncios",            href: "/admin/announcements",       accent: "border-amber-500/30 text-amber-400/70" },
        { icon: MailQuestion, label: "Pedidos de Lives",    href: "/admin/free-live-requests",  accent: "border-pink-500/30 text-pink-400/70" },
        { icon: Settings,     label: "Configurações",       href: "/admin/settings",            accent: "border-gray-600 text-gray-500/70" },
      ]
    : [
        { icon: Video,        label: "Criar Curso",         href: "/admin/courses/new",         accent: "border-purple/30 text-purple/70" },
        { icon: Radio,        label: "Aula ao Vivo",         href: "/admin/lives/new",           accent: "border-red-500/30 text-red-400/70" },
        { icon: Users,        label: "Os Meus Alunos",       href: "/admin/students",            accent: "border-blue-500/30 text-blue-400/70" },
        { icon: DollarSign,   label: "As Minhas Vendas",     href: "/admin/sales",               accent: "border-green/30 text-green/70" },
        { icon: Megaphone,    label: "Anúncios",             href: "/admin/announcements",       accent: "border-amber-500/30 text-amber-400/70" },
      ];

  return (
    <div className="max-w-[80rem] mx-auto space-y-10 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">
            // painel de controlo
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Visão Geral</h1>
          <p className="mt-1 text-sm text-gray-600">
            Métricas em tempo real da plataforma.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/users"
            className="flex items-center gap-1.5 bg-purple px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-purple-600 transition-all shrink-0"
          >
            <Users className="h-3 w-3" /> Gerir utilizadores
          </Link>
        )}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{error}</p>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-gray-800">
        <StatCard
          label="Alunos"
          value={studentsCount ?? "—"}
          sub="registados na plataforma"
          accent="text-blue-400/80"
          loading={loading && studentsCount === null}
        />
        <StatCard
          label="Professores"
          value={teachersCount ?? "—"}
          sub="contas activas"
          accent="text-green/80"
          loading={loading && teachersCount === null}
        />
        <StatCard
          label="Instituições"
          value={institutionsCount ?? "—"}
          sub="parceiras"
          accent="text-cyan-400/80"
          loading={loading && institutionsCount === null}
        />
        <StatCard
          label="Cursos"
          value={coursesCount ?? "—"}
          sub="no catálogo"
          accent="text-purple/80"
          loading={loading && coursesCount === null}
        />
        <StatCard
          label="Lives"
          value={livesCount ?? "—"}
          sub="sessões criadas"
          accent="text-red-400/70"
          loading={loading && livesCount === null}
        />
        <StatCard
          label="Receita total"
          value={allSales.length > 0 ? formatKz(financials.totalRevenue) : "—"}
          sub={allSales.length > 0 ? `${allSales.length} venda${allSales.length !== 1 ? "s" : ""} confirmada${allSales.length !== 1 ? "s" : ""}` : "sem vendas ainda"}
          accent="text-amber-400/80"
          loading={loading}
        />
      </div>

      {/* ── Linha 2: Receita mês + gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Receita deste mês */}
        <div className="border border-gray-800 bg-gray-900 p-6 flex flex-col gap-4">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1">
              // receita · este mês
            </p>
            <p className="text-3xl font-bold text-green/80 tabular-nums">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-700" /> : formatKz(financials.curRevenue)}
            </p>
          </div>
          {!loading && financials.prevRevenue > 0 && (
            <div className="flex items-center gap-2">
              <ArrowUpRight className={`h-3.5 w-3.5 shrink-0 ${financials.curRevenue >= financials.prevRevenue ? "text-green/60" : "text-red-400/60"}`} strokeWidth={2} />
              <p className="text-sm text-gray-600">
                {financials.prevRevenue > 0
                  ? `${Math.abs(Math.round(((financials.curRevenue - financials.prevRevenue) / financials.prevRevenue) * 100))}% vs mês anterior (${formatKz(financials.prevRevenue)})`
                  : "primeiro mês com dados"
                }
              </p>
            </div>
          )}
          <div className="mt-auto pt-4 border-t border-gray-800">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">
              últimos 6 meses
            </p>
            {loading
              ? <div className="h-20 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-gray-700" /></div>
              : <RevenueBar data={revenueChart} />
            }
          </div>
        </div>

        {/* Distribuição de vendas por tipo */}
        <div className="border border-gray-800 bg-gray-900 p-6 flex flex-col gap-4">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1">
              // vendas por tipo
            </p>
            <p className="text-sm font-semibold text-gray-200">{allSales.length} total confirmadas</p>
          </div>
          {loading
            ? <div className="flex-1 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-gray-700" /></div>
            : (
              <>
                <MiniBar data={typeChart} />
                <div className="space-y-1.5 mt-auto">
                  {typeChart.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="font-mono text-[13px] uppercase tracking-widest text-gray-600">{label}</span>
                      <span className="font-mono text-sm text-gray-300">{value}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>

        {/* Quick actions */}
        <div className="border border-gray-800 bg-gray-900 p-6 flex flex-col gap-3">
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1">
            // acções rápidas
          </p>
          <div className="space-y-1.5">
            {quickActions.map(a => (
              <QuickAction key={a.href} {...a} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Últimas vendas ── */}
      {!loading && recentSales.length > 0 && (
        <div className="border border-gray-800">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
              // últimas vendas confirmadas
            </p>
            <Link
              href="/admin/sales"
              className="font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-purple/70 transition-colors"
            >
              ver todas →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {recentSales.map(s => {
              const d = toDate(s.createdAt);
              const dateStr = d
                ? d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                : "—";
              const label = s.itemTitle ?? s.type;
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-900 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{s.userName}</p>
                    <p className="font-mono text-[13px] text-gray-700 truncate mt-0.5">{label}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="font-mono text-sm text-green/70">{formatKz(s.netAmount ?? s.amount ?? 0)}</p>
                    <p className="font-mono text-[13px] text-gray-700">{dateStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && allSales.length === 0 && studentsCount === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <TrendingUp className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            // plataforma nova
          </p>
          <p className="text-sm text-gray-600">
            Ainda não há dados. Começa por criar cursos e convidar alunos.
          </p>
        </div>
      )}
    </div>
  );
}
