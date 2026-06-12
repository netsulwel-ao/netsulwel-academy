"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { useTrack } from "@/hooks/useTrack";
import {
  Lock, BookOpen, Award, Search, X,
  Loader2, Play, ChevronRight, SlidersHorizontal, GraduationCap,
} from "lucide-react";
import Link from "next/link";
import type { Course, CourseType, CourseCategory, CourseLevel } from "@/types/course";

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

type SortKey = "recent" | "oldest" | "az" | "za" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigos" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
  { value: "price-asc", label: "Preço (menor → maior)" },
  { value: "price-desc", label: "Preço (maior → menor)" },
];

interface Filters {
  cat: CourseCategory | "all";
  type: CourseType | "all";
  level: CourseLevel | "all";
  price: "all" | "free" | "paid";
  certificate: boolean | null;
}

const DEFAULT_FILTERS: Filters = {
  cat: "all",
  type: "all",
  level: "all",
  price: "all",
  certificate: null,
};

const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermédio" },
  { value: "advanced", label: "Avançado" },
];

export default function CourseCatalogPage() {
  const { user, institutionId } = useAuth();
  const { canAccessCourse, requiredPlanLabel } = useAccess();
  const { track } = useTrack();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError(null);

        let institutionTeacherIds: string[] = [];
        if (institutionId) {
          const instSnap = await getDoc(doc(db, "institutions", institutionId));
          if (instSnap.exists()) setInstitutionName(instSnap.data().name || "");
          const membersSnap = await getDocs(query(collection(db, "users"), where("institutionId", "==", institutionId)));
          institutionTeacherIds = membersSnap.docs
            .filter(d => d.data().institutionRole === "teacher")
            .map(d => d.id);
        }

        const q = query(
          collection(db, "courses"),
          where("status", "==", "published"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        let all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));

        if (institutionId && institutionTeacherIds.length > 0) {
          all = all.filter(c => c.createdBy && institutionTeacherIds.includes(c.createdBy));
        }

        setCourses(all);

        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setEnrolledCourses(userDoc.data().enrolledCourses ?? []);
          }
        }

        // Fetch creator names for profile links
        const creatorIds = [...new Set(all.map(c => c.createdBy).filter(Boolean))] as string[];
        if (creatorIds.length > 0) {
          const nameMap: Record<string, string> = {};
          const chunks: string[][] = [];
          for (let i = 0; i < creatorIds.length; i += 30) chunks.push(creatorIds.slice(i, i + 30));
          for (const chunk of chunks) {
            const usersSnap = await getDocs(query(collection(db, "users"), where("__name__", "in", chunk)));
            usersSnap.docs.forEach(d => { nameMap[d.id] = d.data().name || d.data().displayName || ""; });
          }
          setCreatorNames(nameMap);
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
  }, [user, institutionId]);

  // Track searches with debounce
  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => {
      track("search_query", undefined, undefined, { queryText: search.trim() });
    }, 600);
    return () => clearTimeout(timer);
  }, [search, track]);

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return search.trim() !== "" ||
      filters.cat !== "all" || filters.type !== "all" ||
      filters.level !== "all" || filters.price !== "all" ||
      filters.certificate !== null || sort !== "recent";
  }, [search, filters, sort]);

  const filtered = useMemo(() => {
    let result = courses.filter((c) => {
      if (filters.cat !== "all" && c.category !== filters.cat) return false;
      if (filters.type !== "all" && c.type !== filters.type) return false;
      if (filters.level !== "all" && c.level !== filters.level) return false;
      if (filters.price === "free" && c.price > 0) return false;
      if (filters.price === "paid" && c.price === 0) return false;
      if (filters.certificate === true && !c.hasCertificate) return false;
      if (filters.certificate === false && c.hasCertificate) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitle = c.title.toLowerCase().includes(q);
        const inDesc = c.description?.toLowerCase().includes(q);
        const inTags = c.tags?.some((t) => t.toLowerCase().includes(q));
        return inTitle || inDesc || inTags;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "oldest": return (a.createdAt as number) - (b.createdAt as number);
        case "az": return a.title.localeCompare(b.title);
        case "za": return b.title.localeCompare(a.title);
        case "price-asc": return (a.price ?? 0) - (b.price ?? 0);
        case "price-desc": return (b.price ?? 0) - (a.price ?? 0);
        default: return (b.createdAt as number) - (a.createdAt as number);
      }
    });

    return result;
  }, [courses, filters, search, sort]);

  const accessible = filtered.filter((c) => canAccessCourse(normalizeCourseType(c.type), c.id!, enrolledCourses, c.price));
  const locked = filtered.filter((c) => !canAccessCourse(normalizeCourseType(c.type), c.id!, enrolledCourses, c.price));
  const resultCount = filtered.length;

  const activeTag = (label: string, onRemove: () => void) => (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 text-gray-300">
      {label}
      <button onClick={onRemove} className="text-gray-500 hover:text-white transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );

  return (
    <div className="max-w-[100rem] mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            {institutionId ? `Cursos da ${institutionName || "Instituição"}` : "Catálogo de Cursos"}
          </h1>
          <p className="mt-1 text-gray-400">
            {loading ? "A carregar..." : `${courses.length} cursos disponíveis`}
          </p>
        </div>
      </div>

      {loadError && (
        <div className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-base text-amber-200">
          {loadError}
        </div>
      )}

      {/* Search + Sort + Filter toggle */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar cursos..."
            className="w-full bg-gray-900 border border-gray-800 focus:border-purple/50 py-2.5 sm:py-3 pl-10 sm:pl-11 pr-9 sm:pr-10 text-white placeholder-gray-600 text-sm sm:text-base focus:outline-none transition-all" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-3.5 text-gray-500 hover:text-white transition-colors">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>

        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border text-xs sm:text-sm font-bold transition-colors ${
            showFilters
              ? "bg-purple/20 border-purple/40 text-purple"
              : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
          }`}>
          <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Filtros
        </button>

        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-gray-900 border border-gray-800 text-gray-300 text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none appearance-none cursor-pointer min-w-[130px] sm:min-w-[160px]">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Filter chips (collapsible) */}
      {showFilters && (
        <div className="bg-gray-900/60 border border-gray-800 p-4 sm:p-5 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Category */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Categoria</p>
              <div className="flex flex-wrap gap-2">
                <Chip selected={filters.cat === "all"} onClick={() => setFilter("cat", "all")}>Todas</Chip>
                {(Object.entries(CAT_LABEL) as [CourseCategory, string][]).map(([v, l]) => (
                  <Chip key={v} selected={filters.cat === v} onClick={() => setFilter("cat", v)}>{l}</Chip>
                ))}
              </div>
            </div>

            {/* Plan type */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Plano</p>
              <div className="flex flex-wrap gap-2">
                <Chip selected={filters.type === "all"} onClick={() => setFilter("type", "all")}>Todos</Chip>
                <Chip selected={filters.type === "standalone"} onClick={() => setFilter("type", "standalone")}>Avulso</Chip>
                <Chip selected={filters.type === "smart"} onClick={() => setFilter("type", "smart")}>Smart</Chip>
                <Chip selected={filters.type === "golden"} onClick={() => setFilter("type", "golden")}>Golden</Chip>
              </div>
            </div>

            {/* Level */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nível</p>
              <div className="flex flex-wrap gap-2">
                <Chip selected={filters.level === "all"} onClick={() => setFilter("level", "all")}>Todos</Chip>
                {LEVELS.map((l) => (
                  <Chip key={l.value} selected={filters.level === l.value} onClick={() => setFilter("level", l.value)}>{l.label}</Chip>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Preço</p>
              <div className="flex flex-wrap gap-2">
                <Chip selected={filters.price === "all"} onClick={() => setFilter("price", "all")}>Todos</Chip>
                <Chip selected={filters.price === "free"} onClick={() => setFilter("price", "free")}>Gratuitos</Chip>
                <Chip selected={filters.price === "paid"} onClick={() => setFilter("price", "paid")}>Pagos</Chip>
              </div>
            </div>

            {/* Certificate */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Certificado</p>
              <div className="flex flex-wrap gap-2">
                <Chip selected={filters.certificate === null} onClick={() => setFilter("certificate", null)}>Todos</Chip>
                <Chip selected={filters.certificate === true} onClick={() => setFilter("certificate", true)}>Com certificado</Chip>
                <Chip selected={filters.certificate === false} onClick={() => setFilter("certificate", false)}>Sem certificado</Chip>
              </div>
            </div>
          </div>

          {/* Clear all */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
              <span className="text-sm text-gray-500">{resultCount} resultado{resultCount !== 1 ? "s" : ""}</span>
              <button onClick={() => { setSearch(""); setFilters(DEFAULT_FILTERS); setSort("recent"); }}
                className="text-sm text-purple hover:text-purple-light font-bold transition-colors">
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active filter tags */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {search && activeTag(`"${search}"`, () => setSearch(""))}
          {filters.cat !== "all" && activeTag(CAT_LABEL[filters.cat], () => setFilter("cat", "all"))}
          {filters.type !== "all" && activeTag(TYPE_BADGE[filters.type].label, () => setFilter("type", "all"))}
          {filters.level !== "all" && activeTag(LEVEL_LABEL[filters.level], () => setFilter("level", "all"))}
          {filters.price !== "all" && activeTag(filters.price === "free" ? "Gratuitos" : "Pagos", () => setFilter("price", "all"))}
          {filters.certificate !== null && activeTag(filters.certificate ? "Com certificado" : "Sem certificado", () => setFilter("certificate", null))}
          {sort !== "recent" && activeTag(SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort, () => setSort("recent"))}

          {hasActiveFilters && (
            <button onClick={() => { setSearch(""); setFilters(DEFAULT_FILTERS); setSort("recent"); }}
              className="text-sm text-gray-500 hover:text-purple transition-colors underline underline-offset-2">
              Limpar tudo
            </button>
          )}
        </div>
      )}

      {loading && <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/40 text-center">
          <Search className="h-12 w-12 text-gray-700 mb-3" />
          <p className="text-gray-400 text-lg">Nenhum curso encontrado</p>
          <p className="text-gray-600 text-sm mt-1">Tenta alterar os filtros ou a pesquisa.</p>
          {hasActiveFilters && (
            <button onClick={() => { setSearch(""); setFilters(DEFAULT_FILTERS); setSort("recent"); }}
              className="mt-4 px-5 py-2.5 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors">
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Accessible courses */}
      {!loading && accessible.length > 0 && (
        <div>
          <h2 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" /> Disponíveis para ti
            <span className="text-xs sm:text-sm font-normal text-gray-500">({accessible.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {accessible.map((course) => (
              <CourseCard key={course.id} course={course} locked={false} enrolledCourses={enrolledCourses} creatorNames={creatorNames} />
            ))}
          </div>
        </div>
      )}

      {/* Locked courses */}
      {!loading && locked.length > 0 && (
        <div>
          <h2 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" /> Requer upgrade
            <span className="text-xs sm:text-sm font-normal text-gray-500">({locked.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {locked.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                locked={true}
                enrolledCourses={enrolledCourses}
                requiredPlan={requiredPlanLabel(normalizeCourseType(course.type))}
                creatorNames={creatorNames}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chip component ───────────────────────────────────────────
function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 text-sm font-bold border transition-colors ${
        selected
          ? "bg-purple/20 border-purple/40 text-purple"
          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
      }`}>
      {children}
    </button>
  );
}

