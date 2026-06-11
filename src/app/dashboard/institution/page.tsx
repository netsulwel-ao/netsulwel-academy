"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, onSnapshot } from "firebase/firestore";
import { Building2, Users, GraduationCap, DollarSign, TrendingUp, Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Institution } from "@/types/institution";
import type { Sale } from "@/types/settings";

export default function InstitutionOverviewPage() {
  const { user, institutionId } = useAuth();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTeachers: 0, totalStudents: 0, totalRevenue: 0, totalSales: 0 });

  useEffect(() => {
    if (!institutionId) return;
    const unsub = onSnapshot(doc(db, "institutions", institutionId), snap => {
      if (snap.exists()) {
        setInstitution({ id: snap.id, ...snap.data() } as Institution);
      }
    });
    return () => unsub();
  }, [institutionId]);

  useEffect(() => {
    if (!user || !institutionId) return;
    loadData();
  }, [user, institutionId]);

  const loadData = async () => {
    try {
      const membersQuery = query(
        collection(db, "users"),
        where("institutionId", "==", institutionId),
        orderBy("createdAt", "desc")
      );
      const membersSnap = await getDocs(membersQuery);
      const membersData: any[] = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembers(membersData);

      const teachers = membersData.filter(m => m.institutionRole === "teacher").length;
      const students = membersData.filter(m => m.institutionRole === "student").length;

      const salesQuery = query(
        collection(db, "sales"),
        where("sellerId", "==", institutionId),
        where("status", "==", "confirmed"),
        orderBy("createdAt", "desc")
      );
      const salesSnap = await getDocs(salesQuery);
      const salesData = salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
      setSales(salesData);

      const totalRevenue = salesData.reduce((sum, s) => sum + (s.netAmount || s.amount), 0);
      setStats({ totalTeachers: teachers, totalStudents: students, totalRevenue, totalSales: salesData.length });
    } catch (error) {
      console.error("Error loading institution data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatKz = (v: number) => v.toLocaleString("pt-AO") + " Kz";

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-64 bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-gray-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (institution?.status !== "approved") {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-in fade-in duration-500">
        <div className="relative inline-flex mb-6">
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
          <Building2 className="h-20 w-20 text-purple-400 relative" />
        </div>
        {institution?.status === "pending" ? (
          <>
            <h2 className="text-3xl font-bold text-white mb-3">Instituição Pendente</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              A tua instituição ainda está a aguardar aprovação pela administração. Receberás uma notificação assim que for aprovada.
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-bold border border-yellow-500/20">
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
              Pendente
            </span>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-white mb-3">Instituição Suspensa</h2>
            <p className="text-gray-400 mb-8">Contacta a administração para mais informações.</p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 rounded-full text-sm font-bold border border-red-500/20">
              Suspensa
            </span>
          </>
        )}
      </div>
    );
  }

  const statsConfig = [
    { icon: GraduationCap, label: "Professores", value: stats.totalTeachers, color: "from-purple-500 to-purple-300", bg: "bg-purple-500/10" },
    { icon: Users, label: "Alunos", value: stats.totalStudents, color: "from-blue-500 to-blue-300", bg: "bg-blue-500/10" },
    { icon: DollarSign, label: "Receita Líquida", value: formatKz(stats.totalRevenue), color: "from-green-500 to-green-300", bg: "bg-green-500/10" },
    { icon: TrendingUp, label: "Vendas", value: stats.totalSales, color: "from-yellow-500 to-yellow-300", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="max-w-[100rem] space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{institution?.name}</h1>
              <p className="text-sm sm:text-base text-gray-400">Visão geral da tua instituição</p>
            </div>
          </div>
          <Link
            href="/dashboard/institution/members"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 sm:px-6 sm:py-3 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25 text-sm sm:text-base"
          >
            <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
            Convidar Membros
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {statsConfig.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6 hover:border-purple/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl rounded-full" style={{ backgroundImage: `linear-gradient(to bottom right, ${stat.color.replace("from-", "").split(" ")[0]}, transparent)` }} />
            <div className="relative">
              <div className={`inline-flex p-3 rounded-lg ${stat.bg} mb-3`}>
                <stat.icon className={`h-6 w-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
              </div>
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 overflow-hidden hover:border-purple/20 transition-colors">
          <div className="p-4 sm:p-6 border-b border-gray-800/70 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">Membros Recentes</h2>
            </div>
            <Link href="/dashboard/institution/members" className="group flex items-center gap-1 text-xs sm:text-sm text-purple-400 hover:text-purple-300 font-bold transition-colors">
              Ver todos
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {members.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-4">Ainda não tens membros.</p>
              <Link href="/dashboard/institution/members" className="inline-flex items-center gap-2 text-sm bg-purple hover:bg-purple-light text-white px-4 py-2 rounded-lg font-bold transition-all">
                Convidar primeiro membro
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center text-purple-400 font-bold text-sm border border-purple-500/10">
                      {member.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{member.name || "Sem nome"}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                    member.institutionRole === "teacher" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                    member.institutionRole === "admin" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {member.institutionRole === "teacher" ? "Professor" :
                     member.institutionRole === "admin" ? "Admin" : "Aluno"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales */}
        <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 overflow-hidden hover:border-purple/20 transition-colors">
          <div className="p-4 sm:p-6 border-b border-gray-800/70 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">Vendas Recentes</h2>
            </div>
            <Link href="/dashboard/wallet" className="group flex items-center gap-1 text-xs sm:text-sm text-purple-400 hover:text-purple-300 font-bold transition-colors">
              Ver carteira
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {sales.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-gray-400">Ainda não tens vendas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-medium text-white text-sm">{sale.itemTitle || sale.type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sale.userName}</p>
                  </div>
                  <p className="font-bold text-white text-sm">{formatKz(sale.netAmount || sale.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
