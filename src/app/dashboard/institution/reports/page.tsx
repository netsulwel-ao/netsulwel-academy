"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { BarChart3, Users, GraduationCap, DollarSign, Loader2, BookOpen } from "lucide-react";

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
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;
  }

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Relatórios</h1>
        <p className="mt-2 text-gray-400">Métricas e estatísticas da instituição.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-6 w-6 text-blue-400" />
            <p className="text-sm text-gray-400">Alunos</p>
          </div>
          <p className="text-3xl font-bold text-white">{data.totalStudents}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-6 w-6 text-emerald-400" />
            <p className="text-sm text-gray-400">Professores</p>
          </div>
          <p className="text-3xl font-bold text-white">{data.totalTeachers}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-6 w-6 text-purple-400" />
            <p className="text-sm text-gray-400">Cursos</p>
          </div>
          <p className="text-3xl font-bold text-white">{data.totalCourses}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-6 w-6 text-yellow-400" />
            <p className="text-sm text-gray-400">Receita</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatKz(data.totalRevenue)}</p>
        </div>
      </div>

      {data.recentSales.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">Vendas Recentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 font-medium">Produto</th>
                  <th className="py-4 px-6 font-medium">Cliente</th>
                  <th className="py-4 px-6 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.recentSales.map((sale: any) => (
                  <tr key={sale.id}>
                    <td className="py-4 px-6 text-sm text-white">{sale.itemTitle || sale.type}</td>
                    <td className="py-4 px-6 text-sm text-gray-400">{sale.userName}</td>
                    <td className="py-4 px-6 text-sm font-bold text-white">{formatKz(sale.netAmount || sale.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}