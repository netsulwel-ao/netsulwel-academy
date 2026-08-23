"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs,
  doc, onSnapshot,
} from "firebase/firestore";
import {
  Building2, Users, GraduationCap, DollarSign,
  TrendingUp, Loader2, Mail, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { Institution } from "@/types/institution";
import type { Sale } from "@/types/settings";
import { Avatar } from "@/components/ui/Avatar";
import { logger } from "@/lib/logger";

// ── Helpers ───────────────────────────────────────────────────
function toDate(raw: unknown): Date {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  return new Date(0);
}

function formatKz(v: number) {
  return v.toLocaleString("pt-AO") + " Kz";
}

interface MemberRaw {
  id: string; name: string; email: string;
  institutionRole: string; photoURL?: string; createdAt: unknown;
}

export default function InstitutionOverviewPage() {
  const { user, institutionId } = useAuth();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [members,     setMembers]     = useState<MemberRaw[]>([]);
  const [sales,       setSales]       = useState<Sale[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [stats, setStats] = useState({ teachers: 0, students: 0, revenue: 0, salesCount: 0 });

  // Real-time institution status
  useEffect(() => {
    if (!institutionId) return;
    const unsub = onSnapshot(doc(db, "institutions", institutionId), snap => {
      if (snap.exists()) setInstitution({ id: snap.id, ...snap.data() } as Institution);
    });
    return () => unsub();
  }, [institutionId]);

  // Load members + sales — sem orderBy composto
  const load = useCallback(async () => {
    if (!user || !institutionId) return;
    let cancelled = false;
    try {
      const [membersSnap, salesSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), where("institutionId", "==", institutionId))),
        getDocs(query(collection(db, "sales"), where("sellerId", "==", institutionId), where("status", "==", "confirmed"))),
      ]);
      if (cancelled) return;

      const membersData: MemberRaw[] = membersSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as MemberRaw))
        .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());

      const salesData: Sale[] = salesSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Sale))
        .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());

      setMembers(membersData);
      setSales(salesData);
      setStats({
        teachers:   membersData.filter(m => m.institutionRole === "teacher").length,
        students:   membersData.filter(m => ["student","aluno"].includes(m.institutionRole)).length,
        revenue:    salesData.reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0),
        salesCount: salesData.length,
      });
    } catch (err) {
      logger.error("InstitutionOverview: failed to load data", err, { institutionId });
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, [user?.uid, institutionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-16 bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-800 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-gray-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  // ── Pending / Suspended ───────────────────────────────────
  if (institution?.status !== "approved") {
    return (
      <div className="max-w-md mx-auto py-20 animate-in fade-in duration-300">
        <div className="border border-gray-800 bg-gray-900 p-10 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <Building2 className="h-5 w-5 text-gray-600" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-700 mb-4">
            // estado da instituição
          </p>
          {institution?.status === "pending" ? (
            <>
              <h2 className="text-lg font-bold text-gray-200 mb-2">Aguarda aprovação</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                A tua instituição está sob revisão pela equipa Netsulwel.
                Receberás uma notificação assim que for aprovada.
              </p>
              <div className="inline-flex items-center gap-2 border border-amber-500 bg-amber-500/5 px-3 py-1.5 font-mono text-sm text-amber-400">
                <span className="h-1.5 w-1.5 bg-amber-400/60 animate-pulse" />
                pendente
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-200 mb-2">Instituição suspensa</h2>
              <p className="text-sm text-gray-500 mb-6">Contacta a administração para mais informações.</p>
              <div className="inline-flex items-center gap-2 border border-red-500 bg-red-500/5 px-3 py-1.5 font-mono text-sm text-red-400">
                suspensa
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const kpis = [
    { icon: GraduationCap, label: "Professores",     value: stats.teachers,              accent: "text-green" },
    { icon: Users,         label: "Alunos",          value: stats.students,              accent: "text-blue-400" },
    { icon: DollarSign,    label: "Receita Líquida", value: formatKz(stats.revenue),     accent: "text-amber-400" },
    { icon: TrendingUp,    label: "Vendas",          value: stats.salesCount,            accent: "text-purple" },
  ];

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-gray-800 bg-gray-900">
            <Building2 className="h-5 w-5 text-blue-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-blue-500 mb-1">// instituição</p>
            <h1 className="text-xl font-bold text-gray-100">{institution?.name}</h1>
            <p className="text-sm text-gray-600 mt-0.5">Visão geral da tua organização</p>
          </div>
        </div>
        <Link
          href="/dashboard/institution/members"
          className="flex items-center gap-1.5 border border-blue-500 bg-blue-500/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-blue-400 hover:bg-blue-500/15 transition-all shrink-0"
        >
          <Mail className="h-3 w-3" /> Convidar membros
        </Link>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-800">
        {kpis.map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 shrink-0 text-gray-600" strokeWidth={1.5} />
              <span className="font-mono text-[13px] uppercase tracking-widest text-gray-600">{label}</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Membros + Vendas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Membros recentes */}
        <div className="border border-gray-800">
          <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-600">// membros recentes</p>
            <Link href="/dashboard/institution/members" className="flex items-center gap-1 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center border border-gray-800 bg-gray-900">
                <Users className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-600 mb-3">Ainda não tens membros.</p>
              <Link href="/dashboard/institution/members" className="font-mono text-[13px] uppercase tracking-widest text-blue-400 hover:text-blue-400 transition-colors">
                Convidar primeiro membro →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {members.slice(0, 5).map(member => (
                <div key={member.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 shrink-0 overflow-hidden border border-gray-800 bg-gray-900">
                      <Avatar uid={member.id} photoURL={member.photoURL} name={member.name} size={32} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-300 truncate">{member.name || "Sem nome"}</p>
                      <p className="font-mono text-[13px] text-gray-700 truncate">{member.email}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${
                    member.institutionRole === "teacher" ? "border-green text-green"
                    : member.institutionRole === "admin" ? "border-purple text-purple"
                    : "border-gray-700 text-gray-600"
                  }`}>
                    {member.institutionRole === "teacher" ? "Prof." : member.institutionRole === "admin" ? "Admin" : "Aluno"}
                  </span>
                </div>
              ))}
              {members.length > 5 && (
                <div className="px-5 py-3 border-t border-gray-800">
                  <Link href="/dashboard/institution/members" className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
                    +{members.length - 5} mais →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vendas recentes */}
        <div className="border border-gray-800">
          <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-600">// vendas recentes</p>
            <Link href="/dashboard/wallet" className="flex items-center gap-1 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
              Ver carteira <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center border border-gray-800 bg-gray-900">
                <DollarSign className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-600">Ainda não tens vendas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {sales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-300 truncate">{sale.itemTitle ?? sale.type}</p>
                    <p className="font-mono text-[13px] text-gray-700 mt-0.5">{sale.userName}</p>
                  </div>
                  <p className="ml-4 shrink-0 font-mono text-sm font-bold text-green">
                    {formatKz(sale.netAmount ?? sale.amount ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
