"use client";

import Link from "next/link";
import { Award, Loader2, AlertTriangle, BookOpen, ChevronRight, Building2 } from "lucide-react";
import { useCertificates } from "./_hooks/useCertificates";

export default function CertificatesPage() {
  const { certs, institutionName, loading, error } = useCertificates();

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-amber-400 mb-2">
          // certificados
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Os meus certificados</h1>
        <p className="mt-1 text-sm text-gray-600">
          {loading ? "A carregar..." : `${certs.length} certificado${certs.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Banner instituição */}
      {institutionName && !loading && (
        <div className="flex items-center gap-3 border border-amber-500 bg-amber-500/5 px-4 py-3">
          <Building2 className="h-4 w-4 text-amber-400 shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">
            Certificados emitidos por{" "}
            <span className="font-semibold text-amber-400">{institutionName}</span>
          </p>
        </div>
      )}

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={1.5} />
          <p className="text-sm text-amber-400">{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && certs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <Award className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            // sem certificados
          </p>
          <p className="text-sm text-gray-600 max-w-xs mb-6">
            Conclui um curso com certificado ativo para ganhar o teu primeiro.
          </p>
          <Link
            href="/dashboard/courses"
            className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-colors"
          >
            <BookOpen className="h-3 w-3" strokeWidth={1.5} />
            Explorar cursos
          </Link>
        </div>
      )}

      {/* ── Lista editorial — layout variado ── */}
      {!loading && certs.length > 0 && (
        <div className="space-y-2">
          {certs.map((cert, i) => {
            const isFirst = i === 0;
            const dateStr = cert.completedAt
              ? cert.completedAt.toLocaleDateString("pt-PT", {
                  day: "2-digit", month: "long", year: "numeric",
                })
              : "";

            return (
              <Link
                key={cert.id}
                href={`/dashboard/certificates/${cert.id}`}
                className={`group flex items-center gap-4 border border-gray-800 bg-gray-900 hover:border-amber-500 hover:bg-gray-900 transition-all ${
                  isFirst ? "p-5 sm:p-6" : "p-4"
                }`}
              >
                {/* Ícone */}
                <div className={`shrink-0 flex items-center justify-center border border-amber-500 bg-amber-500/8 group-hover:bg-amber-500/15 transition-colors ${
                  isFirst ? "h-12 w-12" : "h-9 w-9"
                }`}>
                  <Award className={`text-amber-400 ${isFirst ? "h-6 w-6" : "h-4 w-4"}`} strokeWidth={1.5} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {isFirst && (
                    <p className="font-mono text-[13px] uppercase tracking-widest text-amber-400 mb-1">
                      mais recente
                    </p>
                  )}
                  <p className={`font-bold text-gray-200 group-hover:text-white truncate transition-colors ${
                    isFirst ? "text-base" : "text-sm"
                  }`}>
                    {cert.courseTitle}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[13px] text-gray-700">
                    {dateStr && <span>{dateStr}</span>}
                    {cert.hours > 0 && (
                      <>
                        <span>·</span>
                        <span>{cert.hours}h</span>
                      </>
                    )}
                    {cert.certificateId && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[120px]">{cert.certificateId}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Acção */}
                <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-amber-400 shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
