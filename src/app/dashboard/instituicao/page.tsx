"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, onSnapshot, orderBy } from "firebase/firestore";
import { Building2, BookOpen, Users, Megaphone, GraduationCap, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StudentInstitutionDashboard() {
  const { user, institutionId } = useAuth();
  const [institutionName, setInstitutionName] = useState("");
  const [stats, setStats] = useState({ courses: 0, teachers: 0, announcements: 0, classes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institutionId) return;
    const unsub = onSnapshot(doc(db, "institutions", institutionId), snap => {
      if (snap.exists()) setInstitutionName(snap.data().name || "");
    });
    return () => unsub();
  }, [institutionId]);

  useEffect(() => {
    if (!institutionId) return;
    loadStats();
  }, [institutionId]);

  const loadStats = async () => {
    try {
      const membersSnap = await getDocs(query(collection(db, "users"), where("institutionId", "==", institutionId)));
      const members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; institutionRole?: string }));
      const teacherIds = members.filter(m => m.institutionRole === "teacher").map(m => m.id);
      const teachers = teacherIds.length;

      let courses = 0;
      if (teacherIds.length > 0 && teacherIds.length <= 10) {
        const coursesSnap = await getDocs(query(collection(db, "courses"), where("createdBy", "in", teacherIds)));
        courses = coursesSnap.size;
      }

      const annSnap = await getDocs(query(collection(db, "institutionAnnouncements"), where("institutionId", "==", institutionId)));
      const classesSnap = await getDocs(query(collection(db, "institutionClasses"), where("institutionId", "==", institutionId)));

      setStats({ courses, teachers, announcements: annSnap.size, classes: classesSnap.size });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-64 bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-800/50 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const cards = [
    { icon: BookOpen, label: "Cursos", value: stats.courses, href: "/dashboard/courses", color: "from-purple-500 to-purple-300", bg: "bg-purple-500/10" },
    { icon: Users, label: "Professores", value: stats.teachers, href: null, color: "from-blue-500 to-blue-300", bg: "bg-blue-500/10" },
    { icon: Megaphone, label: "Comunicados", value: stats.announcements, href: "/dashboard/instituicao/comunicados", color: "from-amber-500 to-amber-300", bg: "bg-amber-500/10" },
    { icon: GraduationCap, label: "Turmas", value: stats.classes, href: "/dashboard/instituicao/turmas", color: "from-cyan-500 to-cyan-300", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="max-w-[100rem] space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-3xl rounded-full" />
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{institutionName || "Instituição"}</h1>
            <p className="text-sm sm:text-base text-gray-400">Painel do estudante</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {cards.map((card, i) => {
          const content = (
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6 hover:border-cyan/30 transition-all duration-300 h-full">
              <div className="relative">
                <div className={`inline-flex p-3 rounded-lg ${card.bg} mb-3`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-400 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
            </div>
          );
          if (card.href) {
            return <Link key={i} href={card.href}>{content}</Link>;
          }
          return <div key={i}>{content}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Link href="/dashboard/instituicao/comunicados"
          className="group rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6 hover:border-amber-500/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">Comunicados</h3>
              <p className="text-sm text-gray-400">{stats.announcements} comunicado{stats.announcements !== 1 ? "s" : ""}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-500 ml-auto group-hover:text-amber-400 transition-colors" />
          </div>
        </Link>

        <Link href="/dashboard/instituicao/turmas"
          className="group rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6 hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">Turmas</h3>
              <p className="text-sm text-gray-400">{stats.classes} turma{stats.classes !== 1 ? "s" : ""}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-500 ml-auto group-hover:text-cyan-400 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
