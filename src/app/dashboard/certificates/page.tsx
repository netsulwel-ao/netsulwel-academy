"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Award, Loader2, ExternalLink, ArrowRight, BookOpen } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface Certificate {
  id: string;
  courseTitle: string;
  completedAt?: { toDate: () => Date };
  certificateId: string;
  studentName: string;
  hours: number;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const q = query(collection(db, "certificates", user.uid, "courses"), orderBy("completedAt", "desc"));
        const snap = await getDocs(q);
        setCerts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Certificate)));
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-start gap-4 mb-10">
        <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Award className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">Certificados</h1>
          <p className="mt-1 text-gray-400">Os teus certificados de conclusão de cursos.</p>
        </div>
      </div>

      {certs.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Nenhum certificado ainda"
          description="Completa um curso com certificado ativo para ganhares o teu primeiro certificado."
          action={{ label: "Ver cursos", href: "/dashboard/courses", icon: BookOpen }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certs.map((cert) => {
            const date = cert.completedAt?.toDate?.() ?? new Date();
            return (
              <Link
                key={cert.id}
                href={`/dashboard/certificates/${cert.id}`}
                className="group flex items-center gap-5 bg-gray-900/40 border border-gray-800 p-5 hover:border-amber-500/30 hover:bg-gray-900/60 transition-all"
              >
                <div className="h-14 w-14 shrink-0 flex items-center justify-center bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                  <Award className="h-7 w-7 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{cert.courseTitle}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {date.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}
                    {cert.hours > 0 && ` · ${cert.hours}h`}
                  </p>
                </div>
                <ExternalLink className="h-5 w-5 text-gray-600 group-hover:text-amber-400 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
