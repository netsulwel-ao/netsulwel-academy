"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import {
  BookOpen, Users, DollarSign, TrendingUp,
  Loader2, Plus, ArrowRight, Radio,
  BarChart2, Clock,
} from "lucide-react";
import Link from "next/link";
import type { Course } from "@/types/course";
import type { Sale } from "@/types/settings";
import { logger } from "@/lib/logger";

export default function TeacherDashboardPage() {
  const { user, isTeacher } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    if (!user || !isTeacher) return;
    let cancelled = false;

    const loadData = async () => {
      try {
        const [coursesSnap, salesSnap] = await Promise.all([
          getDocs(query(
            collection(db, "courses"),
            where("createdBy", "==", user.uid),
            orderBy("createdAt", "desc")
          )),
          getDocs(query(
            collection(db, "sales"),
            where("sellerId", "==", user.uid),
            where("status", "==", "confirmed"),
            orderBy("createdAt", "desc")
          )),
        ]);

        if (cancelled) return;

        const coursesData = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        const salesData   = salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));

        const totalRevenue  = salesData.reduce((sum, s) => sum + (s.netAmount ?? s.amount), 0);
        const uniqueStudents = new Set(salesData.map(s => s.userId)).size;

        setCourses(coursesData);
        setSales(salesData);
        setStats({
          totalCourses:  coursesData.length,
          totalSales:    salesData.length,
          totalRevenue,
          totalStudents: uniqueStudents,
        });
      } catch (err) {
        logger.error("TeacherDashboard: failed to load data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [user?.uid, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatKz = (v: number) => v.toLocaleString("pt-AO") + " Kz";

  if (!isTeacher) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600 text-sm">Acesso restrito a professores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
      </div>
    );
  }

  const hasContent = courses.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-green/60 mb-2">
            // painel do professor
          </p>
          <h1 className="text-2xl font-bold text-gray-100">
            Olá{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {hasContent
              ? "Resumo do teu desempenho e actividade recente."
              : "Cria o teu primeiro curso para começar a monetizar."}
          </p>
        </div>
        <Link
          href="/dashboard/teacher/courses/new"
          className="flex items-center gap-2 bg-green py-2.5 px-5 text-sm font-bold text-gray-950 hover:bg-green-light transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Novo Curso
        </Link>
      </div>

      {/* ── Empty state — professor sem conteúdo ── */}
      {!hasContent && (
        <div className="border border-gray-800/60 bg-gray-900/20 p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <BookOpen className="h-5 w-5 text-gray-600" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-3">primeiros passos</p>
          <h2 className="text-lg font-bold text-gray-300 mb-2">Ainda não criaste nenhum curso</h2>
          <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
            Cria o teu primeiro curso para começar a monetizar o teu conhecimento e alcançar alunos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/teacher/courses/new"
              className="flex items-center gap-2 bg-green px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-green-light transition-colors"
            >
              <Plus className="h-4 w-4" /> Criar curso
            </Link>
            <Link
              href="/dashboard/teacher/lives/new"
              className="flex items-center gap-2 border border-gray-800 px-5 py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-700 transition-all"
            >
              <Radio className="h-4 w-4" /> Agendar aula ao vivo
            </Link>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {hasContent && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: BookOpen,   label: "Cursos",          value: stats.totalCourses,              accent: "text-green/70"   },
            { icon: Users,      label: "Alunos",          value: stats.totalStudents,             accent: "text-blue-400/70" },
            { icon: DollarSign, label: "Receita líquida", value: formatKz(stats.totalRevenue),   accent: "text-green/70"   },
            { icon: TrendingUp, label: "Vendas",          value: stats.totalSales,                accent: "text-amber-400/70" },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="border border-gray-800/60 bg-gray-900/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 shrink-0 ${accent}`} strokeWidth={1.5} />
                <span className="text-xs text-gray-600 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-100 font-mono">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Acções rápidas ── */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-3">acções rápidas</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: BookOpen, label: "Gerir cursos",      sub: "Edita, publica e arquiva",          href: "/dashboard/teacher/courses",     accent: "border-green/20 hover:border-green/40" },
            { icon: Radio,    label: "Aulas ao vivo",     sub: "Agenda ou inicia uma sessão",        href: "/dashboard/teacher/lives",       accent: "border-purple/20 hover:border-purple/40" },
            { icon: BarChart2,label: "Analytics",         sub: "Vê o desempenho dos teus cursos",    href: "/dashboard/teacher/analytics",   accent: "border-amber-500/20 hover:border-amber-500/40" },
          ].map(({ icon: Icon, label, sub, href, accent }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-4 border bg-gray-900/20 p-4 transition-all ${accent}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 group-hover:border-gray-700 transition-colors">
                <Icon className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-300 group-hover:text-gray-100 transition-colors">{label}</p>
                <p className="text-xs text-gray-600">{sub}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-gray-700 ml-auto group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Cursos recentes ── */}
      {hasContent && (
        <div className="border border-gray-800/60">
          <div className="flex items-center justify-between border-b border-gray-800/60 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-600">cursos recentes</p>
            <Link href="/dashboard/teacher/courses" className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-800/40">
            {courses.slice(0, 5).map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/teacher/courses/${course.id}/edit`}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-900/30 transition-colors"
              >
                <div className="h-14 w-20 shrink-0 overflow-hidden bg-gray-900 border border-gray-800/60">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-300 group-hover:text-gray-100 truncate transition-colors">
                    {course.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {course.lessonsCount ?? 0} aulas · {formatKz(course.price ?? 0)}
                  </p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                  course.status === "published"
                    ? "border-green/30 bg-green/8 text-green/80"
                    : "border-gray-700 bg-gray-900/60 text-gray-600"
                }`}>
                  {course.status === "published" ? "Publicado" : "Rascunho"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Vendas recentes ── */}
      {sales.length > 0 && (
        <div className="border border-gray-800/60">
          <div className="flex items-center justify-between border-b border-gray-800/60 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-600">vendas recentes</p>
            <Link href="/dashboard/wallet" className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Ver carteira <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-800/40">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-300 truncate">{sale.itemTitle ?? sale.type}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{sale.userName}</p>
                </div>
                <p className="shrink-0 ml-4 font-mono text-sm font-bold text-green/80">
                  {formatKz(sale.netAmount ?? sale.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
