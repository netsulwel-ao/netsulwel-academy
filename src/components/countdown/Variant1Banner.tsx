"use client";

import { useCountdown, type CountdownTime } from "@/hooks/useCountdown";
import Link from "next/link";

interface Props {
  targetDate: string | Date;
  label?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

function formatTime(t: CountdownTime) {
  if (t.expired) return "EXPIRADO";
  return `${String(t.d).padStart(2, "0")}d ${String(t.h).padStart(2, "0")}h ${String(t.m).padStart(2, "0")}m ${String(t.s).padStart(2, "0")}s`;
}

export default function Variant1Banner({ targetDate, label, ctaLabel, ctaUrl }: Props) {
  const t = useCountdown(targetDate);

  return (
    <div className="flex items-center justify-between gap-4 bg-black px-6 py-3 text-sm">
      <span className="text-white font-bold text-base shrink-0">{label || "🔥 Oferta Especial"}</span>
      <div className="flex items-center gap-3">
        <span className="bg-[#a020f0] text-white font-bold px-5 py-2 rounded-full whitespace-nowrap tabular-nums">
          {formatTime(t)}
        </span>
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#a020f0] text-white font-bold text-xs leading-tight text-center">
          82%<br />OFF
        </div>
      </div>
      {ctaUrl ? (
        <Link href={ctaUrl}
          className="border border-[#a020f0] text-[#a020f0] hover:bg-[#a020f0] hover:text-white font-bold px-5 py-2 rounded-full transition-colors whitespace-nowrap">
          {ctaLabel || "MATRICULE-SE"}
        </Link>
      ) : (
        <button
          className="border border-[#a020f0] text-[#a020f0] hover:bg-[#a020f0] hover:text-white font-bold px-5 py-2 rounded-full transition-colors whitespace-nowrap">
          {ctaLabel || "MATRICULE-SE"}
        </button>
      )}
    </div>
  );
}
