"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs,
} from "firebase/firestore";
import {
  Users, Loader2, Search, X, ExternalLink, BookOpen, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { Avatar } from "@/components/ui/Avatar";
import type { Course } from "@/types/course";

interface StudentEntry {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  courses: string[];         // títulos dos cursos inscritos deste professor
}

// ── Helper: normalizar timestamp ─────────────────────────────
function toMs(d: unknown): number {
  if (!d) return 0;
  if (typeof d === "object" && "toMillis" in (d as object))
    return (d as { toMillis: () => number }).toMillis();
  if (typeof d === "number") return d;
  return 0;
}

export default function TeacherStudentsPage() {
  const { user, isTeacher } = useAuth();
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || !isTeacher) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        // 1. Cursos do professor
        const coursesSnap = await getDocs(
          query(collection(db, "courses"), where("createdBy", "==", user.uid))
        );
        const teacherCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        const courseIds = teacherCourses.map(c => c.id).filter(Boolean) as string[];

        if (courseIds.length === 0) {
          if (!cancelled) { setStudents([]); }
          return;
        }

        // 2. Utilizadores inscritos nos cursos do professor
        //    array-contains-any tem limite de 10 — processar em batches
        const studentMap = new Map<string, StudentEntry>();

        const chunks: string[][] = [];
        for (let i = 0; i < courseIds.length; i += 10) chunks.push(courseIds.slice(i, i + 10));

        await Promise.all(
          chunks.map(async chunk => {
            const usersSnap = await getDocs(
              query(
                collection(db, "users"),
                where("enrolledCourses", "array-contains-any", chunk)
              )
            );
            usersSnap.forEach(d => {
              const data = d.data();
              const enrolled: string[] = data.enrolledCourses ?? [];
              // Quais cursos deste professor o aluno tem
              const myCourses = chunk
                .filter(cId => enrolled.includes(cId))
                .map(cId => teacherCourses.find(c => c.id === cId)?.title ?? "");

              if (myCourses.length === 0) return;

              const existing = studentMap.get(d.id);
              if (existing) {
                // Adicionar cursos não duplicados
                myCourses.forEach(t => {
                  if (!existing.courses.includes(t)) existing.courses.push(t);
                });
              } else {
                studentMap.set(d.id, {
                  uid:      d.id,
                  name:     data.name ?? data.displayName ?? "Aluno",
                  email:    data.email ?? "",
                  photoURL: data.photoURL ?? undefined,
                  courses:  myCourses.filter(Boolean),
                });
              }
            });
          })
        );

        // 3. Também incluir alunos de vendas confirmadas (standalone comprado)
        const salesSnap = await getDocs(
          query(
            collection(db, "sales"),
            where("sellerId", "==", user.uid),
            where("status", "==", "confirmed")
          )
        );
        salesSnap.forEach(d => {
          const data = d.data();
          const uid = data.userId as string;
          if (!uid) return;
          const title = data.itemTitle ?? "";
          const existing = studentMap.get(uid);
          if (existing) {
            if (title && !existing.courses.includes(title)) existing.courses.push(title);
          } else {
            studentMap.set(uid, {
              uid,
              name:   data.userName  ?? "Aluno",
              email:  data.userEmail ?? "",
              courses: title ? [title] : [],
            });
          }
        });

        if (!cancelled) {
          setStudents(Array.from(studentMap.values()));
        }
      } catch (err) {
        logger.error("TeacherStudents: failed to load", err);
        if (!cancelled) setError("Não foi possível carregar os alunos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  if (!isTeacher) return null;

  return (
    <div className="max-w-[80rem] mx-auto space-y-6 animate-in fade-in duration-300">

      {/* Cabeçalho */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-green mb-2">
          // alunos
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Alunos</h1>
        <p className="mt-1 text-sm text-gray-600">
          {loading
            ? "A carregar..."
            : `${students.length} aluno${students.length !== 1 ? "s" : ""} · ${students.reduce((acc, s) => acc + s.courses.length, 0)} inscrições`
          }
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={1.5} />
          <p className="text-sm text-amber-400">{error}</p>
        </div>
      )}

      {/* Pesquisa */}
      {!loading && students.length > 0 && (
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className="w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-8 text-sm text-gray-200 focus:border-green focus:outline-none transition-colors"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-400 transition-colors"
              aria-label="Limpar pesquisa">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* Empty state */}
      {!loading && students.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <Users className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// sem alunos</p>
          <p className="text-sm text-gray-600 mb-5">
            Ainda não tens alunos inscritos nos teus cursos.
          </p>
          <Link
            href="/dashboard/teacher/courses"
            className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-colors"
          >
            <BookOpen className="h-3 w-3" strokeWidth={1.5} /> Ver cursos
          </Link>
        </div>
      )}

      {/* Sem resultados de pesquisa */}
      {!loading && students.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-12 text-center">
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// sem resultados</p>
          <p className="text-sm text-gray-600">
            Nenhum aluno com &ldquo;{search}&rdquo;.
          </p>
        </div>
      )}

      {/* Lista */}
      {!loading && filtered.length > 0 && (
        <div className="border border-gray-800 divide-y divide-gray-800">
          {filtered.map(student => (
            <div
              key={student.uid}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-900 transition-colors"
            >
              {/* Avatar com Identicon */}
              <div className="h-10 w-10 shrink-0 overflow-hidden border border-gray-800">
                <Avatar uid={student.uid} photoURL={student.photoURL} name={student.name} size={40} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate">{student.name}</p>
                <p className="text-sm text-gray-600 truncate">{student.email || "Sem email"}</p>

                {/* Cursos inscritos */}
                {student.courses.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {student.courses.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="font-mono text-[13px] uppercase tracking-widest border border-gray-800 bg-gray-900 px-2 py-0.5 text-gray-600"
                      >
                        {c}
                      </span>
                    ))}
                    {student.courses.length > 3 && (
                      <span className="font-mono text-[13px] text-gray-700">
                        +{student.courses.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Acções */}
              <Link
                href={`/dashboard/professores/${student.uid}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-all"
                title="Ver perfil"
                aria-label={`Ver perfil de ${student.name}`}
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
