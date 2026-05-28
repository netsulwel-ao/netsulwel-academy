"use client";

import { useCountdown } from "@/hooks/useCountdown";

interface Props {
  targetDate: string | Date;
  label?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export default function Variant3DarkCards({ targetDate, label }: Props) {
  const t = useCountdown(targetDate);

  if (t.expired) return null;

  const units: { value: number; label: string }[] = [
    { value: t.d, label: "dias" },
    { value: t.h, label: "horas" },
    { value: t.m, label: "min" },
    { value: t.s, label: "seg" },
  ];

  return (
    <div className="flex flex-col items-center gap-3 bg-black py-8 px-4">
      {label && <span className="text-white font-bold text-sm uppercase tracking-wider">{label}</span>}
      <div className="flex items-center justify-center gap-2">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center justify-center w-20 h-24 bg-gray-900 border border-gray-800 rounded-lg">
              <span className="text-3xl font-bold text-white tabular-nums">
                {String(u.value).padStart(2, "0")}
              </span>
              <span className="text-xs text-gray-500 mt-1">{u.label}</span>
            </div>
            {i < units.length - 1 && <span className="text-gray-600 text-2xl font-bold">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
