"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  Award, ArrowLeft, Printer, Loader2, CheckCircle2, Clock,
  BookOpen, Share2,
} from "lucide-react";
import Link from "next/link";
import type { Course } from "@/types/course";

interface CertificateData {
  courseTitle: string;
  studentName: string;
  completedAt: string;
  certificateId: string;
  hours: number;
  courseId: string;
}

export default function CertificatePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (!user || !courseId) return;
    const load = async () => {
      try {
        const [certSnap, courseSnap] = await Promise.all([
          getDoc(doc(db, "certificates", user.uid, "courses", courseId)),
          getDoc(doc(db, "courses", courseId)),
        ]);

        if (!certSnap.exists()) {
          setError("Certificado não encontrado. Completa o curso primeiro.");
          setLoading(false);
          return;
        }

        const d = certSnap.data();
        setCert({
          courseTitle: d.courseTitle,
          studentName: d.studentName,
          completedAt: d.completedAt?.toDate?.()?.toLocaleDateString("pt-PT") ?? new Date().toLocaleDateString("pt-PT"),
          certificateId: d.certificateId,
          hours: d.hours ?? 0,
          courseId: d.courseId,
        });

        if (courseSnap.exists()) {
          setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
        }
      } catch {
        setError("Erro ao carregar certificado.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <Award className="h-16 w-16 text-gray-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Certificado indisponível</h2>
        <p className="text-gray-400 mb-6">{error || "Não foi possível carregar o certificado."}</p>
        <Link href="/dashboard/courses" className="text-purple hover:text-purple-light font-bold">
          Ver cursos
        </Link>
      </div>
    );
  }

  const certDate = new Date(cert.completedAt);
  const day = certDate.getDate();
  const month = certDate.toLocaleDateString("pt-PT", { month: "long" });
  const year = certDate.getFullYear();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Top actions */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <Link href="/dashboard/courses" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos cursos
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors print:hidden">
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Certificate card (printable) */}
      <div id="certificate" className="border border-gray-800 bg-gray-900/60 overflow-hidden relative print:border-none print:shadow-none">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 print:hidden">
          <div className="absolute top-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-purple/5 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-green/5 blur-[120px]" />
        </div>

        {/* Print-only background */}
        <div className="hidden print:block absolute inset-0 bg-white" />

        <div className="relative p-8 sm:p-12 md:p-16 print:p-8">
          {/* Top border accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple via-green to-amber-400 print:h-1 print:from-purple-600 print:via-green-600 print:to-amber-500" />

          {/* Logo area */}
          <div className="flex items-center justify-between mb-10 print:mb-6">
            <div className="flex items-center gap-3">
              <img src="/Logo-Academy-White.svg" alt="Netsulwel Academy" className="h-10 w-auto print:hidden" />
              <img src="/Logo-Academy.svg" alt="Netsulwel Academy" className="hidden print:block h-10 w-auto" />
              <span className="text-xl font-bold text-white print:text-gray-900">Netsulwel Academy</span>
            </div>
            <Award className="h-10 w-10 text-amber-400 print:text-amber-600" strokeWidth={1.5} />
          </div>

          {/* Title */}
          <div className="text-center mb-10 print:mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400 print:text-amber-600 mb-2">Certificado de Conclusão</p>
            <div className="w-16 h-0.5 bg-amber-400/50 mx-auto print:bg-amber-600/50" />
          </div>

          {/* Body */}
          <div className="text-center mb-10 print:mb-8">
            <p className="text-lg text-gray-400 print:text-gray-600 mb-2">Certificamos que</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white print:text-gray-900 mb-4">
              {cert.studentName}
            </h2>
            <p className="text-lg text-gray-400 print:text-gray-600">
              concluiu com êxito o curso
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-purple print:text-purple-700 mt-3 mb-6">
              {cert.courseTitle}
            </h3>

            <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-6 text-sm text-gray-500 print:text-gray-600">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {cert.hours}h
              </span>
              {course?.hasCertificate && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-400 print:text-green-600" />
                  Com certificado
                </span>
              )}
              {course?.modulesCount && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {course.modulesCount} módulos
                </span>
              )}
            </div>
          </div>

          {/* Completion date */}
          <div className="text-center mb-10 print:mb-8">
            <p className="text-sm text-gray-500 print:text-gray-600">
              Concluído em {day} de {month} de {year}
            </p>
          </div>

          {/* Signatures */}
          <div className="flex items-center justify-center flex-wrap gap-8 sm:gap-16 mb-10 print:mb-8">
            <div className="text-center">
              <div className="w-40 h-px bg-gray-600 print:bg-gray-400 mb-2" />
              <p className="text-sm text-gray-500 print:text-gray-600">Diretor Académico</p>
            </div>
            <div className="text-center">
              <div className="w-40 h-px bg-gray-600 print:bg-gray-400 mb-2" />
              <p className="text-sm text-gray-500 print:text-gray-600">Coordenador</p>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="text-center">
            <p className="text-xs text-gray-600 print:text-gray-400 font-mono">
              ID do Certificado: {cert.certificateId}
            </p>
            <p className="text-xs text-gray-700 print:text-gray-400 mt-1">
              Verifique a autenticidade em netsulwel.tech/verificar
            </p>
          </div>

          {/* Bottom border accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-green to-purple print:h-1 print:from-amber-500 print:via-green-600 print:to-purple-600" />
        </div>
      </div>

      {/* Info box */}
      <div className="mt-6 p-5 border border-gray-800 bg-gray-900/40 flex items-start gap-4 print:hidden">
        <Share2 className="h-5 w-5 text-purple shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-400">
            Este certificado pode ser verificado por qualquer pessoa através do ID único acima.
            Para partilhar, usa o botão <strong>Imprimir</strong> e guarda como PDF.
          </p>
        </div>
      </div>
    </div>
  );
}
