"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { Layers, BookOpen, Radio, Loader2, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import type { Trail, CourseType } from "@/types/course";

export default function TrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrails = async () => {
      try {
        const q = query(
          collection(db, "trails"),
          where("status", "==", "published"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setTrails(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trail)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrails();
  }, []);

  return (
    <div className="max-w-[100rem] mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <Layers className="h-10 w-10 text-purple" />
          Trilhas de Aprendizagem
        </h1>
        <p className="mt-2 text-gray-400">
          Percursos organizados que combinam cursos e aulas ao vivo para uma experiência completa.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
        </div>
      )}

      {!loading && trails.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-900/40 text-center">
          <Layers className="h-16 w-16 text-gray-700 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Nenhuma trilha disponível</h2>
          <p className="text-gray-400 max-w-md">
            Em breve serão publicadas trilhas de aprendizagem para te ajudar a evoluir.
          </p>
        </div>
      )}

      {!loading && trails.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trails.map((trail) => (
            <Link
              key={trail.id}
              href={`/dashboard/trails/${trail.id}`}
              className="group flex flex-col bg-gray-900/40 backdrop-blur-xl overflow-hidden hover:bg-gray-900/60 transition-all"
            >
              <div className="relative h-44 bg-gray-800 overflow-hidden">
                {trail.thumbnail ? (
                  <img src={trail.thumbnail} alt={trail.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/40 to-gray-900">
                    <Layers className="h-14 w-14 text-purple/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${
                    trail.type === "golden" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"
                    : trail.type === "smart" ? "bg-green-500/15 text-green-400 border-green-500/25"
                    : "bg-blue-500/15 text-blue-400 border-blue-500/25"
                  }`}>
                    {trail.type === "golden" ? "Golden" : trail.type === "smart" ? "Smart" : "Avulso"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col flex-1 p-5">
                <h3 className="font-bold text-white text-lg leading-snug">{trail.title}</h3>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2 flex-1">{trail.description || "Sem descrição."}</p>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{trail.coursesCount ?? 0} cursos</span>
                  <span className="flex items-center gap-1"><Radio className="h-4 w-4" />{trail.livesCount ?? 0} aulas</span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-4">
                  <span className="text-sm capitalize text-gray-500">{trail.level === "beginner" ? "Iniciante" : trail.level === "intermediate" ? "Intermédio" : "Avançado"}</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-purple group-hover:text-purple-light transition-colors">
                    Ver trilha <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
