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
      <div className="max-w-[56rem] mx-auto py-20 text-center px-4">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900 mx-auto">
          <Award className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">
          // certificado indisponível
        </p>
        <p className="text-sm text-gray-600 mb-6">
          {error || "Não foi possível carregar o certificado."}
        </p>
        <Link href="/dashboard/certificates" className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
          ← Voltar aos certificados
        </Link>
      </div>
    );
  }

  const day   = cert.completedAt.getDate();
  const month = cert.completedAt.toLocaleDateString("pt-PT", { month: "long" });
  const year  = cert.completedAt.getFullYear();
  const dateFormatted = `${day} de ${month}, ${year}`;

  return (
    <div className="max-w-[960px] mx-auto space-y-6 animate-in fade-in duration-300">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => router.push("/dashboard/certificates")}
          className="flex items-center gap-1 font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors shrink-0"
        >
          <ChevronLeft className="h-3 w-3" /> <span className="hidden sm:inline">Certificados</span>
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 border border-gray-800 bg-gray-900 px-3 sm:px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-500 hover:border-purple-500 hover:text-purple-400 transition-all shrink-0"
        >
          <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Imprimir / Guardar PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CERTIFICADO — Premium Split Layout
      ══════════════════════════════════════════════════════════ */}
      <div
        id="certificate"
        className="relative overflow-hidden shadow-2xl shadow-purple-900/30"
        style={{ aspectRatio: "1.4142 / 1" /* A4 landscape */ }}
      >
        {/* ── Left Panel (Light) ── */}
        <div className="absolute inset-0 right-[38%]" style={{ background: "linear-gradient(135deg, #fafafa 0%, #f3f0f7 50%, #ede8f5 100%)" }}>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, #7c3aed 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />
        </div>

        {/* ── Right Panel (Dark Purple Gradient) ── */}
        <div className="absolute inset-0 left-[62%]" style={{
          background: "linear-gradient(160deg, #1a0533 0%, #0f0320 40%, #170430 70%, #1e0640 100%)",
        }}>
          {/* Glow effects */}
          <div className="absolute top-0 right-0 w-[70%] h-[60%] rounded-full opacity-20" style={{
            background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)",
            filter: "blur(40px)",
          }} />
          <div className="absolute bottom-[20%] left-[10%] w-[50%] h-[40%] rounded-full opacity-15" style={{
            background: "radial-gradient(ellipse, #a855f7 0%, transparent 70%)",
            filter: "blur(50px)",
          }} />
        </div>

        {/* ── Diagonal Divider Overlay ── */}
        <div className="absolute inset-0" style={{
          clipPath: "polygon(58% 0, 66% 0, 62% 100%, 54% 100%)",
          background: "linear-gradient(180deg, rgba(124,58,237,0.08) 0%, rgba(124,58,237,0.03) 100%)",
        }} />

        {/* ── Top accent bar ── */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{
          background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 30%, #c084fc 50%, #a855f7 70%, #7c3aed 100%)",
        }} />
        {/* ── Bottom accent bar ── */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{
          background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 30%, #c084fc 50%, #a855f7 70%, #7c3aed 100%)",
        }} />

        {/* ── Left border accent ── */}
        <div className="absolute top-0 left-0 bottom-0 w-[3px]" style={{
          background: "linear-gradient(180deg, #7c3aed 0%, #a855f7 50%, #7c3aed 100%)",
        }} />

        {/* ══ Content Layer ══ */}
        <div className="absolute inset-0 flex">

          {/* ──── LEFT CONTENT ──── */}
          <div className="flex-1 flex flex-col justify-between px-[5%] py-[4%]" style={{ maxWidth: "62%" }}>

            {/* Date */}
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#7c3aed" }}>
                DATA: {dateFormatted}
              </p>
            </div>

            {/* Main Content */}
            <div className="space-y-3 flex-1 flex flex-col justify-center -mt-[2%]">
              {/* Title */}
              <h1 className="font-extrabold uppercase tracking-wide leading-tight" style={{
                fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)",
                color: "#1a1a2e",
                letterSpacing: "0.04em",
              }}>
                Certificado de Conclusão
              </h1>

              {/* Subtitle */}
              <p className="text-sm" style={{ color: "#ffffff", fontWeight: 500 }}>
                Netsulwel Academy certifica que
              </p>

              {/* Student Name */}
              <h2 style={{
                fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: 700,
                color: "#1a1a2e",
                lineHeight: 1.1,
                marginTop: "0.25rem",
                marginBottom: "0.25rem",
              }}>
                {cert.studentName}
              </h2>

              {/* Course completion info */}
              <div className="space-y-1.5" style={{ maxWidth: "85%" }}>
                <p className="text-sm" style={{ color: "#ffffff", fontWeight: 500 }}>
                  concluiu com êxito o curso
                </p>
                <p className="font-bold" style={{
                  fontSize: "clamp(0.9rem, 2vw, 1.15rem)",
                  color: "#7c3aed",
                }}>
                  {cert.courseTitle}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#ffffff" }}>
                  oferecido por <strong style={{ color: "#1a1a2e" }}>Netsulwel Academy</strong>
                </p>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed mt-2" style={{ color: "#ffffff", maxWidth: "90%" }}>
                Este certificado reconhece a conclusão de{" "}
                {cert.hours > 0 && <>{cert.hours} horas de </>}
                formação abrangente{course?.modulesCount ? `, composta por ${course.modulesCount} módulos` : ""},
                demonstrando competências práticas e conhecimento especializado na área.
              </p>
            </div>

            {/* Footer — Signatures & date */}
            <div className="flex items-end gap-8">
              {/* Signature 1 */}
              <div className="text-center">
                {/* Signature mark */}
                <svg width="80" height="28" viewBox="0 0 80 28" className="mx-auto mb-1">
                  <path d="M5 20 C15 5, 25 25, 35 12 S50 5, 55 18 Q60 24, 70 14" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M55 18 C58 12, 62 20, 65 15 S70 10, 75 16" stroke="#1a1a2e" strokeWidth="1" fill="none" strokeLinecap="round" />
                </svg>
                <div className="w-24 h-px mb-1.5" style={{ backgroundColor: "#ccc" }} />
                <p className="text-[13px] font-bold" style={{ color: "#1a1a2e" }}>Netsulwel Academy</p>
                <p className="text-[13px]" style={{ color: "#ffffff" }}>Direção</p>
              </div>

              {/* Signature 2 */}
              <div className="text-center">
                <svg width="80" height="28" viewBox="0 0 80 28" className="mx-auto mb-1">
                  <path d="M8 22 C18 8, 28 18, 38 10 Q48 2, 58 16 T72 12" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M58 16 C62 22, 66 12, 72 18" stroke="#1a1a2e" strokeWidth="1" fill="none" strokeLinecap="round" />
                </svg>
                <div className="w-24 h-px mb-1.5" style={{ backgroundColor: "#ccc" }} />
                <p className="text-[13px] font-bold" style={{ color: "#1a1a2e" }}>Formador</p>
                <p className="text-[13px]" style={{ color: "#ffffff" }}>Responsável do Curso</p>
              </div>
            </div>
          </div>

          {/* ──── RIGHT CONTENT ──── */}
          <div className="flex flex-col items-center justify-between py-[5%] px-[3%]" style={{ width: "38%" }}>

            {/* Glowing Badge / Shield */}
            <div className="relative flex items-center justify-center mt-[5%]">
              {/* Outer glow ring */}
              <div className="absolute w-28 h-28 rounded-full" style={{
                background: "conic-gradient(from 0deg, #7c3aed, #a855f7, #c084fc, #a855f7, #7c3aed)",
                opacity: 0.3,
                filter: "blur(15px)",
                animation: "cert-glow-pulse 4s ease-in-out infinite",
              }} />
              {/* Shield icon container */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Shield SVG */}
                <svg viewBox="0 0 80 90" className="w-full h-full" style={{ filter: "drop-shadow(0 0 20px rgba(168,85,247,0.5))" }}>
                  <defs>
                    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "#a855f7" }} />
                      <stop offset="50%" style={{ stopColor: "#7c3aed" }} />
                      <stop offset="100%" style={{ stopColor: "#6d28d9" }} />
                    </linearGradient>
                    <linearGradient id="shieldInner" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "#c084fc" }} />
                      <stop offset="100%" style={{ stopColor: "#7c3aed" }} />
                    </linearGradient>
                  </defs>
                  <path d="M40 5 L70 20 L70 50 Q70 70 40 85 Q10 70 10 50 L10 20 Z" fill="url(#shieldGrad)" opacity="0.9" />
                  <path d="M40 12 L63 24 L63 48 Q63 64 40 77 Q17 64 17 48 L17 24 Z" fill="url(#shieldInner)" opacity="0.5" />
                  {/* Award icon inside */}
                  <g transform="translate(26, 28) scale(0.35)" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="40" cy="30" r="18" />
                    <path d="M28 44 L22 70 L40 60 L58 70 L52 44" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Circular Seal */}
            <div className="relative flex items-center justify-center my-auto">
              {/* Outer notched ring */}
              <svg viewBox="0 0 140 140" className="w-32 h-32">
                <defs>
                  <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#7c3aed" }} />
                    <stop offset="100%" style={{ stopColor: "#a855f7" }} />
                  </linearGradient>
                </defs>
                {/* Notched circle (gear-like) */}
                {Array.from({ length: 36 }).map((_, i) => {
                  const angle = (i * 10) * (Math.PI / 180);
                  const outerR = i % 2 === 0 ? 68 : 63;
                  const x = 70 + outerR * Math.cos(angle);
                  const y = 70 + outerR * Math.sin(angle);
                  const nextAngle = ((i + 1) * 10) * (Math.PI / 180);
                  const nextR = (i + 1) % 2 === 0 ? 68 : 63;
                  const nx = 70 + nextR * Math.cos(nextAngle);
                  const ny = 70 + nextR * Math.sin(nextAngle);
                  return (
                    <line key={i} x1={x} y1={y} x2={nx} y2={ny} stroke="url(#sealGrad)" strokeWidth="2" />
                  );
                })}
                {/* Inner circle */}
                <circle cx="70" cy="70" r="55" fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity="0.8" />
                <circle cx="70" cy="70" r="50" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.5" />

                {/* Circular text */}
                <defs>
                  <path id="topArc" d="M 20,70 a 50,50 0 1,1 100,0" />
                  <path id="bottomArc" d="M 120,70 a 50,50 0 1,1 -100,0" />
                </defs>
                <text fontSize="7" fill="#c084fc" fontFamily="monospace" letterSpacing="3">
                  <textPath href="#topArc" startOffset="50%" textAnchor="middle">
                    NETSULWEL ACADEMY
                  </textPath>
                </text>
                <text fontSize="6.5" fill="#a855f7" fontFamily="monospace" letterSpacing="2">
                  <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
                    CERTIFICADO OFICIAL
                  </textPath>
                </text>

                {/* Center icon */}
                <g transform="translate(55, 55)">
                  <Award className="text-purple-400" />
                  <rect x="0" y="0" width="30" height="30" fill="none" stroke="#c084fc" strokeWidth="0.5" rx="2" />
                  <g transform="translate(4, 3) scale(0.9)" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="9" r="6" />
                    <path d="M7 14 L4 24 L12 20 L20 24 L17 14" />
                  </g>
                </g>
              </svg>

              {/* Seal glow */}
              <div className="absolute w-32 h-32 rounded-full" style={{
                background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
                filter: "blur(10px)",
              }} />
            </div>

            {/* Logo + Academy Name */}
            <div className="flex items-center gap-2.5 mb-[3%]">
              <img
                src="/Logo-Academy-White.svg"
                alt="Netsulwel Academy"
                className="h-10 w-auto"
                style={{ filter: "drop-shadow(0 0 8px rgba(168,85,247,0.4))" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div>
                <p className="text-sm font-bold text-white tracking-wide leading-none">NETSULWEL</p>
                <p className="text-[13px] font-medium tracking-[0.25em] uppercase leading-none mt-0.5" style={{ color: "#a855f7" }}>
                  Academy
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Certificate ID watermark ── */}
        <div className="absolute bottom-[3%] left-[5%]">
          <p className="font-mono text-[7px] uppercase tracking-widest" style={{ color: "#ffffff" }}>
            ID: {cert.certificateId}
          </p>
          <p className="font-mono text-[7px]" style={{ color: "#ffffff" }}>
            netsulwel.tech/verificar
          </p>
        </div>

        {/* ── Stats on right panel bottom ── */}
        <div className="absolute bottom-[8%] right-[3%] flex flex-col items-end gap-1">
          {cert.hours > 0 && (
            <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "#a78bfa" }}>
              <Clock className="h-3 w-3" strokeWidth={1.5} />
              {cert.hours}h de conteúdo
            </span>
          )}
          {course?.modulesCount && (
            <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "#a78bfa" }}>
              <BookOpen className="h-3 w-3" strokeWidth={1.5} />
              {course.modulesCount} módulos
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "#86efac" }}>
            <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
            Aprovado
          </span>
        </div>
      </div>

      {/* ── Glow animation keyframes ── */}
      <style>{`
        @keyframes cert-glow-pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.08); }
        }

        @media print {
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate {
            position: fixed; inset: 0;
            width: 100vw; height: 100vh;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* ── Nota ── */}
      <div className="flex items-start gap-3 border border-gray-800 bg-gray-900 px-4 py-3 print:hidden">
        <Share2 className="h-4 w-4 text-gray-700 shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-sm text-gray-600 leading-relaxed">
          Usa <span className="text-gray-400 font-medium">Imprimir / Guardar PDF</span> para exportar em A4 horizontal.
          O certificado pode ser verificado pelo ID em{" "}
          <span className="text-gray-400">netsulwel.tech/verificar</span>.
        </p>
      </div>
    </div>
  );
}
