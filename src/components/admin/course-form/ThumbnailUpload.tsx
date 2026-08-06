"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  preview: string;
  uploaded: boolean;
  uploading: boolean;
  onChange: (file: File) => void;
}

export function ThumbnailUpload({ preview, uploaded, uploading, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-600 mb-2">
        // capa do curso
      </p>
      <div
        role="button"
        tabIndex={0}
        aria-label="Carregar capa do curso"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className="relative w-full aspect-video border border-gray-800/60 bg-gray-900/20 cursor-pointer overflow-hidden group hover:border-purple/30 transition-colors"
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gray-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImagePlus className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-gray-950/70 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-purple" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-700 group-hover:text-gray-500 transition-colors">
            <ImagePlus className="h-8 w-8" strokeWidth={1} />
            <span className="font-mono text-[9px] uppercase tracking-widest">Clique para carregar</span>
            <span className="font-mono text-[8px] text-gray-700">PNG, JPG, WEBP</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
      />

      {uploading && (
        <p className="mt-1.5 font-mono text-[9px] text-purple/60 flex items-center gap-1">
          <Loader2 className="h-2.5 w-2.5 animate-spin" /> A enviar...
        </p>
      )}
      {uploaded && !uploading && (
        <p className="mt-1.5 font-mono text-[9px] text-green/60 flex items-center gap-1">
          <CheckCircle2 className="h-2.5 w-2.5" /> Upload concluído
        </p>
      )}
    </div>
  );
}
