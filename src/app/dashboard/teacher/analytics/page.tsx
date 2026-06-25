"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { TrendingUp, BookOpen, DollarSign, Users, Loader2, BarChart3, Radio } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/types/course";
import type { LiveSession } from "@/types/live";

interface Sale {
  id: string;
  amount: number;
  netAmount?: number;
  createdAt?: { toDate: () => Date };
  status: string;
  type: string;
  itemId?: string;
}

export default function TeacherAnalyticsPage() {
  const { user, isTeacher } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isTeacher) return;
    const load = async () => {
      try {
        const [coursesSnap, livesSnap, salesSnap] = await Promise.all([
          getDocs(query(collection(db, "courses"), where("createdBy", "==", user.uid), orderBy("createdAt", "desc"))),
          getDocs(query(collection(db, "lives"), where("createdBy", "==", user.uid), orderBy("createdAt", "desc"))),
          getDocs(query(collection(db, "sales"), where("sellerId", "==", user.uid), where("status", "==", "confirmed"), orderBy("createdAt", "desc"))),
        ]);
        setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
        setLives(livesSnap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSession)));
        setSales(salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isTeacher]);

  const totalRevenue = sales.reduce((sum, s) => sum + (s.netAmount || s.amount), 0);
  const totalSales = sales.length;
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.status === "published").length;
  const totalLives = lives.length;
  const liveSales = sales.filter(s => s.type === "live").length;
  const courseSales = sales.filter(s => s.type !== "live").length;
  const avgPrice = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

  // Sales by month (last 6 months)
  const monthMap = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" });
    monthMap.set(key, 0);
  }
  sales.forEach(s => {
    if (s.createdAt) {
      const d = s.createdAt.toDate();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      }
    }
  });

  const formatKz = (v: number) => v.toLocaleString("pt-AO") + " Kz";
  const maxVal = Math.max(...Array.from(monthMap.values()), 1);

  if (!isTeacher) {
    return <div className="text-center py-20"><p className="text-gray-400">Acesso não autorizado.</p></div>;
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-gray-400">Métricas de desempenho dos teus cursos</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-400" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gray-900/40 border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-green-400" />
                <span className="text-sm text-gray-400">Cursos</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalCourses}</p>
              <p className="text-xs text-gray-500 mt-1">{publishedCourses} publicado{publishedCourses !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-gray-900/40 border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="h-5 w-5 text-red-400" />
                <span className="text-sm text-gray-400">Lives</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalLives}</p>
              <p className="text-xs text-gray-500 mt-1">{liveSales} venda{liveSales !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-gray-900/40 border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span className="text-sm text-gray-400">Receita</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatKz(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{totalSales} venda{totalSales !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-gray-900/40 border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-400">Ticket Médio</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatKz(avgPrice)}</p>
            </div>
            <div className="bg-gray-900/40 border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Conversão</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalCourses > 0 ? Math.round((courseSales / totalCourses) * 100) : 0}%</p>
              <p className="text-xs text-gray-500 mt-1">vendas / curso</p>
            </div>
          </div>

          {/* Sales chart */}
          <div className="bg-gray-900/40 border border-gray-800 p-6">
            <h2 className="text-lg font-bold text-white mb-6">Vendas (últimos 6 meses)</h2>
            <div className="flex items-end gap-3 h-40">
              {Array.from(monthMap.entries()).map(([key, val]) => {
                const height = val > 0 ? Math.max((val / maxVal) * 100, 8) : 8;
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-xs text-gray-500 font-bold">{val}</span>
                    <div className="w-full bg-green-500/20 rounded-t relative group" style={{ height: `${height}%` }}>
                      <div className="absolute inset-0 bg-green-500/40 group-hover:bg-green-500/60 transition-colors rounded-t"></div>
                    </div>
                    <span className="text-[10px] text-gray-600">{key.split("-")[1]}/{key.split("-")[0].slice(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Course performance */}
          <div className="bg-gray-900/40 border border-gray-800">
            <div className="p-5 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Desempenho por Curso</h2>
            </div>
            {courses.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Nenhum curso criado.</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {courses.map(course => (
                  <div key={course.id} className="p-5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{course.title}</h3>
                      <p className="text-sm text-gray-500">{course.lessonsCount ?? 0} aulas</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-bold text-white">{formatKz(course.price)}</p>
                      <p className="text-xs text-gray-500">{course.status === "published" ? "Publicado" : "Rascunho"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live performance */}
          <div className="bg-gray-900/40 border border-gray-800">
            <div className="p-5 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="h-4 w-4 text-red-400" /> Desempenho por Live
              </h2>
            </div>
            {lives.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Nenhuma live criada.</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {lives.map(live => {
                  const liveSaleCount = sales.filter(s => s.itemId === live.id).length;
                  return (
                    <div key={live.id} className="p-5 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{live.title}</h3>
                        <p className="text-xs text-gray-500">
                          {live.target === "free" ? "Gratuita"
                            : live.target === "standalone" ? "Paga"
                            : live.target === "smart" ? "Smart"
                            : "Golden"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        {live.price ? (
                          <p className="font-bold text-white">{formatKz(live.price)}</p>
                        ) : (
                          <p className="text-sm text-green-400 font-medium">Grátis</p>
                        )}
                        <p className="text-xs text-gray-500">{liveSaleCount} venda{liveSaleCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
