"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { DollarSign, TrendingUp, ArrowDown, ArrowUp, Calendar, Loader2, CreditCard } from "lucide-react";
import type { Sale } from "@/types/settings";

export default function WalletPage() {
  const { user, isTeacher, isInstitution } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalFees, setTotalFees] = useState(0);

  useEffect(() => {
    const loadWallet = async () => {
      if (!user) return;
      try {
        // Get user profile to check if they're a teacher or institution admin
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }
        
        const userData = userSnap.data();
        const isContentCreator = userData.role === "teacher" || userData.role === "institution";
        
        if (!isContentCreator) {
          setLoading(false);
          return;
        }

        // Fetch sales for this content creator
        const salesQuery = query(
          collection(db, "sales"),
          where("sellerId", "==", user.uid),
          where("status", "==", "confirmed"),
          orderBy("createdAt", "desc")
        );
        
        const salesSnap = await getDocs(salesQuery);
        const salesData = salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
        setSales(salesData);

        // Calculate totals
        const total = salesData.reduce((sum, s) => sum + s.amount, 0);
        const fees = salesData.reduce((sum, s) => sum + (s.fee || 0), 0);
        const net = salesData.reduce((sum, s) => sum + (s.netAmount || s.amount), 0);
        
        setTotalSales(total);
        setTotalFees(fees);
        setBalance(net);
      } catch (error) {
        console.error("Error loading wallet:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, [user]);

  const formatKz = (v: number) => v.toLocaleString("pt-AO") + " Kz";
  const formatDate = (ts: unknown) => {
    const d = (ts as { toDate?: () => Date })?.toDate?.();
    if (!d) return "—";
    return d.toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (!isTeacher && !isInstitution) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        <div className="text-center py-20">
          <CreditCard className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Carteira não disponível</h1>
          <p className="text-gray-400">A carteira está disponível apenas para professores e instituições.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Minha Carteira</h1>
        <p className="mt-1 text-gray-400">Gere os teus ganhos e vê o histórico de vendas.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-6 w-6 text-green-400" />
            <p className="text-sm text-gray-400">Saldo Líquido</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatKz(balance)}</p>
          <p className="text-xs text-gray-500 mt-1">Após dedução de taxas</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-blue-400" />
            <p className="text-sm text-gray-400">Total de Vendas</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatKz(totalSales)}</p>
          <p className="text-xs text-gray-500 mt-1">Valor bruto das vendas</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDown className="h-6 w-6 text-red-400" />
            <p className="text-sm text-gray-400">Taxas Deduzidas</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatKz(totalFees)}</p>
          <p className="text-xs text-gray-500 mt-1">Taxas da plataforma</p>
        </div>
      </div>

      {/* Sales History */}
      <div className="bg-gray-900/40 border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Histórico de Vendas</h2>
        </div>
        {sales.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">Ainda não tens vendas confirmadas.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {sales.map((sale) => (
              <div key={sale.id} className="p-6 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">{formatDate(sale.createdAt)}</span>
                  </div>
                  <p className="font-medium text-white">{sale.itemTitle || sale.type}</p>
                  <p className="text-sm text-gray-400">{sale.userName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{formatKz(sale.netAmount || sale.amount)}</p>
                  <p className="text-xs text-gray-500">Bruto: {formatKz(sale.amount)} | Taxa: {formatKz(sale.fee || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
