"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { BookOpen, Users, DollarSign, TrendingUp, Video, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/types/course";
import type { Sale } from "@/types/settings";

export default function TeacherDashboardPage() {
  const { user, isTeacher } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCourses: 0, totalSales: 0, totalRevenue: 0, totalStudents: 0 });

  useEffect(() => {
    if (!user || !isTeacher) return;
    loadData();
  }, [user, isTeacher]);

  const loadData = async () => {
    try {
      // Load teacher's courses
      const coursesQuery = query(
        collection(db, "courses"),
        where("createdBy", "==", user!.uid),
        orderBy("createdAt", "desc")
      );
      const coursesSnap = await getDocs(coursesQuery);
      const coursesData = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      setCourses(coursesData);

      // Load teacher's sales
      const salesQuery = query(
        collection(db, "sales"),
        where("sellerId", "==", user!.uid),
        where("status", "==", "confirmed"),
        orderBy("createdAt", "desc")
      );
      const salesSnap = await getDocs(salesQuery);
      const salesData = salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
      setSales(salesData);

      // Calculate stats
      const totalRevenue = salesData.reduce((sum, s) => sum + s.amount, 0);
      const totalNetRevenue = salesData.reduce((sum, s) => sum + (s.netAmount || s.amount), 0);
      const uniqueStudents = new Set(salesData.map(s => s.userId)).size;

      setStats({
        totalCourses: coursesData.length,
        totalSales: salesData.length,
        totalRevenue: totalNetRevenue,
        totalStudents: uniqueStudents
      });
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatKz = (v: number) => v.toLocaleString("pt-AO") + " Kz";

  if (!isTeacher) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        <div className="text-center py-20">
          <p className="text-gray-400">Acesso não autorizado. Esta página é apenas para professores.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Painel do Professor</h1>
          <p className="mt-1 text-gray-400">Gere os teus cursos e vê o teu desempenho.</p>
        </div>
        <Link
          href="/dashboard/teacher/courses/new"
          className="inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-3 font-bold transition-colors"
        >
          <Plus className="h-5 w-5" />
          Novo Curso
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-6 w-6 text-purple-400" />
            <p className="text-sm text-gray-400">Cursos</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalCourses}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-6 w-6 text-blue-400" />
            <p className="text-sm text-gray-400">Alunos</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-6 w-6 text-green-400" />
            <p className="text-sm text-gray-400">Receita Líquida</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatKz(stats.totalRevenue)}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-yellow-400" />
            <p className="text-sm text-gray-400">Vendas</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalSales}</p>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-gray-900/40 border border-gray-800">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Cursos Recentes</h2>
          <Link href="/dashboard/teacher/courses" className="text-sm text-purple hover:text-purple-light">Ver todos</Link>
        </div>
        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Ainda não criaste nenhum curso.</p>
            <Link href="/dashboard/teacher/courses/new" className="mt-4 inline-flex items-center gap-2 text-sm text-purple hover:text-purple-light font-bold">
              Criar primeiro curso
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {courses.slice(0, 5).map((course) => (
              <Link key={course.id} href={`/dashboard/teacher/courses/${course.id}/edit`} className="block p-6 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-gray-800 overflow-hidden">
                    {course.thumbnail && (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{course.title}</h3>
                    <p className="text-sm text-gray-400">{course.lessonsCount} aulas • {formatKz(course.price)}</p>
                  </div>
                  <div className={`px-3 py-1 text-xs font-bold rounded ${
                    course.status === "published" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {course.status === "published" ? "Publicado" : "Rascunho"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div className="bg-gray-900/40 border border-gray-800">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Vendas Recentes</h2>
          <Link href="/dashboard/wallet" className="text-sm text-purple hover:text-purple-light">Ver carteira</Link>
        </div>
        {sales.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Ainda não tens vendas.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{sale.itemTitle || sale.type}</p>
                  <p className="text-sm text-gray-400">{sale.userName}</p>
                </div>
                <p className="font-bold text-white">{formatKz(sale.netAmount || sale.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
