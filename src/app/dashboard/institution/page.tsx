"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { Building2, Users, GraduationCap, DollarSign, TrendingUp, Loader2, Mail } from "lucide-react";
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
    if (!user || !institutionId) return;
    loadData();
  }, [user, institutionId]);

  const loadData = async () => {
    try {
      const institutionSnap = await getDoc(doc(db, "institutions", institutionId!));
      if (institutionSnap.exists()) {
        setInstitution({ id: institutionSnap.id, ...institutionSnap.data() } as Institution);
      }

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (institution?.status !== "approved") {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        {institution?.status === "pending" ? (
          <>
            <Building2 className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Instituição Pendente</h2>
            <p className="text-gray-400 mb-6">
              A tua instituição ainda está a aguardar aprovação pela administração.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-lg">Pendente</span>
          </>
        ) : (
          <>
            <Building2 className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Instituição Suspensa</h2>
            <p className="text-gray-400">Contacta a administração para mais informações.</p>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg mt-4">Suspensa</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{institution?.name}</h1>
          <p className="mt-1 text-gray-400">Visão geral da tua instituição.</p>
        </div>
        <Link
          href="/dashboard/institution/members"
          className="inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-3 font-bold transition-colors"
        >
          <Mail className="h-5 w-5" />
          Convidar
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-6 w-6 text-purple-400" />
            <p className="text-sm text-gray-400">Professores</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalTeachers}</p>
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

      <div className="bg-gray-900/40 border border-gray-800">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Membros Recentes</h2>
          <Link href="/dashboard/institution/members" className="text-sm text-purple hover:text-purple-light">Ver todos</Link>
        </div>
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Ainda não tens membros.</p>
            <Link href="/dashboard/institution/members" className="mt-4 inline-flex items-center gap-2 text-sm text-purple hover:text-purple-light font-bold">
              Convidar primeiro membro
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {members.slice(0, 5).map((member) => (
              <div key={member.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{member.name}</p>
                    <p className="text-sm text-gray-400">{member.email}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded ${
                  member.institutionRole === "teacher" ? "bg-purple-500/10 text-purple-400" :
                  member.institutionRole === "admin" ? "bg-green-500/10 text-green-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}>
                  {member.institutionRole === "teacher" ? "Professor" :
                   member.institutionRole === "admin" ? "Admin" : "Aluno"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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