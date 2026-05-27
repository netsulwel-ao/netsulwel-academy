"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, X, ChevronRight } from "lucide-react";
import type { CountdownBanner as CountdownBannerType, AnnouncementTarget } from "@/types/announcement";

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; btn: string }> = {
  red:    { bg: "bg-red-950/80",    text: "text-red-300",    border: "border-red-800/60",    btn: "bg-red-600 hover:bg-red-500 text-white" },
  yellow: { bg: "bg-yellow-950/80", text: "text-yellow-300", border: "border-yellow-800/60", btn: "bg-yellow-500 hover:bg-yellow-400 text-gray-900" },
  blue:   { bg: "bg-blue-950/80",   text: "text-blue-300",   border: "border-blue-800/60",   btn: "bg-blue-600 hover:bg-blue-500 text-white" },
  green:  { bg: "bg-green-950/80",  text: "text-green-300",  border: "border-green-800/60",  btn: "bg-green-600 hover:bg-green-500 text-white" },
  purple: { bg: "bg-purple-950/80", text: "text-purple-300", border: "border-purple-800/60", btn: "bg-purple-600 hover:bg-purple-500 text-white" },
};

function useCountdown(endsAt: string) {
  const calc = () => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, expired: false };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return time;
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl font-bold text-white tabular-nums w-8 text-center">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function BannerItem({ banner, onDismiss }: { banner: CountdownBannerType; onDismiss: () => void }) {
  const time = useCountdown(banner.endsAt);
  const c = COLOR_CLASSES[banner.color] ?? COLOR_CLASSES.blue;

  if (time.expired) return null;

  return (
    <div className={`w-full border-b ${c.bg} ${c.border} backdrop-blur-xl`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4 flex-wrap sm:flex-nowrap">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <Clock className={`h-4 w-4 ${c.text}`} />
          <span className={`text-sm font-semibold ${c.text}`}>{banner.label}</span>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-3 shrink-0">
          {time.d > 0 && <><TimeUnit value={time.d} label="dias" /><span className="text-gray-500 font-bold text-lg">:</span></>}
          <TimeUnit value={time.h} label="horas" />
          <span className="text-gray-500 font-bold text-lg">:</span>
          <TimeUnit value={time.m} label="min" />
          <span className="text-gray-500 font-bold text-lg">:</span>
          <TimeUnit value={time.s} label="seg" />
        </div>

        {/* CTA */}
        {banner.ctaLabel && banner.ctaUrl && (
          <a href={banner.ctaUrl} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-colors shrink-0 ${c.btn}`}>
            {banner.ctaLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        )}

        {/* Dismiss */}
        <button onClick={onDismiss} className="ml-auto shrink-0 text-gray-500 hover:text-white transition-colors p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function CountdownBanner() {
  const { user, plan } = useAuth();
  const [banners, setBanners] = useState<CountdownBannerType[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "countdownBanners"), where("active", "==", true))
        );
        const now = new Date();
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as CountdownBannerType))
          .filter((b) => {
            if (new Date(b.endsAt) <= now) return false;
            const targets: AnnouncementTarget[] = ["all"];
            if (plan === "smart") targets.push("smart");
            if (plan === "golden") targets.push("smart", "golden");
            if (plan === "free") targets.push("free");
            return targets.includes(b.target);
          });
        setBanners(all);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, [plan]);

  const visible = banners.filter((b) => !dismissed.includes(b.id!));
  if (visible.length === 0) return null;

  return (
    <div className="w-full">
      {visible.map((b) => (
        <BannerItem key={b.id} banner={b} onDismiss={() => setDismissed((p) => [...p, b.id!])} />
      ))}
    </div>
  );
}
