"use client";

import { useCountdown } from "@/hooks/useCountdown";
import Link from "next/link";

interface Props {
  targetDate: string | Date;
  label?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export default function Variant2TopBar({ targetDate, label, ctaLabel, ctaUrl }: Props) {
  const t = useCountdown(targetDate);

  if (t.expired) return null;

  const units: { value: number; label: string }[] = [
    { value: t.d, label: "DIAS" },
    { value: t.h, label: "HORAS" },
    { value: t.m, label: "MIN" },
    { value: t.s, label: "SEG" },
  ];

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 bg-[#6b0f1a] px-6 py-2.5 text-white flex-wrap">
      <span className="text-sm sm:text-sm font-bold uppercase tracking-wider shrink-0">
        {label || "Oferta por tempo limitado"}
      </span>
      <div className="flex items-center gap-1 sm:gap-2">
        {units.map((u, i) => (
          <div key={u.label} className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-bold tabular-nums leading-none">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[13px] sm:text-sm mt-0.5 opacity-80">{u.label}</span>
          </div>
        ))}
      </div>
      {ctaLabel && ctaUrl && (
        <Link href={ctaUrl}
          className="text-sm font-bold uppercase underline underline-offset-4 hover:no-underline transition-all">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
