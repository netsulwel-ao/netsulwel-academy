"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import {
  Code2, Wallet, TrendingUp, Layers, Award,
  ChevronLeft, ChevronRight, Shield,
} from "lucide-react";
import Link from "next/link";
import type { Course, CourseCategory } from "@/types/course";

const RGB: Record<CourseCategory, string> = {
  tech: "59,130,246",
  finance: "34,197,94",
  investments: "245,158,11",
  other: "168,85,247",
};

const CATEGORY_CONFIG: Record<
  CourseCategory,
  { label: string; icon: typeof Code2; gradient: string; glow: string; badgeColor: string }
> = {
  tech: {
    label: "Tecnologia",
    icon: Code2,
    gradient: "from-blue-600/30 via-cyan-500/20 to-transparent",
    glow: "shadow-blue-500/30",
    badgeColor: "text-blue-400",
  },
  finance: {
    label: "Finanças",
    icon: Wallet,
    gradient: "from-green-600/30 via-emerald-500/20 to-transparent",
    glow: "shadow-green-500/30",
    badgeColor: "text-green-400",
  },
  investments: {
    label: "Investimentos",
    icon: TrendingUp,
    gradient: "from-amber-600/30 via-yellow-500/20 to-transparent",
    glow: "shadow-amber-500/30",
    badgeColor: "text-amber-400",
  },
  other: {
    label: "Outros",
    icon: Layers,
    gradient: "from-purple-600/30 via-violet-500/20 to-transparent",
    glow: "shadow-purple-500/30",
    badgeColor: "text-purple-400",
  },
};

const CAT_ORDER: CourseCategory[] = ["tech", "finance", "investments", "other"];

function getTierTag(course: Course): { label: string; color: string } {
  if (course.type === "golden") return { label: "PRO", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
  if (course.type === "smart") return { label: "Smart", color: "bg-green-500/20 text-green-300 border-green-500/30" };
  if (course.price === 0) return { label: "Grátis", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
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
    <section id="cursos" className="py-20 md:py-28 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Cursos em destaque</h2>
            <p className="mt-2 max-w-xl text-gray-300">
              Formações completas em tecnologia, finanças e investimentos.
            </p>
          </div>
        </div>
      </div>

      {CAT_ORDER.map((cat) => {
        const courses = grouped.get(cat) ?? [];
        if (courses.length === 0) return null;
        const config = CATEGORY_CONFIG[cat];

        return (
          <CarouselRow key={cat} catKey={cat} category={config} courses={courses} />
        );
      })}
    </section>
  );
}

function CarouselRow({
  catKey,
  category,
  courses,
}: {
  catKey: CourseCategory;
  category: (typeof CATEGORY_CONFIG)[CourseCategory];
  courses: Course[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const CatIcon = category.icon;

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="group/row mt-8 first:mt-4">
      <div className="mx-auto max-w-6xl px-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center border border-white/10 bg-white/5">
            <CatIcon className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-white">{category.label}</h3>
          <span className="text-xs text-gray-500">{courses.length} cursos</span>
        </div>
      </div>

      <div className="relative">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center border border-white/10 bg-gray-950/80 text-white opacity-0 transition-opacity hover:bg-gray-900 group-hover/row:opacity-100 backdrop-blur-sm"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center border border-white/10 bg-gray-950/80 text-white opacity-0 transition-opacity hover:bg-gray-900 group-hover/row:opacity-100 backdrop-blur-sm"
          aria-label="Seguinte"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Track */}
        <div
          ref={rowRef}
          className="flex gap-5 overflow-x-auto px-6 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} config={category} catKey={catKey} />
          ))}
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-950 to-transparent z-[1]" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-950 to-transparent z-[1]" />
      </div>
    </div>
  );
}

function CourseCard({
  course,
  config,
  catKey,
}: {
  course: Course;
  config: (typeof CATEGORY_CONFIG)[CourseCategory];
  catKey: CourseCategory;
}) {
  const tag = getTierTag(course);
  const CatIcon = config.icon;
  const rgb = RGB[catKey];

  return (
    <Link
      href={course.id ? `/dashboard/courses/${course.id}` : "#"}
      className="group/card relative w-[280px] shrink-0 snap-start"
    >
      <div
        className={`relative overflow-hidden border border-white/5 bg-gradient-to-b ${config.gradient} transition-all duration-500 hover:scale-[1.04] hover:shadow-2xl ${config.glow}`}
      >
        {/* Badge shield */}
        <div className="flex flex-col items-center justify-center pt-14 pb-8">
          <div className="relative">
            {/* Glow behind badge */}
            <div
              className="absolute inset-0 scale-150 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 blur-3xl"
              style={{
                background: `radial-gradient(circle, rgba(${rgb},0.25) 0%, transparent 70%)`,
              }}
            />
            <div className="relative flex h-20 w-20 items-center justify-center">
              <Shield
                className={`h-20 w-20 transition-all duration-500 ${config.badgeColor}`}
                strokeWidth={1.2}
                style={{
                  filter: `drop-shadow(0 0 12px rgba(${rgb},0.5))`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = `drop-shadow(0 0 24px rgba(${rgb},0.8))`;
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = `drop-shadow(0 0 12px rgba(${rgb},0.5))`;
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
            </div>
          </div>

          {/* Category icon floating */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
            <CatIcon className="h-3.5 w-3.5" />
            <span>{course.level === "beginner" ? "Iniciante" : course.level === "intermediate" ? "Intermédio" : "Avançado"}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${tag.color}`}>
            {tag.label}
          </span>
          {course.hasCertificate && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1">
              <Award className="h-3 w-3" /> Cert.
            </span>
          )}
        </div>

        {/* Price badge */}
        {course.type === "standalone" && course.price > 0 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-white/10 text-white border border-white/20">
              {course.price.toLocaleString("pt-AO")} Kz
            </span>
          </div>
        )}

        {/* Info footer */}
        <div className="border-t border-white/5 bg-gray-950/40 px-5 py-4 backdrop-blur-sm">
          <h4 className="text-sm font-bold text-white line-clamp-1 leading-snug">{course.title}</h4>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
            <span>{course.modulesCount ?? 0} módulos</span>
            <span>·</span>
            <span>{course.lessonsCount ?? 0} aulas</span>
          </div>
        </div>

        {/* Hover overlay glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            background: `linear-gradient(135deg, rgba(${rgb},0.1) 0%, transparent 50%)`,
          }}
        />
      </div>
    </Link>
  );
}