// ── Course Card ───────────────────────────────────────────
function CourseCard({
  course, locked, enrolledCourses, requiredPlan, creatorNames,
}: {
  course: Course;
  locked: boolean;
  enrolledCourses: string[];
  requiredPlan?: string;
  creatorNames?: Record<string, string>;
}) {
  const normalizedType = normalizeCourseType(course.type);
  const badge = TYPE_BADGE[normalizedType] ?? DEFAULT_BADGE;

  return (
    <Link href={`/dashboard/courses/${course.id}`}
      className={`group flex flex-col bg-gray-900/40 backdrop-blur-xl overflow-hidden transition-all hover:bg-gray-900/60 ${locked ? "opacity-80 hover:opacity-100" : ""}`}>

      {/* Thumbnail */}
      <div className="relative h-36 sm:h-44 bg-gray-800 overflow-hidden">
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
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center bg-gray-900/80 border border-gray-700">
                <Lock className="h-4 w-4 sm:h-6 sm:w-6 text-gray-300" />
              </div>
              {requiredPlan && (
                <span className="text-[10px] sm:text-sm font-bold text-white bg-gray-900/80 px-2 sm:px-3 py-0.5 sm:py-1 border border-gray-700">
                  {requiredPlan}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Play button on hover (unlocked) */}
        {!locked && (
          <div className="absolute inset-0 bg-gray-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center bg-blue-600 rounded-full shadow-lg shadow-blue-500/30">
              <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white ml-0.5 sm:ml-1" />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1.5 sm:gap-2">
          <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold uppercase tracking-wider border ${badge.color}`}>
            {badge.label}
          </span>
          {course.hasCertificate && (
            <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold uppercase tracking-wider border bg-amber-500/15 text-amber-400 border-amber-500/25 flex items-center gap-1">
              <Award className="h-3 w-3 sm:h-4 sm:w-4" /> Cert.
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="font-bold text-white text-base sm:text-lg leading-snug line-clamp-2">{course.title}</h3>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400 line-clamp-2 flex-1">{course.description}</p>

        {course.createdBy && creatorNames?.[course.createdBy] && (
          <button onClick={(e) => { e.stopPropagation(); window.open(`/profile/${course.createdBy}`, '_self'); }}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 text-left">
            <GraduationCap className="h-3 w-3 shrink-0" />
            {creatorNames[course.createdBy]}
          </button>
        )}

        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
          <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{course.modulesCount ?? 0} módulos</span>
          <span className="flex items-center gap-1"><Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{course.lessonsCount ?? 0} aulas</span>
          {course.level && <span className="capitalize">{LEVEL_LABEL[course.level] ?? course.level}</span>}
        </div>

        <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-gray-800 pt-3 sm:pt-4">
          {normalizedType === "standalone" && !enrolledCourses.includes(course.id!) ? (
            <span className="text-sm sm:text-base font-bold text-white">
              {course.price ? `${course.price.toLocaleString("pt-AO")} Kz` : "Gratuito"}
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-gray-500">{LEVEL_LABEL[course.level] ?? ""}</span>
          )}
          <span className={`flex items-center gap-1 text-sm sm:text-base font-medium transition-colors ${locked ? "text-gray-500" : "text-blue-400 group-hover:text-blue-300"}`}>
            {locked ? <><Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Bloqueado</> : <><ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" /> Ver curso</>}
          </span>
        </div>
      </div>
    </Link>
  );
}
