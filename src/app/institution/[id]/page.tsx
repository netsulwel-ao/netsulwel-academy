"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { Building2, Loader2, Mail, Phone, MapPin, Globe, Users, BookOpen, LogIn, Check, UserPlus, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import type { Institution } from "@/types/institution";

interface Teacher {
  id: string;
  name: string;
  photoURL?: string;
  specialty?: string;
  bio?: string;
}

interface Course {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  lessonsCount: number;
}

export default function InstitutionPublicPage() {
  const { id } = useParams<{ id: string }>();
  const { user, institutionId: myInstitutionId, loading: authLoading } = useAuth();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [instSnap, usersSnap, coursesSnap] = await Promise.all([
        getDoc(doc(db, "institutions", id)),
        getDocs(query(collection(db, "users"), where("institutionId", "==", id), where("institutionRole", "==", "teacher"))),
        getDocs(query(collection(db, "courses"), where("institutionId", "==", id), where("status", "==", "published"))),
      ]);

      if (instSnap.exists()) {
        setInstitution({ id: instSnap.id, ...instSnap.data() } as Institution);
      }

      setTeachers(usersSnap.docs.map(d => {
        const d2 = d.data();
        return { id: d.id, name: d2.name || "Sem nome", photoURL: d2.photoURL, specialty: d2.specialty, bio: d2.bio };
      }));

      setCourses(coursesSnap.docs.map(d => {
        const d2 = d.data();
        return { id: d.id, title: d2.title || "Sem título", thumbnail: d2.thumbnail || "", price: d2.price || 0, lessonsCount: d2.lessonsCount || 0 };
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !id) return;
    setJoining(true);
    try {
      const { auth } = await import("@/lib/firebase");
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/institutions/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJoined(true);
      toast.success("Bem-vindo à instituição!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar na instituição.");
    } finally {
      setJoining(false);
    }
  };

  const alreadyMember = myInstitutionId === id;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900/60 border border-gray-800 p-8 text-center">
          <Building2 className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Instituição não encontrada</h1>
          <Link href="/" className="mt-6 inline-block text-purple hover:text-purple-light font-medium">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gray-900 overflow-hidden">
        {institution.banner ? (
           <img src={institution.banner} alt={institution.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 mb-8">
          <div className="h-28 w-28 sm:h-36 sm:w-36 border-4 border-background bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
            {institution.logo ? (
              <img src={institution.logo} alt={institution.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-10 sm:pt-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{institution.name}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {teachers.length} professor{teachers.length !== 1 ? "es" : ""} • {courses.length} curso{courses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="shrink-0 w-full sm:w-auto">
            {alreadyMember ? (
              <div className="flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-2 text-sm font-medium">
                <Check className="h-4 w-4" /> Membro
              </div>
            ) : user && !myInstitutionId ? (
              <button onClick={handleJoin} disabled={joining || joined}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green hover:bg-green-light disabled:opacity-50 text-white font-bold px-6 py-3 transition-colors">
                {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : joined ? <Check className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                {joined ? "Bem-vindo!" : "Entrar na Instituição"}
              </button>
            ) : !user ? (
              <Link href={`/login?redirect=/institution/${id}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple hover:bg-purple-light text-white font-bold px-6 py-3 transition-colors">
                <LogIn className="h-5 w-5" /> Fazer Login para Entrar
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* About */}
            {institution.description && (
              <div className="bg-gray-900/60 border border-gray-800 p-5">
                <h2 className="text-lg font-bold text-white mb-3">Sobre</h2>
                <p className="text-sm text-gray-400 whitespace-pre-wrap">{institution.description}</p>
              </div>
            )}

            {/* Contact */}
            <div className="bg-gray-900/60 border border-gray-800 p-5 space-y-3">
              <h2 className="text-lg font-bold text-white">Contacto</h2>
              {institution.email && (
                <a href={`mailto:${institution.email}`} className="flex items-center gap-3 text-sm text-gray-400 hover:text-purple transition-colors">
                  <Mail className="h-4 w-4 text-gray-500 shrink-0" /> {institution.email}
                </a>
              )}
              {institution.phone && (
                <a href={`tel:${institution.phone}`} className="flex items-center gap-3 text-sm text-gray-400 hover:text-purple transition-colors">
                  <Phone className="h-4 w-4 text-gray-500 shrink-0" /> {institution.phone}
                </a>
              )}
              {institution.address && (
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <MapPin className="h-4 w-4 text-gray-500 shrink-0" /> {institution.address}
                </div>
              )}
              {institution.website && (
                <a href={institution.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-400 hover:text-purple transition-colors">
                  <Globe className="h-4 w-4 text-gray-500 shrink-0" /> {institution.website}
                </a>
              )}
            </div>
          </div>

          {/* Right: Teachers + Courses */}
          <div className="lg:col-span-2 space-y-8">
            {/* Teachers */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Professores</h2>
                <span className="text-sm text-gray-500">({teachers.length})</span>
              </div>
              {teachers.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum professor registado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teachers.map(t => (
                    <Link key={t.id} href={`/profile/${t.id}`}
                      className="flex items-center gap-3 p-4 bg-gray-900/60 border border-gray-800 hover:border-purple/30 transition-colors group">
                      <div className="h-12 w-12 bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center text-purple-400 font-bold shrink-0">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-purple transition-colors truncate">{t.name}</p>
                        {t.specialty && <p className="text-xs text-gray-500 truncate">{t.specialty}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Courses */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Cursos</h2>
                <span className="text-sm text-gray-500">({courses.length})</span>
              </div>
              {courses.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum curso publicado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {courses.map(c => (
                    <Link key={c.id} href={`/s/${c.id}`}
                      className="group bg-gray-900/60 border border-gray-800 hover:border-purple/30 transition-colors overflow-hidden">
                      <div className="aspect-video bg-gray-800 overflow-hidden">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <GraduationCap className="h-8 w-8 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-white group-hover:text-purple transition-colors line-clamp-2">{c.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{c.lessonsCount} aula{c.lessonsCount !== 1 ? "s" : ""}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}