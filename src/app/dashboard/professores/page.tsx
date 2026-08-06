"use client";

import { useRef, useEffect } from "react";
import { Search, X, GraduationCap, Loader2, AlertTriangle } from "lucide-react";
import { useTeachers } from "./_hooks/useTeachers";
import { TeacherCard } from "./_components/TeacherCard";

export default function DashboardProfessoresPage() {
  const { filtered, search, setSearch, loading, error } = useTeachers();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-green/60 mb-2">
          // professores
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Professores e Instituições</h1>
        <p className="mt-1 text-sm text-gray-600">
          {loading
            ? "A carregar..."
            : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{error}</p>
        </div>
      )}

      {/* ── Pesquisa ── */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar por nome..."
          className="w-full border border-gray-800 bg-gray-900/60 py-2.5 pl-9 pr-8 text-sm text-gray-200 placeholder-gray-700 focus:border-green/40 focus:outline-none transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-400 transition-colors"
            aria-label="Limpar pesquisa"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center border border-gray-800/60 bg-gray-900/10 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <GraduationCap className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-2">
            // sem resultados
          </p>
          <p className="text-sm text-gray-600">
            {search ? `Nenhum professor com o nome "${search}".` : "Ainda não há professores registados."}
          </p>
        </div>
      )}

      {/* ── Lista editorial ──
          Primeiro professor em destaque (maior),
          restantes em grid de 2 colunas.
      ── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {/* Destaque — primeiro resultado */}
          <TeacherCard teacher={filtered[0]} featured />

          {/* Restantes em grid */}
          {filtered.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filtered.slice(1).map(t => (
                <TeacherCard key={t.id} teacher={t} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
