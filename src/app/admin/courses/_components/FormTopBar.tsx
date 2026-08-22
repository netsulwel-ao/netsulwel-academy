"use client";

import { Save, ArrowLeft, Loader2, AlertCircle, X } from "lucide-react";
import Link from "next/link";

interface FormTopBarProps {
  mode: "create" | "edit";
  saving: boolean;
  disabled: boolean;
  error: string;
  backHref: string;
  onDraft: () => void;
  onPublish: () => void;
  onClearError: () => void;
}

export function FormTopBar({
  mode, saving, disabled, error, backHref,
  onDraft, onPublish, onClearError,
}: FormTopBarProps) {
  return (
    <>
      {/* Sticky bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-gray-950 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            aria-label="Voltar"
            className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:text-gray-300 hover:border-gray-700 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-700 mb-0.5">
              {mode === "create" ? "// novo curso" : "// editar curso"}
            </p>
            <h1 className="text-base font-bold text-gray-100 leading-none">
              {mode === "create" ? "Criar Curso" : "Editar Curso"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDraft}
            disabled={disabled}
            className="flex items-center gap-1.5 border border-gray-700 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-500 hover:text-gray-300 hover:border-gray-600 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Rascunho
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={disabled}
            className="flex items-center gap-1.5 bg-purple px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-purple-600 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {mode === "edit" ? "Actualizar" : "Publicar"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mx-6 mt-4 flex items-center gap-2 border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={onClearError} aria-label="Fechar erro">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
