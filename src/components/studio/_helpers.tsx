"use client";

import { useEffect, useRef, useState } from "react";
import { useParticipants } from "@livekit/components-react";
import { playEntrySound } from "@/lib/entry-sound";

// ── Deterministic avatar color ────────────────────────────────
export function avatarColor(str: string): string {
  const palette = ["#2D3A4A", "#2A3D2E", "#3A2D2D", "#2D2A3D", "#3A3A2D", "#2D3A3A"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function initial(name: string) {
  return (name || "?")[0].toUpperCase();
}

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, minWidth: size, background: avatarColor(name), fontSize: size * 0.36 }}
      className="flex items-center justify-center font-semibold text-white/90 shrink-0"
    >
      {initial(name)}
    </div>
  );
}

// ── Waveform ──────────────────────────────────────────────────
export function Waveform() {
  return (
    <span className="flex items-end gap-[2px] h-3" aria-label="A falar">
      {[40, 80, 55, 90, 40].map((h, i) => (
        <span
          key={i}
          className="w-[2px] bg-green-400 rounded-sm"
          style={{
            height: `${h}%`,
            animation: `wave 0.7s ease-in-out infinite`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
      <style>{`@keyframes wave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.35)}}`}</style>
    </span>
  );
}

// ── ElapsedTimer ──────────────────────────────────────────────
export function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState("00:00:00");
  useEffect(() => {
    const start = new Date(since).getTime();
    const tick = () => {
      const diff = Math.max(0, Date.now() - start);
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [since]);
  return <span className="font-mono tabular-nums text-white/80 text-xs tracking-widest">{elapsed}</span>;
}

// ── SectionLabel ──────────────────────────────────────────────
export function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">{children}</span>
      {count !== undefined && (
        <span className="text-[10px] font-bold text-white/30">{count}</span>
      )}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <span className="text-white/15 text-3xl">{icon}</span>
      <p className="text-xs text-white/25 leading-relaxed">{text}</p>
    </div>
  );
}

// ── useEntrySound ─────────────────────────────────────────────
export function useEntrySound() {
  const participants = useParticipants();
  const known = useRef(new Set<string>());
  useEffect(() => {
    participants.forEach(p => {
      if (!known.current.has(p.identity)) {
        known.current.add(p.identity);
        if (!p.isLocal) playEntrySound();
      }
    });
  }, [participants]);
}
