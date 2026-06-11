"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { BarChart3, Users, GraduationCap, DollarSign, Loader2, BookOpen, Calendar } from "lucide-react";

export default function InstitutionReportsPage() {
  const { institutionId } = useAuth();
  const [data, setData] = useState({ totalStudents: 0, totalTeachers: 0, totalCourses: 0, totalSales: 0, totalRevenue: 0, recentSales: [] as any[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institutionId) return;
    loadReports();
  }, [institutionId]);

  const loadReports = async () => {
    try {
      const membersSnap = await getDocs(query(collection(db, "users"), where("institutionId", "==", institutionId)));
      const members = membersSnap.docs.map(d => d.data());
      const totalStudents = members.filter(m => m.institutionRole === "student").length;
      const totalTeachers = members.filter(m => m.institutionRole === "teacher").length;

      const teacherIds = members.filter(m => m.institutionRole === "teacher").map(m => m.id || m.uid);
      let totalCourses = 0;
      if (teacherIds.length > 0) {
        const coursesSnap = await getDocs(query(collection(db, "courses"), where("createdBy", "in", teacherIds)));
        totalCourses = coursesSnap.size;
      }

      const salesSnap = await getDocs(query(collection(db, "sales"), where("sellerId", "==", institutionId), where("status", "==", "confirmed")));
      const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.netAmount || s.amount || 0), 0);

      setData({ totalStudents, totalTeachers, totalCourses, totalSales: sales.length, totalRevenue, recentSales: sales.slice(0, 10) });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatKz = (v: number) => v.toLocaleString("pt-AO") + " Kz";

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const statsConfig = [
    { icon: Users, label: "Alunos", value: data.totalStudents, color: "from-blue-500 to-blue-300", bg: "bg-blue-500/10" },
    { icon: GraduationCap, label: "Professores", value: data.totalTeachers, color: "from-emerald-500 to-emerald-300", bg: "bg-emerald-500/10" },
    { icon: BookOpen, label: "Cursos", value: data.totalCourses, color: "from-purple-500 to-purple-300", bg: "bg-purple-500/10" },
    { icon: DollarSign, label: "Receita", value: formatKz(data.totalRevenue), color: "from-yellow-500 to-yellow-300", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="max-w-[100rem] space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-3xl rounded-full" />
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Relatórios</h1>
            <p className="text-sm sm:text-base text-gray-400">Métricas e estatísticas da instituição</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {statsConfig.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6 hover:border-purple/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl rounded-full" style={{ backgroundImage: `linear-gradient(to bottom right, ${stat.color.replace("from-", "").split(" ")[0]}, transparent)` }} />
            <div className="relative">
              <div className={`inline-flex p-3 rounded-lg ${stat.bg} mb-3`}>
                <stat.icon className="h-6 w-6" style={{ color: stat.color.includes("emerald") ? "#34d399" : stat.color.includes("blue") ? "#60a5fa" : stat.color.includes("yellow") ? "#fbbf24" : "#a78bfa" }} />
              </div>
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sales Table */}
      {data.recentSales.length > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 overflow-hidden hover:border-purple/20 transition-colors">
          <div className="p-4 sm:p-6 border-b border-gray-800/70">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">Vendas Recentes</h2>
              <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">{data.totalSales} vendas</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/70 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium">Produto</th>
                  <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium hidden sm:table-cell">Cliente</th>
                  <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium hidden md:table-cell">Data</th>
                  <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {data.recentSales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 sm:py-4 sm:px-6">
                      <span className="text-sm font-medium text-white">{sale.itemTitle || sale.type}</span>
                    </td>
                    <td className="py-3 px-4 sm:py-4 sm:px-6 text-sm text-gray-400 hidden sm:table-cell">{sale.userName || "—"}</td>
                    <td className="py-3 px-4 sm:py-4 sm:px-6 hidden md:table-cell">
                      <span className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {sale.createdAt?.toDate?.()?.toLocaleDateString("pt-PT") || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:py-4 sm:px-6 text-sm font-bold text-white text-right">{formatKz(sale.netAmount || sale.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.recentSales.length === 0 && (
        <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-8 sm:p-16 text-center">
          <div className="relative inline-flex mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-purple-500/10 blur-2xl rounded-full" />
            <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 relative" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Nenhuma venda ainda</h3>
          <p className="text-gray-400">As vendas aparecerão aqui assim que os alunos comprarem cursos.</p>
        </div>
      )}
    </div>
  );
}
