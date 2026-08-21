"use client";

import Link from "next/link";
import { BookOpen, Lock, Play, Award, GraduationCap, ChevronRight, Star } from "lucide-react";
import type { Course } from "@/types/course";
import { TYPE_BADGE, LEVEL_LABEL } from "../_types/catalog";

interface CourseCardProps {
  course: Course;
  locked: boolean;
  enrolledCourses: string[];
  requiredPlan?: string;
  creatorNames?: Record<string, string>;
  /** Curso criado pelo próprio professor — pode aceder mas não comprar */
  isOwn?: boolean;
}

export function CourseCard({
  course,
  locked,
  enrolledCourses,
  requiredPlan,
  creatorNames,
  isOwn = false,
}: CourseCardProps) {
  const badge = TYPE_BADGE["standalone"];
  const isEnrolled = enrolledCourses.includes(course.id!);
  const creatorName = course.createdBy ? (creatorNames?.[course.createdBy] ?? "") : "";

  return (
    <Link
      href={`/dashboard/courses/${course.id}`}
      className={`group flex flex-col border border-gray-800 bg-gray-900 overflow-hidden transition-all hover:border-gray-700 hover:bg-gray-900 ${
        locked ? "opacity-75 hover:opacity-100" : ""
      }`}
    >
      {/* ── Thumbnail ── */}
      <div className="relative aspect-video bg-gray-900 shrink-0">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
            <BookOpen className="h-10 w-10 text-gray-800" strokeWidth={1} />
          </div>
        )}

        {/* Overlay bloqueado */}
        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-950/60">
            <div className="flex h-10 w-10 items-center justify-center border border-gray-700/50 bg-gray-950/80">
              <Lock className="h-5 w-5 text-gray-300" strokeWidth={1.5} />
            </div>
            {requiredPlan && (
              <span className="font-mono text-[13px] uppercase tracking-widest border border-gray-700/50 bg-gray-950/80 px-2.5 py-1 text-gray-300">
                {requiredPlan}
              </span>
            )}
          </div>
        )}

        {/* Preço topo-direita */}
        <div className="absolute right-2.5 top-2.5">
          <span className={`font-mono text-[13px] font-bold border px-2 py-0.5 ${
            (course.price ?? 0) === 0
              ? "border-green/25 bg-gray-950 text-green/80"
              : "border-gray-700 bg-gray-950 text-gray-400"
          }`}>
            {(course.price ?? 0) === 0
              ? "Grátis"
              : `${course.price!.toLocaleString("pt-AO")} Kz`}
          </span>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="flex flex-1 flex-col p-4">
        {/* Título */}
        <h3 className="text-sm font-bold text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {course.title}
        </h3>

        {/* Descrição */}
        {course.description && (
          <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 leading-relaxed flex-1">
            {course.description}
          </p>
        )}

        {/* Professor */}
        {creatorName && (
          <p className="mt-2 flex items-center gap-1 text-[13px] text-purple/60">
            <GraduationCap className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            {creatorName}
          </p>
        )}

        {/* Meta */}
        <div className="mt-3 flex items-center justify-between border-t border-gray-800 pt-3">
          <div className="flex items-center gap-3 text-[13px] font-mono text-gray-700">
            <span>{course.modulesCount ?? 0} mód.</span>
            <span>·</span>
            <span>{course.lessonsCount ?? 0} aulas</span>
            {course.level && (
              <>
                <span>·</span>
                <span>{LEVEL_LABEL[course.level] ?? course.level}</span>
              </>
            )}
          </div>

          {locked ? (
            <span className="flex items-center gap-1 text-[13px] text-gray-700">
              <Lock className="h-3 w-3" strokeWidth={1.5} /> Bloqueado
            </span>
          ) : isOwn ? (
            <Link
              href={`/dashboard/teacher/courses/${course.id}/edit`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-[13px] text-purple/60 hover:text-purple/80 transition-colors"
            >
              Gerir <ChevronRight className="h-3 w-3" />
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-[13px] text-purple/60 group-hover:text-purple/80 transition-colors">
              Ver <ChevronRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
