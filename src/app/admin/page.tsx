"use client";

import { useEffect, useState } from "react";
import { Users, Video, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function AdminDashboardPage() {
  const [studentsCount, setStudentsCount] = useState<number | null>(null);
  const [coursesCount, setCoursesCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchDashboardData = async () => {
      try {
        // Buscar Total de Alunos
        const usersRef = collection(db, "users");
        const qStudents = query(usersRef, where("role", "==", "aluno"));
        const studentsSnapshot = await getDocs(qStudents);
        if (!cancelled) setStudentsCount(studentsSnapshot.size);

        // Buscar Total de Cursos Publicados
        const coursesRef = collection(db, "courses");
        const coursesSnapshot = await getDocs(coursesRef);
        if (!cancelled) setCoursesCount(coursesSnapshot.size);
      } catch (error: any) {
        if (!cancelled && error?.code !== "permission-denied") {
          console.error("Erro ao carregar dados do dashboard:", error);
          setStudentsCount(0);
          setCoursesCount(0);
        }
      }
    };

    fetchDashboardData();
    return () => { cancelled = true; };
  }, []);

  // Formatador para o Kwanza Angolano
  const formatKz = (value: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(value);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Painel de Controlo</h1>
        <p className="mt-2 text-gray-400">Resumo geral da plataforma Netsulwel Academy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Alunos */}
        <div className="bg-gray-900/40 p-6 backdrop-blur-xl transition-all hover:bg-gray-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total de Alunos</p>
              <div className="mt-2 text-3xl font-bold text-white">
                {studentsCount === null ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                ) : (
                  studentsCount
                )}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Cursos Publicados */}
        <div className="bg-gray-900/40 p-6 backdrop-blur-xl transition-all hover:bg-gray-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Cursos Publicados</p>
              <div className="mt-2 text-3xl font-bold text-white">
                {coursesCount === null ? (
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                ) : (
                  coursesCount
                )}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-purple-500/10">
              <Video className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Receita (Mês) */}
        <div className="bg-gray-900/40 p-6 backdrop-blur-xl transition-all hover:bg-gray-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Receita (Mês)</p>
              <p className="mt-2 text-3xl font-bold text-white">{formatKz(0)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-green-500/10">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        {/* Acessos Hoje */}
        <div className="bg-gray-900/40 p-6 backdrop-blur-xl transition-all hover:bg-gray-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Acessos Hoje</p>
              <p className="mt-2 text-3xl font-bold text-white">0</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-amber-500/10">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-8 bg-gray-900/40 backdrop-blur-xl text-center">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
          <Video className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          {coursesCount === 0 ? "Ainda não tem cursos" : "Gerir Cursos"}
        </h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          {coursesCount === 0 
            ? "A plataforma está pronta. Comece por criar o seu primeiro curso para que os alunos possam começar a aprender." 
            : "Continue a expandir a sua plataforma criando novos conteúdos."}
        </p>
        <a href="/admin/courses/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-bold transition-colors">
          Criar {coursesCount === 0 ? 'o Primeiro ' : 'um Novo '} Curso
        </a>
      </div>
    </div>
  );
}
