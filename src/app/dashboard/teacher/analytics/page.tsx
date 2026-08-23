"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  TrendingUp, BookOpen, DollarSign, Loader2,
  BarChart3, Radio, ArrowUpRight, Minus, AlertTriangle, Users,
} from "lucide-react";
import type { Course } from "@/types/course";
import type { LiveSession } from "@/types/live";
import type { Sale } from "@/types/settings";
import { logger } from "@/lib/logger";

// ── Helpers ───────────────────────────────────────────────────
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

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "");
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, up, accent = "text-gray-200" }: {
  label: string; value: string; sub?: string; up?: boolean; accent?: string;
}) {
  return (
    <div className="border border-gray-800 bg-gray-900 p-5 flex flex-col gap-2">
      <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-700">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className={`text-2xl font-bold tabular-nums leading-none ${accent}`}>{value}</p>
        {up !== undefined && (
          up
            ? <ArrowUpRight className="h-4 w-4 text-green mb-0.5 shrink-0" strokeWidth={1.5} />
            : <Minus className="h-4 w-4 text-gray-700 mb-0.5 shrink-0" strokeWidth={1.5} />
        )}
      </div>
      {sub && <p className="text-sm text-gray-600 leading-snug">{sub}</p>}
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────
function BarChart({ data }: { data: { key: string; label: string; value: number; revenue: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const [hov, setHov] = useState<string | null>(null);
  return (
    <div className="flex items-end gap-2 h-36 w-full">
      {data.map(({ key, label, value, revenue }) => {
        const pct = value > 0 ? Math.max((value / maxVal) * 100, 6) : 3;
        const isHov = hov === key;
        return (
          <div
            key={key}
            className="flex-1 flex flex-col items-center h-full justify-end group"
            onMouseEnter={() => setHov(key)}
            onMouseLeave={() => setHov(null)}
          >
            <div className={`mb-1 text-center transition-opacity duration-150 ${isHov ? "opacity-100" : "opacity-0"}`}>
              <p className="font-mono text-[13px] text-white whitespace-nowrap">{value}v</p>
              {revenue > 0 && <p className="font-mono text-[8px] text-green">{formatKz(revenue)}</p>}
            </div>
            <div
              className={`w-full transition-colors duration-150 ${value > 0 ? (isHov ? "bg-green/50" : "bg-green/25") : "bg-gray-800"}`}
              style={{ height: `${pct}%` }}
            />
            <p className="font-mono text-[8px] uppercase text-gray-700 mt-1">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Revenue donut (CSS conic-gradient) ────────────────────────
function RevenueSplit({ courseRev, liveRev }: { courseRev: number; liveRev: number }) {
  const total = courseRev + liveRev;
  if (total === 0) return <p className="text-sm text-gray-700 py-4">Sem receita ainda.</p>;
  const pct = Math.round((courseRev / total) * 100);
  return (
    <div className="flex items-center gap-6">
      <div
        className="h-16 w-16 shrink-0"
        style={{
          borderRadius: "50%",
          background: `conic-gradient(rgba(134,239,172,0.55) 0% ${pct}%, rgba(248,113,113,0.45) ${pct}% 100%)`,
        }}
      />
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-green/55 shrink-0" />
          <span className="text-sm text-gray-400">Cursos</span>
          <span className="font-mono text-sm text-gray-200 ml-2">{pct}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-red-400/45 shrink-0" />
          <span className="text-sm text-gray-400">Lives</span>
          <span className="font-mono text-sm text-gray-200 ml-2">{100 - pct}%</span>
        </div>
        <p className="font-mono text-[13px] text-gray-700 pt-1">{formatKz(total)} total</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function TeacherAnalyticsPage() {
  const { user, isTeacher } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isTeacher) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        // Sem orderBy composto — ordena em memória para evitar índices no Firestore
        const [coursesSnap, livesSnap, salesSnap] = await Promise.all([
          getDocs(query(collection(db, "courses"), where("createdBy", "==", user.uid))),
          getDocs(query(collection(db, "lives"),   where("createdBy", "==", user.uid))),
          getDocs(query(collection(db, "sales"),   where("sellerId", "==", user.uid), where("status", "==", "confirmed"))),
        ]);
        if (cancelled) return;

        const sortByDate = (a: unknown, b: unknown) => {
          const ta = toDate((a as { createdAt?: unknown }).createdAt)?.getTime() ?? 0;
          const tb = toDate((b as { createdAt?: unknown }).createdAt)?.getTime() ?? 0;
          return tb - ta;
        };

        setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)).sort(sortByDate));
        setLives(livesSnap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSession))
          .sort((a, b) => new Date(b.scheduledAt || 0).getTime() - new Date(a.scheduledAt || 0).getTime()));
        setSales(salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)).sort(sortByDate));
      } catch (err) {
        logger.error("TeacherAnalytics: failed to load", err);
        if (!cancelled) setError("Não foi possível carregar os dados de analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Métricas derivadas ──────────────────────────────────────
  const m = useMemo(() => {
    const totalRevenue  = sales.reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0);
    const courseRevenue = sales.filter(s => s.type !== "live").reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0);
    const liveRevenue   = sales.filter(s => s.type === "live").reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0);
    const totalSales    = sales.length;
    const courseSales   = sales.filter(s => s.type !== "live").length;
    const liveSales     = sales.filter(s => s.type === "live").length;
    const published     = courses.filter(c => c.status === "published").length;
    const avgTicket     = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
    const uniqueStudents = new Set(sales.filter(s => s.type === "standalone").map(s => s.userId)).size;
    return { totalRevenue, courseRevenue, liveRevenue, totalSales, courseSales, liveSales, published, avgTicket, uniqueStudents };
  }, [sales, courses]);

  // ── Gráfico de barras: vendas por mês (últimos 6) ──────────
  const chartData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: monthKey(d), label: monthLabel(monthKey(d)), value: 0, revenue: 0 };
    });
    sales.forEach(s => {
      const d = toDate(s.createdAt);
      if (!d) return;
      const k = monthKey(d);
      const found = months.find(x => x.key === k);
      if (found) { found.value++; found.revenue += s.netAmount ?? s.amount ?? 0; }
    });
    return months;
  }, [sales]);

  // ── Cursos com contagem de vendas ──────────────────────────
  const courseStats = useMemo(() =>
    courses.map(c => {
      const cs = sales.filter(s => s.itemId === c.id);
      return { ...c, saleCount: cs.length, revenue: cs.reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0) };
    }).sort((a, b) => b.revenue - a.revenue),
  [courses, sales]);

  // ── Lives com contagem de vendas ───────────────────────────
  const liveStats = useMemo(() =>
    lives.map(l => {
      const ls = sales.filter(s => s.itemId === l.id);
      return { ...l, saleCount: ls.length, revenue: ls.reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0) };
    }).sort((a, b) => b.revenue - a.revenue),
  [lives, sales]);

  // ── Últimas vendas ──────────────────────────────────────────
  const recentSales = useMemo(() => sales.slice(0, 8), [sales]);

  if (!isTeacher) return null;

  return (
    <div className="max-w-[80rem] mx-auto space-y-10 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-2">
          // analytics
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Desempenho dos teus cursos, lives e receita.
        </p>
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={1.5} />
          <p className="text-sm text-amber-400">{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── KPIs: 5 cards em grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-gray-800">
            <StatCard
              label="Receita líquida"
              value={formatKz(m.totalRevenue)}
              sub={`${m.totalSales} venda${m.totalSales !== 1 ? "s" : ""} confirmada${m.totalSales !== 1 ? "s" : ""}`}
              up={m.totalRevenue > 0}
              accent="text-green"
            />
            <StatCard
              label="Ticket médio"
              value={formatKz(m.avgTicket)}
              sub="por transacção"
            />
            <StatCard
              label="Alunos únicos"
              value={String(m.uniqueStudents)}
              sub="de vendas avulsas"
              accent="text-purple"
            />
            <StatCard
              label="Cursos"
              value={String(courses.length)}
              sub={`${m.published} pub · ${m.courseSales} venda${m.courseSales !== 1 ? "s" : ""}`}
            />
            <StatCard
              label="Lives"
              value={String(lives.length)}
              sub={`${m.liveSales} venda${m.liveSales !== 1 ? "s" : ""} de lives`}
            />
          </div>

          {/* ── Linha: Gráfico de barras + Divisão de receita ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Gráfico vendas/mês */}
            <div className="lg:col-span-2 border border-gray-800 bg-gray-900 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1">
                    // vendas · últimos 6 meses
                  </p>
                  <p className="text-sm font-semibold text-gray-200">
                    {m.totalSales} venda{m.totalSales !== 1 ? "s" : ""} no período
                  </p>
                </div>
                <BarChart3 className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
              </div>
              <BarChart data={chartData} />
            </div>

            {/* Divisão de receita */}
            <div className="border border-gray-800 bg-gray-900 p-6 flex flex-col gap-6">
              <div>
                <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1">
                  // receita por tipo
                </p>
                <p className="text-sm font-semibold text-gray-200">Distribuição</p>
              </div>
              <RevenueSplit courseRev={m.courseRevenue} liveRev={m.liveRevenue} />
              <div className="mt-auto space-y-2 border-t border-gray-800 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" strokeWidth={1.5} /> Cursos
                  </span>
                  <span className="font-mono text-sm text-gray-300">{formatKz(m.courseRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Radio className="h-3 w-3" strokeWidth={1.5} /> Lives
                  </span>
                  <span className="font-mono text-sm text-gray-300">{formatKz(m.liveRevenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Linha: Desempenho cursos + lives ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Cursos */}
            <div className="border border-gray-800">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
                  // cursos · {courses.length}
                </p>
                <BookOpen className="h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
              </div>
              {courseStats.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-gray-700">Nenhum curso criado ainda.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {courseStats.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-900 transition-colors">
                      <span className="font-mono text-[13px] text-gray-700 w-4 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{c.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[13px] text-gray-700">
                          <span>{c.lessonsCount ?? 0} aulas</span>
                          <span>·</span>
                          <span className={c.status === "published" ? "text-green" : "text-gray-700"}>
                            {c.status === "published" ? "pub" : "draft"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm text-gray-300">{formatKz(c.revenue)}</p>
                        <p className="font-mono text-[13px] text-gray-700">{c.saleCount}v</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lives */}
            <div className="border border-gray-800">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
                  // lives · {lives.length}
                </p>
                <Radio className="h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
              </div>
              {liveStats.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-gray-700">Nenhuma live criada ainda.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {liveStats.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-900 transition-colors">
                      <span className="font-mono text-[13px] text-gray-700 w-4 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{l.title}</p>
                        <p className="font-mono text-[13px] text-gray-700 mt-0.5">
                          {l.target === "free" ? "gratuita" : l.target === "standalone" ? "paga" : l.target}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm text-gray-300">
                          {l.price ? formatKz(l.revenue) : <span className="text-green">grátis</span>}
                        </p>
                        <p className="font-mono text-[13px] text-gray-700">{l.saleCount}v</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Últimas vendas ── */}
          {recentSales.length > 0 && (
            <div className="border border-gray-800">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
                  // últimas vendas
                </p>
                <DollarSign className="h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
              </div>
              <div className="divide-y divide-gray-800">
                {recentSales.map(s => {
                  const d = toDate(s.createdAt);
                  const dateStr = d ? d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }) : "—";
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-900 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{s.userName}</p>
                        <p className="font-mono text-[13px] text-gray-700 truncate mt-0.5">
                          {s.itemTitle ?? s.type}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm text-green">{formatKz(s.netAmount ?? s.amount ?? 0)}</p>
                        <p className="font-mono text-[13px] text-gray-700">{dateStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Empty state global ── */}
          {courses.length === 0 && lives.length === 0 && sales.length === 0 && (
            <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
                <TrendingUp className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
              </div>
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
                // sem dados ainda
              </p>
              <p className="text-sm text-gray-600">
                Cria cursos e lives para começar a ver as tuas métricas aqui.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
