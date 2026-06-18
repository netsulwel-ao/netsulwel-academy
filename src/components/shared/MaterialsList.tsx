"use client";

import { FileText, Link2, Image, Film, File, Download, ExternalLink } from "lucide-react";
import type { CourseMaterial, MaterialType } from "@/types/course";

const ICON_MAP: Record<MaterialType, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  link: Link2,
  image: Image,
  video: Film,
  other: File,
};

const LABEL_MAP: Record<MaterialType, string> = {
  pdf: "PDF",
  doc: "Documento",
  link: "Link",
  image: "Imagem",
  video: "Vídeo",
  other: "Outro",
};

export default function MaterialsList({ materials }: { materials: CourseMaterial[] }) {
  if (!materials || materials.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Materiais de Apoio</h3>
      <div className="grid gap-2">
        {materials.map((mat, i) => {
          const Icon = ICON_MAP[mat.type] || File;
          const isLink = mat.type === "link";
          return (
            <a key={i} href={mat.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-gray-900/60 border border-gray-800 hover:border-blue-500/40 hover:bg-gray-900 transition-all group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{mat.title || mat.filename || "Material"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{LABEL_MAP[mat.type]}{mat.filename ? ` — ${mat.filename}` : ""}</p>
              </div>
              {isLink ? (
                <ExternalLink className="h-4 w-4 text-gray-500 shrink-0 group-hover:text-blue-400 transition-colors" />
              ) : (
                <Download className="h-4 w-4 text-gray-500 shrink-0 group-hover:text-blue-400 transition-colors" />
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
