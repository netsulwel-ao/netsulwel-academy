"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import {
  Lock, BookOpen, Clock, Award, Search, Filter,
  Loader2, Play, ChevronRight, Star,
} from "lucide-react";
import Link from "next/link";
import type { Course, CourseType, CourseCategory } from "@/types/course";

const TYPE_BADGE: Record<CourseType, { label: string; color: string }> = {
  standalone: { label: "Avulso", color: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  smart: { label: "Smart", color: "bg-green-500/15 text-green-400 border-green-500/25" },
  golden: { label: "Golden", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
};

const DEFAULT_BADGE = TYPE_BADGE.standalone;

function normalizeCourseType(type: unknown): CourseType {
  if (type === "standalone" || type === "smart" || type === "golden") return type;
  return "standalone";
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermédio",
  advanced: "Avançado",
};

const CAT_LABEL: Record<CourseCategory, string> = {
  tech: "Tecnologia",
  finance: "Finanças",
  investments: "Investimentos",
  other: "Outro",
};

export default function CourseCatalogPage() {
  const { user } = useAuth();
  const { canAccessCourse, requiredPlanLabel } = useAccess();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<CourseCategory | "all">("all");
  const [filterType, setFilterType] = useState<CourseType | "all">("all");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError(null);
        // Só cursos publicados — tem de bater com firestore.rules (alunos não podem listar rascunhos).
        const q = query(
          collection(db, "courses"),
          where("status", "==", "published"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
        setCourses(all);

        // Cursos comprados pelo user
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setEnrolledCourses(userDoc.data().enrolledCourses ?? []);
          }
        }
      } catch (err) {
        console.error(err);
        setLoadError(
          "Não foi possível carregar o catálogo. Se acabaste de publicar cursos, confirma no Firebase que existe um índice composto: status + createdAt."
        );
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (filterCat !== "all" && c.category !== filterCat) return false;
      if (filterType !== "all" && c.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [courses, filterCat, filterType, search]);

  const accessible = filtered.filter((c) => canAccessCourse(normalizeCourseType(c.type), c.id!, enrolledCourses, c.price));
  const locked = filtered.filter((c) => !canAccessCourse(normalizeCourseType(c.type), c.id!, enrolledCourses, c.price));

  return (
    <div className="max-w-[100rem] mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Catálogo de Cursos</h1>
        <p className="mt-1 text-gray-400">{loading ? "A carregar..." : `${courses.length} cursos disponíveis`}</p>
      </div>

      {loadError && (
        <div className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-base text-amber-200">
          {loadError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar cursos..."
            className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-600 text-base focus:outline-none transition-all" />
        </div>

        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value as CourseCategory | "all")}
          className="bg-gray-900 border border-gray-800 text-gray-300 text-base py-2.5 px-4 focus:outline-none appearance-none cursor-pointer">
          <option value="all">Todas as categorias</option>
          {Object.entries(CAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select value={filterType} onChange={(e) => setFilterType(e.target.value as CourseType | "all")}
          className="bg-gray-900 border border-gray-800 text-gray-300 text-base py-2.5 px-4 focus:outline-none appearance-none cursor-pointer">
          <option value="all">Todos os planos</option>
          <option value="standalone">Avulso</option>
          <option value="smart">Smart</option>
          <option value="golden">Golden</option>
        </select>
      </div>

      {loading && <div className="flex items-center justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/40 text-center">
          <BookOpen className="h-12 w-12 text-gray-700 mb-3" />
          <p className="text-gray-400">Nenhum curso encontrado.</p>
        </div>
      )}

      {/* Accessible courses */}
      {!loading && accessible.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Play className="h-6 w-6 text-green-400" /> Disponíveis para ti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {accessible.map((course) => (
              <CourseCard key={course.id} course={course} locked={false} enrolledCourses={enrolledCourses} />
            ))}
          </div>
        </div>
      )}

      {/* Locked courses */}
      {!loading && locked.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="h-6 w-6 text-gray-500" /> Requer upgrade
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {locked.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                locked={true}
                enrolledCourses={enrolledCourses}
                requiredPlan={requiredPlanLabel(normalizeCourseType(course.type))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Course Card ───────────────────────────────────────────
function CourseCard({
  course, locked, enrolledCourses, requiredPlan,
}: {
  course: Course;
  locked: boolean;
  enrolledCourses: string[];
  requiredPlan?: string;
}) {
  const normalizedType = normalizeCourseType(course.type);
  const badge = TYPE_BADGE[normalizedType] ?? DEFAULT_BADGE;

  return (
    <Link href={`/dashboard/courses/${course.id}`}
      className={`group flex flex-col bg-gray-900/40 backdrop-blur-xl overflow-hidden transition-all hover:bg-gray-900/60 ${locked ? "opacity-80 hover:opacity-100" : ""}`}>

      {/* Thumbnail */}
      <div className="relative h-44 bg-gray-800 overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900/40 to-gray-900">
            <BookOpen className="h-12 w-12 text-blue-500/40" />
          </div>
        )}

        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 bg-gray-950/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center bg-gray-900/80 border border-gray-700">
                <Lock className="h-6 w-6 text-gray-300" />
              </div>
              {requiredPlan && (
                <span className="text-sm font-bold text-white bg-gray-900/80 px-3 py-1 border border-gray-700">
                  {requiredPlan}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Play button on hover (unlocked) */}
        {!locked && (
          <div className="absolute inset-0 bg-gray-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center bg-blue-600 rounded-full shadow-lg shadow-blue-500/30">
              <Play className="h-6 w-6 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 text-sm font-bold uppercase tracking-wider border ${badge.color}`}>
            {badge.label}
          </span>
          {course.hasCertificate && (
            <span className="px-2.5 py-1 text-sm font-bold uppercase tracking-wider border bg-amber-500/15 text-amber-400 border-amber-500/25 flex items-center gap-1">
              <Award className="h-4 w-4" /> Cert.
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-bold text-white text-lg leading-snug line-clamp-2">{course.title}</h3>
        <p className="mt-2 text-base text-gray-400 line-clamp-2 flex-1">{course.description}</p>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{course.modulesCount ?? 0} módulos</span>
          <span className="flex items-center gap-1"><Play className="h-4 w-4" />{course.lessonsCount ?? 0} aulas</span>
          {course.level && <span className="capitalize">{LEVEL_LABEL[course.level] ?? course.level}</span>}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-4">
          {normalizedType === "standalone" && !enrolledCourses.includes(course.id!) ? (
            <span className="text-base font-bold text-white">
              {course.price ? `${course.price.toLocaleString("pt-AO")} Kz` : "Gratuito"}
            </span>
          ) : (
            <span className="text-sm text-gray-500">{LEVEL_LABEL[course.level] ?? ""}</span>
          )}
          <span className={`flex items-center gap-1 text-base font-medium transition-colors ${locked ? "text-gray-500" : "text-blue-400 group-hover:text-blue-300"}`}>
            {locked ? <><Lock className="h-4 w-4" /> Bloqueado</> : <><ChevronRight className="h-5 w-5" /> Ver curso</>}
          </span>
        </div>
      </div>
    </Link>
  );
}
