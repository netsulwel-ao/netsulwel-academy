"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Video, DollarSign, TrendingUp, BookOpen, Radio, Settings, MessageSquare, Megaphone, Layers, ArrowRight, Loader2, UserPlus, GraduationCap, Building2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const adminQuickActions = [
  { icon: Video, label: "Criar Curso", href: "/admin/courses/new", color: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20" },
  { icon: Radio, label: "Aula ao Vivo", href: "/admin/lives/new", color: "bg-pink-500/10 text-pink-400 hover:bg-pink-500/20" },
  { icon: Users, label: "Alunos", href: "/admin/students", color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
  { icon: GraduationCap, label: "Professores", href: "/admin/teachers", color: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" },
  { icon: Building2, label: "Instituições", href: "/admin/institutions", color: "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20" },
  { icon: MessageSquare, label: "Comunidade", href: "/admin/community", color: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" },
  { icon: Megaphone, label: "Anúncio", href: "/admin/announcements", color: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" },
  { icon: Layers, label: "Trilhas", href: "/admin/trails", color: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" },
  { icon: Settings, label: "Configurações", href: "/admin/settings", color: "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20" },
];

const teacherQuickActions = [
  { icon: Video, label: "Criar Curso", href: "/admin/courses/new", color: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20" },
  { icon: Radio, label: "Aula ao Vivo", href: "/admin/lives/new", color: "bg-pink-500/10 text-pink-400 hover:bg-pink-500/20" },
  { icon: Users, label: "Os Meus Alunos", href: "/admin/students", color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
  { icon: DollarSign, label: "As Minhas Vendas", href: "/admin/sales", color: "bg-green-500/10 text-green-400 hover:bg-green-500/20" },
  { icon: Megaphone, label: "Anúncio", href: "/admin/announcements", color: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" },
  { icon: Layers, label: "Trilhas", href: "/admin/trails", color: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" },
];

const COLORS = ["#7c3aed", "#a855f7", "#6366f1", "#3b82f6", "#06b6d4", "#10b981"];

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 }).format(value);
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

interface DailyCount { date: string; count: number; }
interface MonthlyRevenue { month: string; revenue: number; }

export default function AdminDashboardPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const [studentsCount, setStudentsCount] = useState<number | null>(null);
  const [teachersCount, setTeachersCount] = useState<number | null>(null);
  const [coursesCount, setCoursesCount] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);
  const [todayAccesses, setTodayAccesses] = useState<number | null>(null);
  const [userGrowth, setUserGrowth] = useState<DailyCount[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<MonthlyRevenue[]>([]);
  const [courseTypeDist, setCourseTypeDist] = useState<{ name: string; value: number }[]>([]);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const check = () => setIsLightMode(document.documentElement.getAttribute("data-theme") === "light");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const usersRef = collection(db, "users");
        const coursesRef = collection(db, "courses");
        const salesRef = collection(db, "sales");
        const now = new Date();

        const daysMap: Record<string, number> = {};
        const monthsMap: Record<string, number> = {};

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          daysMap[formatDate(d)] = 0;
        }
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthsMap[d.toLocaleDateString("pt-PT", { month: "short" })] = 0;
        }

        if (isTeacher && user?.uid) {
          const myCoursesQuery = query(coursesRef, where("createdBy", "==", user.uid));
          const myCoursesSnap = await getDocs(myCoursesQuery);
          const myCourseIds = myCoursesSnap.docs.map(d => d.id);

          setCoursesCount(myCoursesSnap.size);
          setCourseTypeDist([]);

          if (myCourseIds.length > 0) {
            const allStudentsSnap = await getDocs(query(usersRef, where("role", "==", "aluno")));
            const myStudents = allStudentsSnap.docs.filter(d => {
              const ec = d.data().enrolledCourses as string[] | undefined;
              return ec?.some(id => myCourseIds.includes(id));
            });
            setStudentsCount(myStudents.length);

            const growthMap: Record<string, number> = {};
            myStudents.forEach((doc) => {
              const data = doc.data();
              const created = (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string);
              const dStr = formatDate(created);
              if (daysMap[dStr] !== undefined) {
                growthMap[dStr] = (growthMap[dStr] || 0) + 1;
              }
            });
            setUserGrowth(Object.entries(daysMap).map(([date, _]) => ({ date, count: growthMap[date] || 0 })));

            const mySalesSnap = await getDocs(query(salesRef, where("itemId", "in", myCourseIds.slice(0, 30)), where("status", "==", "confirmed")));
            const myCourseIdSet = new Set(myCourseIds);
            let revenue = 0;
            let today = 0;
            mySalesSnap.forEach((sale) => {
              if (!myCourseIdSet.has(sale.data().itemId)) return;
              const data = sale.data();
              const createdAt = (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string);
              const amount = data.price ?? data.amount ?? 0;
              if (createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()) {
                revenue += amount;
              }
              if (createdAt.toDateString() === now.toDateString()) today++;
              const dStr = formatDate(createdAt);
              if (daysMap[dStr] !== undefined) daysMap[dStr] += amount;
              const mStr = createdAt.toLocaleDateString("pt-PT", { month: "short" });
              if (monthsMap[mStr] !== undefined) monthsMap[mStr] += amount;
            });
            setMonthlyRevenue(revenue);
            setTodayAccesses(today);
            setRevenueHistory(Object.entries(monthsMap).map(([month, rev]) => ({ month, revenue: rev })));
          } else {
            setStudentsCount(0);
            setMonthlyRevenue(0);
            setTodayAccesses(0);
            setUserGrowth(Object.entries(daysMap).map(([date, _]) => ({ date, count: 0 })));
            setRevenueHistory(Object.entries(monthsMap).map(([month, _]) => ({ month, revenue: 0 })));
          }
          setTeachersCount(null);
          return;
        }

        const [studentsSnap, teachersSnap, coursesSnap, salesSnap] = await Promise.all([
          getDocs(query(usersRef, where("role", "==", "aluno"))),
          getDocs(query(usersRef, where("role", "==", "teacher"))),
          getDocs(coursesRef),
          getDocs(query(salesRef, where("status", "==", "confirmed"))),
        ]);

        if (cancelled) return;

        setStudentsCount(studentsSnap.size);
        setTeachersCount(teachersSnap.size);
        setCoursesCount(coursesSnap.size);

        let revenue = 0;
        let today = 0;

        salesSnap.forEach((sale) => {
          const data = sale.data();
          const createdAt = (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string);
          const amount = data.price ?? data.amount ?? 0;

          if (createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()) {
            revenue += amount;
          }
          if (createdAt.toDateString() === now.toDateString()) today++;

          const dStr = formatDate(createdAt);
          if (daysMap[dStr] !== undefined) daysMap[dStr] += amount;

          const mStr = createdAt.toLocaleDateString("pt-PT", { month: "short" });
          if (monthsMap[mStr] !== undefined) monthsMap[mStr] += amount;
        });

        setMonthlyRevenue(revenue);
        setTodayAccesses(today);
        setRevenueHistory(Object.entries(monthsMap).map(([month, rev]) => ({ month, revenue: rev })));

        const growthMap: Record<string, number> = {};
        studentsSnap.forEach((doc) => {
          const data = doc.data();
          const created = (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string);
          const dStr = formatDate(created);
          if (daysMap[dStr] !== undefined) {
            growthMap[dStr] = (growthMap[dStr] || 0) + 1;
          }
        });
        setUserGrowth(Object.entries(daysMap).map(([date, _]) => ({ date, count: growthMap[date] || 0 })));

        const typeMap: Record<string, number> = {};
        coursesSnap.forEach((doc) => {
          // Normalizar "free" (legado) para "standalone"
          const raw = doc.data().type || "standalone";
          const t = raw === "free" ? "standalone" : raw;
          typeMap[t] = (typeMap[t] || 0) + 1;
        });
        setCourseTypeDist(Object.entries(typeMap).map(([name, value]) => ({ name, value })));
      } catch (err) {
        if (!cancelled) console.error("Dashboard fetch error:", err);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [isTeacher, user?.uid]);

  const stats = isTeacher
    ? [
        { label: "Meus Alunos", value: studentsCount, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Meus Cursos", value: coursesCount, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-500/10" },
        { label: "Receita (Mês)", value: monthlyRevenue === null ? null : formatKz(monthlyRevenue), icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
        { label: "Acessos Hoje", value: todayAccesses, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
      ]
    : [
        { label: "Alunos", value: studentsCount, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Professores", value: teachersCount, icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "Cursos", value: coursesCount, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-500/10" },
        { label: "Receita (Mês)", value: monthlyRevenue === null ? null : formatKz(monthlyRevenue), icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
        { label: "Acessos Hoje", value: todayAccesses, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
      ];

  return (
    <div className="max-w-[100rem] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Painel de Controlo</h1>
          <p className="mt-2 text-gray-400">Visão geral da plataforma.</p>
        </div>
        {isAdmin && (
          <Link href="/admin/users" className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 text-sm font-bold transition-colors">
            <UserPlus className="h-4 w-4" />
            Gerir Utilizadores
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 p-5 transition-all hover:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {s.value === null ? <Loader2 className="h-5 w-5 animate-spin text-gray-500" /> : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-sm font-bold text-white mb-1">Crescimento de Alunos (7 dias)</h3>
          <p className="text-xs text-gray-500 mb-6">Novos alunos registados por dia</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#e2e8f0" : "#1e1e30"} />
                <XAxis dataKey="date" stroke={isLightMode ? "#94a3b8" : "#4a4a6a"} tick={{ fontSize: 11, fill: isLightMode ? "#64748b" : "#6b7280" }} />
                <YAxis stroke={isLightMode ? "#94a3b8" : "#4a4a6a"} tick={{ fontSize: 11, fill: isLightMode ? "#64748b" : "#6b7280" }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: isLightMode ? "#ffffff" : "#1a1a2e", border: isLightMode ? "1px solid #e2e8f0" : "1px solid #2e2e50", borderRadius: 8, color: isLightMode ? "#0f172a" : "#fff" }} />
                <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Distribution */}
        <div className="bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-sm font-bold text-white mb-1">Distribuição de Cursos</h3>
          <p className="text-xs text-gray-500 mb-6">Por tipo de plano</p>
          <div className="h-64 flex items-center justify-center">
            {courseTypeDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={courseTypeDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }: { name?: string; value?: number }) => `${name} (${value ?? 0})`}>
                    {courseTypeDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: isLightMode ? "#ffffff" : "#1a1a2e", border: isLightMode ? "1px solid #e2e8f0" : "1px solid #2e2e50", borderRadius: 8, color: isLightMode ? "#0f172a" : "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum curso</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-900 border border-gray-800 p-6">
        <h3 className="text-sm font-bold text-white mb-1">Receita (6 meses)</h3>
        <p className="text-xs text-gray-500 mb-6">Evolução da receita mensal</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#e2e8f0" : "#1e1e30"} />
              <XAxis dataKey="month" stroke={isLightMode ? "#94a3b8" : "#4a4a6a"} tick={{ fontSize: 11, fill: isLightMode ? "#64748b" : "#6b7280" }} />
              <YAxis stroke={isLightMode ? "#94a3b8" : "#4a4a6a"} tick={{ fontSize: 11, fill: isLightMode ? "#64748b" : "#6b7280" }} />
              <Tooltip contentStyle={{ backgroundColor: isLightMode ? "#ffffff" : "#1a1a2e", border: isLightMode ? "1px solid #e2e8f0" : "1px solid #2e2e50", borderRadius: 8, color: isLightMode ? "#0f172a" : "#fff" }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Acções Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(isTeacher ? teacherQuickActions : adminQuickActions).map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 p-4 border border-gray-800 bg-gray-900 transition-all hover:border-gray-700 group ${action.color}`}
            >
              <div className="flex h-10 w-10 items-center justify-center shrink-0">
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{action.label}</span>
              <ArrowRight className="h-4 w-4 ml-auto text-gray-600 group-hover:text-gray-300 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
