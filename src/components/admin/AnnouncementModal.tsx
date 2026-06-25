"use client";

import React from "react";
import { Zap, BookOpen, Radio, Megaphone } from "lucide-react";
import { getLucideIcon } from "@/components/admin/IconPicker";
import type { Announcement, AnnouncementType } from "@/types/announcement";

const TYPE_CONFIG: Record<AnnouncementType, { label: string; icon: React.ElementType; color: string; bg: string; accent: string }> = {
  promo:      { label: "Promoção",     icon: Zap,      color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", accent: "bg-yellow-500 text-gray-900" },
  new_course: { label: "Novo Curso",   icon: BookOpen, color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30",   accent: "bg-purple text-white" },
  live:       { label: "Aula ao Vivo", icon: Radio,    color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",     accent: "bg-red-600 text-white" },
  general:    { label: "Aviso Geral",  icon: Megaphone,color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", accent: "bg-purple-600 text-white" },
};

export function AnnouncementModal({ announcement, onClose, preview=false }:
  { announcement: Announcement; onClose: ()=>void; preview?: boolean }) {
  const cfg = TYPE_CONFIG[announcement.type];
  const TypeIcon = cfg.icon;
  const hasBenefits = (announcement.benefits??[]).length > 0;
  const hasImage = !!announcement.imageUrl;

  return (
    <div style={{ backgroundColor: 'var(--popup-bg)' }} className={`relative border ${cfg.bg} overflow-hidden rounded-2xl w-full max-w-3xl mx-auto`}>

      {/* Layout rico: imagem lateral + benefícios */}
      {hasImage && hasBenefits ? (
        <div className="flex flex-col lg:flex-row min-h-[480px]">
          {/* Left */}
          <div className="flex-1 p-5 sm:p-10 flex flex-col gap-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider border self-start ${cfg.bg} ${cfg.color}`}>
              <TypeIcon className="h-4 w-4"/>
              {announcement.badgeLabel || cfg.label}
              {announcement.type==="live"&&<span className="flex h-2 w-2 relative ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span>}
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{announcement.title||"Título"}</h3>
              <p className="mt-2 text-gray-400 text-base leading-relaxed">{announcement.body}</p>
            </div>
            <ul className="space-y-4 flex-1">
              {(announcement.benefits??[]).map((b,i)=>{
                const BIcon = getLucideIcon(b.icon);
                return (
                  <li key={i} className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${cfg.bg}`}>
                      {BIcon?<BIcon className={`h-5 w-5 ${cfg.color}`}/>:null}
                    </div>
                    <div><p className="text-base font-semibold text-white">{b.title}</p>{b.desc&&<p className="text-sm text-gray-500 mt-0.5">{b.desc}</p>}</div>
                  </li>
                );
              })}
            </ul>
            {announcement.ctaLabel&&(
              preview
                ? <div className={`flex items-center justify-center py-4 font-bold text-base border ${cfg.bg} ${cfg.color}`}>{announcement.ctaLabel}</div>
                  : <a href={announcement.ctaUrl||"#"} target="_blank" rel="noopener noreferrer" onClick={onClose} className={`flex items-center justify-center py-4 font-bold text-base transition-colors ${cfg.accent}`}>{announcement.ctaLabel}</a>
            )}
          </div>
          {/* Right — imagem */}
          <div className="relative w-full lg:w-72 shrink-0 overflow-hidden">
            <img src={announcement.imageUrl} alt={announcement.title} className="absolute inset-0 w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent"/>
          </div>
        </div>

      ) : (
        /* Layout simples */
        <>
          {hasImage&&(
            <div className="relative h-64 overflow-hidden">
              <img src={announcement.imageUrl} alt={announcement.title} className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"/>
            </div>
          )}
          <div className="p-5 sm:p-10 space-y-5">
            <div className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color}`}>
              <TypeIcon className="h-4 w-4"/>
              {announcement.badgeLabel||cfg.label}
              {announcement.type==="live"&&<span className="flex h-2 w-2 relative ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span>}
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{announcement.title||"Título"}</h3>
            <p className="text-gray-400 text-base leading-relaxed">{announcement.body||"Mensagem aqui."}</p>
            {hasBenefits&&(
              <ul className="space-y-4 pt-2">
                {(announcement.benefits??[]).map((b,i)=>{
                  const BIcon = getLucideIcon(b.icon);
                  return (
                    <li key={i} className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${cfg.bg}`}>
                        {BIcon?<BIcon className={`h-5 w-5 ${cfg.color}`}/>:null}
                      </div>
                      <div><p className="text-base font-semibold text-white">{b.title}</p>{b.desc&&<p className="text-sm text-gray-500 mt-0.5">{b.desc}</p>}</div>
                    </li>
                  );
                })}
              </ul>
            )}
            {announcement.ctaLabel&&(
              <div className="pt-2">
                {preview
                  ? <div className={`flex items-center justify-center py-4 font-bold text-base border ${cfg.bg} ${cfg.color}`}>{announcement.ctaLabel}</div>
                : <a href={announcement.ctaUrl||"#"} target="_blank" rel="noopener noreferrer" onClick={onClose} className={`flex items-center justify-center py-4 font-bold text-base transition-colors ${cfg.accent}`}>{announcement.ctaLabel}</a>
                }
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
