"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Award, Printer, Loader2,
  CheckCircle2, Clock, BookOpen, Share2,
} from "lucide-react";
import { useCertificateDetail } from "../_hooks/useCertificateDetail";

export default function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { cert, course, loading, error } = useCertificateDetail(courseId);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="max-w-[56rem] mx-auto py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900 mx-auto">
          <Award className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-3">
          // certificado indisponível
        </p>
        <p className="text-sm text-gray-600 mb-6">
          {error || "Não foi possível carregar o certificado."}
        </p>
        <Link
          href="/dashboard/certificates"
          className="font-mono text-[10px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← Voltar aos certificados
        </Link>
      </div>
    );
  }

  const day   = cert.completedAt.getDate();
  const month = cert.completedAt.toLocaleDateString("pt-PT", { month: "long" });
  const year  = cert.completedAt.getFullYear();

  return (
    <div className="max-w-[72rem] mx-auto space-y-6 animate-in fade-in duration-300">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => router.push("/dashboard/certificates")}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors"
        >
          <ChevronLeft className="h-3 w-3" /> Certificados
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 border border-gray-800 bg-gray-900/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:border-amber-500/30 hover:text-amber-400/70 transition-all"
        >
          <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
          Imprimir / PDF
        </button>
      </div>

      {/* ── Certificado imprimível ── */}
      <div
        id="certificate"
        className="relative overflow-hidden border border-gray-800/60 bg-gray-900/20 print:border-gray-300 print:bg-white"
      >
        {/* Linha decorativa topo */}
        <div className="h-1 bg-gradient-to-r from-purple via-amber-400 to-green print:from-purple-600 print:via-amber-500 print:to-green-600" />

        <div className="px-8 py-12 sm:px-16 sm:py-16 print:px-12 print:py-10">

          {/* Logo + ícone */}
          <div className="flex items-center justify-between mb-12 print:mb-10">
            <div className="flex items-center gap-3">
              <img
                src="/Logo-Academy-White.svg"
                alt="Netsulwel Academy"
                className="h-10 w-auto print:hidden"
              />
              <img
                src="/Logo-Academy.svg"
                alt="Netsulwel Academy"
                className="hidden print:block h-10 w-auto"
              />
              <span className="text-lg font-bold text-gray-200 print:text-gray-900">
                Netsulwel Academy
              </span>
            </div>
            <Award className="h-10 w-10 text-amber-400/60 print:text-amber-600" strokeWidth={1} />
          </div>

          {/* Eyebrow */}
          <div className="text-center mb-10 print:mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400/70 print:text-amber-700 mb-3">
              certificado de conclusão
            </p>
            <div className="mx-auto h-px w-16 bg-amber-400/30 print:bg-amber-600/40" />
          </div>

          {/* Corpo */}
          <div className="text-center mb-10 print:mb-8">
            <p className="text-sm text-gray-600 print:text-gray-500 mb-3">Certificamos que</p>

            <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 print:text-gray-900 mb-4 leading-tight">
              {cert.studentName}
            </h2>

            <p className="text-sm text-gray-600 print:text-gray-500 mb-3">
              concluiu com êxito o curso
            </p>

            <h3 className="text-xl sm:text-2xl font-bold text-purple/90 print:text-purple-800 leading-snug mb-8">
              {cert.courseTitle}
            </h3>

            {/* Meta stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 print:text-gray-500">
              {cert.hours > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" strokeWidth={1.5} />
                  {cert.hours}h de conteúdo
                </span>
              )}
              {course?.hasCertificate && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green/60 print:text-green-600" strokeWidth={1.5} />
                  Certificado verificado
                </span>
              )}
              {course?.modulesCount && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" strokeWidth={1.5} />
                  {course.modulesCount} módulos
                </span>
              )}
            </div>
          </div>

          {/* Data */}
          <div className="text-center mb-12 print:mb-10">
            <p className="font-mono text-xs text-gray-600 print:text-gray-500">
              {day} de {month} de {year}
            </p>
          </div>

          {/* Assinaturas */}
          <div className="flex flex-wrap items-end justify-center gap-12 sm:gap-20 mb-12 print:mb-10">
            {[
              { label: "Diretor Académico" },
              { label: "Coordenador" },
            ].map(({ label }) => (
              <div key={label} className="text-center">
                <div className="w-36 h-px bg-gray-700 print:bg-gray-400 mb-2" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 print:text-gray-500">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* ID + verificação */}
          <div className="text-center border-t border-gray-800/40 print:border-gray-300 pt-6">
            <p className="font-mono text-[10px] text-gray-700 print:text-gray-500">
              ID: {cert.certificateId}
            </p>
            <p className="font-mono text-[9px] text-gray-800 print:text-gray-400 mt-1">
              netsulwel.tech/verificar
            </p>
          </div>
        </div>

        {/* Linha decorativa fundo */}
        <div className="h-1 bg-gradient-to-r from-green via-amber-400 to-purple print:from-green-600 print:via-amber-500 print:to-purple-600" />
      </div>

      {/* ── Nota de partilha ── */}
      <div className="flex items-start gap-3 border border-gray-800/60 bg-gray-900/10 px-4 py-3 print:hidden">
        <Share2 className="h-4 w-4 text-gray-700 shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-xs text-gray-600 leading-relaxed">
          Usa o botão <span className="text-gray-400 font-medium">Imprimir / PDF</span> para guardar ou partilhar.
          O certificado pode ser verificado pelo ID acima em{" "}
          <span className="text-gray-400">netsulwel.tech/verificar</span>.
        </p>
      </div>
    </div>
  );
}
