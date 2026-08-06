"use client";

import Link from "next/link";
import { BookOpen, Lock, Play, ChevronRight } from "lucide-react";
import type { Course } from "@/types/course";
import { useAccess } from "@/hooks/useAccess";
import { normalizeCourseType, LEVEL_LABEL } from "../_types/trails";

interface TrailCourseListProps {
  courses: Course[];
  enrolledCourses: string[];
}

export function TrailCourseList({ courses, enrolledCourses }: TrailCourseListProps) {
  const { canAccessCourse, requiredPlanLabel } = useAccess();

  if (courses.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple/60 mb-1">
            // cursos
          </p>
          <h2 className="text-base font-bold text-gray-200">
            Cursos na trilha
            <span className="ml-2 font-mono text-xs text-gray-700">({courses.length})</span>
          </h2>
        </div>
      </div>

      <div className="divide-y divide-gray-800/40 border border-gray-800/60">
        {courses.map((course, idx) => {
          const normType = normalizeCourseType(course.type);
          const hasAccess = canAccessCourse(
            normType, course.id!, enrolledCourses, course.price, course.accessCode
          );

          return (
            <div
              key={course.id}
              className={`flex items-center gap-3 sm:gap-4 px-4 py-3.5 transition-colors ${
                hasAccess
                  ? "hover:bg-gray-900/40 bg-gray-900/10"
                  : "bg-gray-900/10 opacity-60"
              }`}
            >
              {/* Número */}
              <span className="w-6 shrink-0 text-center font-mono text-[10px] text-gray-700">
                {String(idx + 1).padStart(2, "0")}
              </span>

              {/* Thumbnail */}
              <div className="h-12 w-16 sm:w-20 shrink-0 overflow-hidden bg-gray-900 border border-gray-800/60">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-4 w-4 text-gray-800" strokeWidth={1} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-300 truncate">
                  {course.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-gray-700">
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
              </div>

              {/* Acção */}
              <div className="shrink-0">
                {hasAccess ? (
                  <Link
                    href={`/dashboard/courses/${course.id}`}
                    className="group flex items-center gap-1.5 border border-gray-800 bg-gray-900/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:border-purple/40 hover:text-purple/80 transition-all"
                  >
                    <Play className="h-3 w-3" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Aceder</span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 border border-gray-800/40 bg-gray-900/30 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-700">
                    <Lock className="h-3 w-3" strokeWidth={1.5} />
                    <span className="hidden sm:inline">
                      {normType === "standalone"
                        ? (course.price ? `${course.price.toLocaleString("pt-AO")} Kz` : "Grátis")
                        : requiredPlanLabel(normType)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
