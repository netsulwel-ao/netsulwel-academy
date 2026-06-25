"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Search, GraduationCap, BookOpen, Radio, Loader2, ArrowLeft, X, Users } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface TeacherProfile {
  id: string;
  name: string;
  photoURL?: string;
  role: string;
  courseCount: number;
  liveCount: number;
}

export default function ProfessoresPage() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<TeacherProfile[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "in", ["teacher", "institution"]),
          limit(100)
        );
        const snap = await getDocs(q);
        const ids = snap.docs.map(d => d.id);

        const [coursesSnap, livesSnap] = await Promise.all([
          ids.length > 0 ? getDocs(query(collection(db, "courses"), where("createdBy", "in", ids.slice(0, 30)), where("status", "==", "published"))) : Promise.resolve({ docs: [] } as any),
          ids.length > 0 ? getDocs(query(collection(db, "lives"), where("createdBy", "in", ids.slice(0, 30)))) : Promise.resolve({ docs: [] } as any),
        ]);

        const courseCounts: Record<string, number> = {};
        coursesSnap.docs.forEach((d: { data: () => Record<string, unknown>; id: string }) => { const c = d.data().createdBy as string | undefined; if (c) courseCounts[c] = (courseCounts[c] || 0) + 1; });
        const liveCounts: Record<string, number> = {};
        livesSnap.docs.forEach((d: { data: () => Record<string, unknown>; id: string }) => { const c = d.data().createdBy as string | undefined; if (c) liveCounts[c] = (liveCounts[c] || 0) + 1; });

        setTeachers(snap.docs.map(d => ({
          id: d.id,
          name: d.data().name || "Utilizador",
          photoURL: d.data().photoURL || "",
          role: d.data().role || "teacher",
          courseCount: courseCounts[d.id] || 0,
          liveCount: liveCounts[d.id] || 0,
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (value.trim().length < 2) { setResults([]); setShowDropdown(false); return; }
    const q = value.toLowerCase();
    setResults(teachers.filter(t => t.name.toLowerCase().includes(q)).slice(0, 8));
    setShowDropdown(true);
  }, [teachers]);

  const filtered = search.trim().length >= 2
    ? teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : teachers;

  return (
    <>
      <Header />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="h-4 w-4" />Voltar
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Todos os <span className="text-purple">Professores</span>
            </h1>
            <p className="mt-2 text-gray-400">
              {loading ? "..." : `${teachers.length} professores e instituições`}
            </p>
          </div>

          {/* Search */}
          <div ref={searchRef} className="relative max-w-xl mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Pesquisar por nome..."
              className="w-full bg-gray-900 border border-gray-800 focus:border-purple/50 py-3.5 pl-12 pr-10 text-white placeholder-gray-600 text-base focus:outline-none transition-all" />
            {search && (
              <button onClick={() => { setSearch(""); setShowDropdown(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
            {showDropdown && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-800 shadow-2xl z-50">
                {results.map((t) => (
                  <Link key={t.id} href={`/profile/${t.id}`}
                    onClick={() => { setShowDropdown(false); setSearch(""); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors">
                    {t.photoURL ? (
                      <img src={t.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-300">{t.name[0] || "?"}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role === "institution" ? "Instituição" : "Professor"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="h-16 w-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum professor encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((t) => (
                <Link key={t.id} href={`/profile/${t.id}`}
                  className="group bg-gray-900/40 border border-gray-800/60 hover:border-purple/30 p-6 transition-all duration-300 text-center">
                  {t.photoURL ? (
                    <img src={t.photoURL} alt="" className="h-20 w-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all" />
                  ) : (
                    <div className="h-20 w-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-purple-500/30 to-purple-700/30 flex items-center justify-center ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all">
                      <span className="text-2xl font-bold text-purple-300">{t.name[0]?.toUpperCase() || "?"}</span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate">{t.name}</h3>
                  <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 border ${
                    t.role === "institution" ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" : "bg-green-500/15 text-green-400 border-green-500/25"
                  }`}>
                    {t.role === "institution" ? "Instituição" : "Professor"}
                  </span>
                  <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{t.courseCount}</span>
                    <span className="flex items-center gap-1"><Radio className="h-4 w-4" />{t.liveCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
