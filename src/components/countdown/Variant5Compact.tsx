"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { Clock } from "lucide-react";

interface Props {
  targetDate: string | Date;
  label?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export default function Variant5Compact({ targetDate, label }: Props) {
  const t = useCountdown(targetDate);

  if (t.expired) return null;

  const units: { value: number; label: string }[] = [
    { value: t.d, label: "dias" },
    { value: t.h, label: "hrs" },
    { value: t.m, label: "min" },
    { value: t.s, label: "seg" },
  ];

  return (
    <div className="flex items-center justify-between gap-4 bg-gray-800 px-5 py-3 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Clock className="h-5 w-5 text-[#a020f0]" />
        <span>{label || "Oferta termina em"}</span>
      </div>
      <div className="flex items-center gap-2">
        {units.map((u, i) => (
          <div key={u.label} className="flex flex-col items-center justify-center w-14 h-14 bg-[#a020f0] rounded-lg">
            <span className="text-lg font-bold text-white tabular-nums leading-none">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[9px] text-white/70 leading-none mt-0.5">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
