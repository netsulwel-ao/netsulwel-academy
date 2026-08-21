"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Percent, DollarSign, Save, Loader2, Search, Filter } from "lucide-react";
import type { Course } from "@/types/course";

export default function AdminFeesPage() {
  const { isAdmin } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    loadCourses();
  }, [isAdmin]);

  const loadCourses = async () => {
    try {
      const coursesQuery = query(collection(db, "courses"), orderBy("createdAt", "desc"));
      const snap = await getDocs(coursesQuery);
      const coursesData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeChange = async (courseId: string, newFee: number) => {
    if (newFee < 0 || newFee > 100) return;
    setSaving(courseId);
    try {
      await updateDoc(doc(db, "courses", courseId), {
        feePercentage: newFee,
        updatedAt: new Date()
      });
      setCourses(courses.map(c => c.id === courseId ? { ...c, feePercentage: newFee } : c));
    } catch (error) {
      console.error("Error updating fee:", error);
    } finally {
      setSaving(null);
    }
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Acesso não autorizado.</p>
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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Gestão de Taxas</h1>
        <p className="mt-1 text-gray-400">Define as taxas da plataforma para cada curso.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Pesquisar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple"
        />
      </div>

      {/* Courses List */}
      <div className="bg-gray-900 border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Cursos</h2>
        </div>
        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">Nenhum curso encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredCourses.map((course) => (
              <div key={course.id} className="p-6 flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{course.title}</h3>
                  <p className="text-sm text-gray-400">{course.price.toLocaleString("pt-AO")} Kz</p>
                  {course.sellerId && (
                    <p className="text-sm text-gray-500">Vendedor: {course.sellerId}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-gray-500" />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={course.feePercentage ?? 10}
                        onChange={(e) => handleFeeChange(course.id!, parseFloat(e.target.value) || 0)}
                        disabled={saving === course.id}
                        className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-center focus:outline-none focus:border-purple disabled:opacity-50"
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                  </div>
                  {saving === course.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-purple" />
                  ) : (
                    <Save className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>Nota:</strong> A taxa é aplicada sobre o valor total da venda. O valor líquido (após taxa) é creditado na carteira do vendedor.
        </p>
      </div>
    </div>
  );
}
