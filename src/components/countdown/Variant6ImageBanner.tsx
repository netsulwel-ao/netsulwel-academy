"use client";
import { useCountdown } from "@/hooks/useCountdown";
import Link from "next/link";
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23202224'/%3E%3Ctext x='200' y='110' text-anchor='middle' fill='%23666' font-size='16' font-family='sans-serif'%3EPromo%3C/text%3E%3C/svg%3E";

interface Props {
  targetDate: string | Date;
  label?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  badgeLabel?: string;
}

export default function Variant6ImageBanner({
  targetDate,
  label,
  ctaLabel,
  ctaUrl,
  imageUrl,
  badgeLabel,
}: Props) {
  const t = useCountdown(targetDate);
  if (t.expired) return null;

  const units: { value: number; label: string }[] = [
    { value: t.d, label: "dias" },
    { value: t.h, label: "hrs" },
    { value: t.m, label: "min" },
    { value: t.s, label: "seg" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full bg-[#0d0d0d] gap-3 sm:gap-0 px-4 sm:px-6 py-4 sm:h-[100px]">

      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 flex-1 min-w-0">

        <div className="hidden sm:block relative w-44 lg:w-56 h-full flex-shrink-0 overflow-hidden">
          <img src={imageUrl || PLACEHOLDER} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0d0d0d]" />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-4 flex-1 min-w-0">

          {badgeLabel && (
            <span className="bg-[#a020f0] text-white text-[11px] sm:text-[13px] font-bold px-3 sm:px-4 py-1.5 rounded-full whitespace-nowrap">
              {badgeLabel}
            </span>
          )}

          <span className="text-white text-sm sm:text-lg font-bold whitespace-nowrap truncate">
            {label || "Oferta Especial"}
          </span>

          <span className="hidden sm:inline text-white text-xl font-light">|</span>
          <span className="hidden sm:inline text-white text-sm whitespace-nowrap">Termina em</span>

          <div className="flex items-center gap-1 sm:gap-2">
            {units.flatMap((u, i) => [
              <div
                key={u.label}
                className="flex flex-col items-center justify-center w-11 h-12 sm:w-14 sm:h-14 bg-[#a020f0] rounded-lg flex-shrink-0"
              >
                <span className="text-lg sm:text-xl font-bold text-white leading-none tabular-nums">
                  {String(u.value).padStart(2, "0")}
                </span>
                <span className="text-[8px] sm:text-[10px] text-white leading-none mt-0.5">
                  {u.label}
                </span>
              </div>,
              i < units.length - 1 ? (
                <span key={`sep-${u.label}`} className="text-white text-sm sm:text-lg font-bold">:</span>
              ) : null,
            ])}
          </div>
        </div>
      </div>

      {ctaUrl ? (
        <Link
          href={ctaUrl}
          className="bg-[#a020f0] hover:bg-[#b830f8] text-white px-5 py-2.5 text-sm font-bold rounded-lg whitespace-nowrap flex-shrink-0 text-center transition-colors"
        >
          {ctaLabel || "VER OFERTA"}
        </Link>
      ) : (
        <button className="bg-[#a020f0] hover:bg-[#b830f8] text-white px-5 py-2.5 text-sm font-bold rounded-lg whitespace-nowrap flex-shrink-0 text-center transition-colors">
          {ctaLabel || "VER OFERTA"}
        </button>
      )}
    </div>
  );
}
