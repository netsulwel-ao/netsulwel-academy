"use client";

import Link from "next/link";
import { BookOpen, Radio, ChevronRight } from "lucide-react";
import type { TeacherProfile } from "../_hooks/useTeachers";
import { Avatar } from "@/components/ui/Avatar";

interface TeacherCardProps {
  teacher: TeacherProfile;
  /** Primeiro card tem layout ligeiramente diferente */
  featured?: boolean;
}

export function TeacherCard({ teacher, featured = false }: TeacherCardProps) {
  const initial = teacher.name[0]?.toUpperCase() ?? "?";
  const isInstitution = teacher.role === "institution";

  return (
    <Link
      href={`/dashboard/professores/${teacher.id}`}
      className={`group flex items-center gap-4 border border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900 transition-all ${
        featured ? "p-5 sm:p-6" : "p-4"
      }`}
    >
      {/* Avatar */}
      <div className={`shrink-0 overflow-hidden border border-gray-800 bg-gray-900 group-hover:border-gray-700 transition-colors ${
        featured ? "h-14 w-14" : "h-10 w-10"
      }`}>
        <Avatar
          uid={teacher.id}
          photoURL={teacher.photoURL}
          name={teacher.name}
          size={featured ? 56 : 40}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {featured && (
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1">
            {isInstitution ? "// instituição" : "// professor"}
          </p>
        )}
        <p className={`font-bold text-gray-200 group-hover:text-white truncate transition-colors ${
          featured ? "text-base" : "text-sm"
        }`}>
          {teacher.name}
        </p>

        {/* Role badge + stats */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={`font-mono text-[13px] uppercase tracking-widest border px-1.5 py-0.5 ${
            isInstitution
              ? "border-blue-500 bg-blue-500/8 text-blue-400"
              : "border-green bg-green/8 text-green"
          }`}>
            {isInstitution ? "Instituição" : "Professor"}
          </span>
          <span className="flex items-center gap-1 font-mono text-[13px] text-gray-700">
            <BookOpen className="h-2.5 w-2.5" strokeWidth={1.5} />
            {teacher.courseCount}
          </span>
          <span className="flex items-center gap-1 font-mono text-[13px] text-gray-700">
            <Radio className="h-2.5 w-2.5" strokeWidth={1.5} />
            {teacher.liveCount}
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-gray-700 group-hover:text-gray-500 transition-colors" />
    </Link>
  );
}
