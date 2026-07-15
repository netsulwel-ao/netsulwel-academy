"use client";

import { Radio, Eye, MoreVertical } from "lucide-react";
import type { LiveSession } from "@/types/live";

interface StudioHeaderProps {
  live: LiveSession;
  participantCount: number;
  shareButton?: React.ReactNode;
}

export function StudioHeader({
  live,
  participantCount,
  shareButton,
}: StudioHeaderProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 h-full">
      {/* Live Indicator */}
      <div className="flex items-center gap-2">
        <Radio className="h-3.5 w-3.5 text-white/30 shrink-0" />
        <span className="text-xs sm:text-sm font-semibold text-white/80 truncate line-clamp-1">
          {live.title}
        </span>
      </div>

      {/* Live Badge - Hidden on Small Screens */}
      <div className="hidden sm:flex items-center gap-1 bg-red-600/15 border border-red-500/20 px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 bg-red-500 animate-pulse shrink-0" />
        <span className="text-[11px] font-bold text-red-400 tracking-widest">AO VIVO</span>
      </div>

      {/* Elapsed Time */}
      {live.startedAt && (
        <div className="hidden md:block text-xs font-mono text-white/60">
          {/* Timer will be injected here */}
        </div>
      )}

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Participant Count */}
        <div className="flex items-center gap-1.5 text-white/40 bg-white/[2%] px-2 py-1 rounded text-xs">
          <Eye className="h-3.5 w-3.5" />
          <span className="font-medium">{participantCount}</span>
        </div>

        {/* Share Button */}
        {shareButton && <div className="hidden sm:block">{shareButton}</div>}

        {/* Menu Button - Mobile Only */}
        <button className="sm:hidden p-1.5 text-white/40 hover:text-white/60 hover:bg-white/10 rounded transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
