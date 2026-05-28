"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import {
  Code2, Wallet, TrendingUp, Layers, Award,
  ChevronLeft, ChevronRight, BookOpen, Play, Lock,
} from "lucide-react";
import Link from "next/link";
import type { Course, CourseCategory } from "@/types/course";

const CATEGORY_CONFIG: Record<CourseCategory, {
  label: string;
  icon: typeof Code2;
  accent: string;
  badge: string;
}> = {
  tech:        { label: "Tecnologia",    icon: Code2,      accent: "text-blue-400",   badge: "bg-blue-500/15 text-blue-300 border-blue-500/25" },
  finance:     { label: "Finanças",      icon: Wallet,     accent: "text-green-400",  badge: "bg-green-500/15 text-green-300 border-green-500/25" },
  investments: { label: "Investimentos", icon: TrendingUp, accent: "text-amber-400",  badge: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  other:       { label: "Outros",        icon: Layers,     accent: "text-purple-400", badge: "bg-purple-500/15 text-purple-300 border-purple-500/25" },
};

const CAT_ORDER: CourseCategory[] = ["tech", "finance", "investments", "other"];

function getTierTag(course: Course): { label: string; color: string } {
  if (course.type === "golden") return { label: "Golden", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
  if (course.type === "smart")  return { label: "Smart",  color: "bg-green-500/20 text-green-300 border-green-500/30" };
  if (course.price === 0)       return { label: "Grátis", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
  return { label: "Avulso", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" };
}

export function PublicCourses() {
  const [grouped, setGrouped] = useState<Map<CourseCategory, Course[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(
          collection(db, "courses"),
          where("status", "==", "published"),
          where("featured", "==", true),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const courses = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));

        const map = new Map<CourseCategory, Course[]>();
        for (const cat of CAT_ORDER) map.set(cat, []);
        for (const c of courses) {
          const cat = CAT_ORDER.includes(c.category) ? c.category : "other";
          map.get(cat)!.push(c);
        }
        setGrouped(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return null;
  const hasAny = Array.from(grouped.values()).some((arr) => arr.length > 0);
  if (!hasAny) return null;

  return (
    <section id="cursos" className="py-20 md:py-28">
      {/* Section header — alinhado ao max-w-6xl */}
      <div className="mx-auto max-w-6xl px-6 mb-12">
        <h2 className="text-3xl font-bold text-white md:text-4xl">Cursos em destaque</h2>
        <p className="mt-3 max-w-xl text-gray-400">
          Formações completas em tecnologia, finanças e investimentos.
        </p>
      </div>

      {/* Category rows */}
      <div className="space-y-14">
        {CAT_ORDER.map((cat) => {
          const courses = grouped.get(cat) ?? [];
          if (courses.length === 0) return null;
          return <CarouselRow key={cat} catKey={cat} courses={courses} />;
        })}
      </div>
    </section>
  );
}

// ── Carousel Row ──────────────────────────────────────────
function CarouselRow({ catKey, courses }: { catKey: CourseCategory; courses: Course[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const config = CATEGORY_CONFIG[catKey];
  const CatIcon = config.icon;
  const useGrid = courses.length <= 4; // ≤4 cursos → grid centrado; >4 → carrossel

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const card = rowRef.current.querySelector("[data-card]") as HTMLElement | null;
    if (!card) return;
    const amount = (card.clientWidth + 20) * 3;
    rowRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="group/row">
      {/* Row header */}
      <div className="mx-auto max-w-6xl px-6 mb-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-7 w-7 items-center justify-center border border-white/10 bg-white/5 ${config.accent}`}>
            <CatIcon className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-white">{config.label}</h3>
          <span className="text-xs text-gray-600">{courses.length} {courses.length === 1 ? "curso" : "cursos"}</span>
        </div>
      </div>

      {/* Grid (≤4 cursos) — centrado */}
      {useGrid ? (
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap justify-center gap-5">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} catKey={catKey} />
            ))}
          </div>
        </div>
      ) : (
        /* Carrossel (>4 cursos) */
        <div className="relative">
          <div
            ref={rowRef}
            className="flex gap-5 overflow-x-auto hide-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingLeft: "max(12px, calc((100vw - 1152px) / 2 + 12px))",
              paddingRight: "max(12px, calc((100vw - 1152px) / 2 + 12px))",
            }}
          >
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} catKey={catKey} />
            ))}
          </div>

          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-gray-950 to-transparent z-[2]" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-gray-950 to-transparent z-[2]" />

          {/* Nav buttons */}
          <button onClick={() => scroll("left")} aria-label="Anterior"
            className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border border-white/10 bg-gray-950/90 text-white transition-opacity hover:bg-gray-900 backdrop-blur-sm md:opacity-0 md:group-hover/row:opacity-100">
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button onClick={() => scroll("right")} aria-label="Seguinte"
            className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border border-white/10 bg-gray-950/90 text-white transition-opacity hover:bg-gray-900 backdrop-blur-sm md:opacity-0 md:group-hover/row:opacity-100">
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Course Card ───────────────────────────────────────────
function CourseCard({ course, catKey }: { course: Course; catKey: CourseCategory }) {
  const tag = getTierTag(course);
  const config = CATEGORY_CONFIG[catKey];
  const CatIcon = config.icon;
  const isLocked = course.type !== "standalone" || course.price > 0;

  return (
    <Link
      href={`/dashboard/courses/${course.id}`}
      className="group/card relative w-[260px] shrink-0 flex flex-col bg-gray-900/60 border border-white/5 overflow-hidden hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      data-card
    >
      {/* Thumbnail */}
      <div className="relative h-[148px] overflow-hidden bg-gray-800 shrink-0">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900`}>
            <CatIcon className={`h-12 w-12 opacity-20 ${config.accent}`} />
          </div>
        )}

        {/* Dark overlay on hover with play icon */}
        <div className="absolute inset-0 bg-gray-950/50 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center bg-white/10 border border-white/20 backdrop-blur-sm">
            {isLocked
              ? <Lock className="h-5 w-5 text-white" />
              : <Play className="h-5 w-5 text-white ml-0.5" />
            }
          </div>
        </div>

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${tag.color}`}>
            {tag.label}
          </span>
          {course.hasCertificate && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1">
              <Award className="h-2.5 w-2.5" /> Cert.
            </span>
          )}
        </div>

        {/* Price badge */}
        {course.type === "standalone" && course.price > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-950/80 text-white border border-white/10 backdrop-blur-sm">
              {course.price.toLocaleString("pt-AO")} Kz
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">{course.title}</h4>
        {course.description && (
          <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">{course.description}</p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-2 text-[11px] text-gray-600">
            <BookOpen className="h-3 w-3" />
            <span>{course.modulesCount ?? 0} módulos</span>
            <span>·</span>
            <span>{course.lessonsCount ?? 0} aulas</span>
          </div>
          <span className={`text-[10px] font-medium capitalize ${config.accent}`}>
            {course.level === "beginner" ? "Iniciante" : course.level === "intermediate" ? "Intermédio" : "Avançado"}
          </span>
        </div>
      </div>
    </Link>
  );
}
