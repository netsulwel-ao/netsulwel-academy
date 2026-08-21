"use client";

import { useCountdown } from "@/hooks/useCountdown";
import Link from "next/link";

interface Props {
  targetDate: string | Date;
  label?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export default function Variant4Purple({ targetDate, label, ctaLabel, ctaUrl }: Props) {
  const t = useCountdown(targetDate);

  if (t.expired) return null;

  const units: { value: number; label: string }[] = [
    { value: t.d, label: "Dias" },
    { value: t.h, label: "Horas" },
    { value: t.m, label: "Minutos" },
    { value: t.s, label: "Segundos" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#2d0a4d] to-[#a020f0] px-8 py-8">
      <div className="text-center sm:text-left">
        <h3 className="text-xl sm:text-2xl font-bold text-white">{label || "Oferta Exclusiva"}</h3>
        <p className="text-sm text-white mt-1">Garanta o seu acesso antes que termine</p>
      </div>
      <div className="flex items-center gap-3">
        {units.map((u, i) => (
          <div key={u.label} className="flex flex-col items-center justify-center w-16 h-20 bg-white border border-white rounded-lg">
            <span className="text-2xl font-bold text-white tabular-nums">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[13px] text-white mt-0.5">{u.label}</span>
          </div>
        ))}
      </div>
      {ctaUrl ? (
        <Link href={ctaUrl}
          className="bg-white text-[#a020f0] hover:bg-white font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
          {ctaLabel || "Garantir vaga"}
        </Link>
      ) : (
        <button
          className="bg-white text-[#a020f0] hover:bg-white font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
          {ctaLabel || "Garantir vaga"}
        </button>
      )}
    </div>
  );
}
