"use client";

import { Layers, AlertTriangle, Loader2 } from "lucide-react";
import { useTrails } from "./_hooks/useTrails";
import { TrailCard } from "./_components/TrailCard";

export default function TrailsPage() {
  const { trails, loading, error } = useTrails();

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple/60 mb-2">
          // trilhas de aprendizagem
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Trilhas</h1>
        <p className="mt-1 text-sm text-gray-600">
          Percursos organizados que combinam cursos e aulas ao vivo.
        </p>
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && trails.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center border border-gray-800/60 bg-gray-900/10 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <Layers className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-2">
            // sem trilhas
          </p>
          <p className="text-sm text-gray-600 max-w-xs">
            Ainda não há trilhas publicadas. Volta em breve.
          </p>
        </div>
      )}

      {/* ── Grid editorial ──
           Primeira trilha ocupa 2 colunas em md+ (destaque),
           as restantes preenchem a grelha normalmente.
      ── */}
      {!loading && trails.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trails.map((trail, i) => (
            <TrailCard key={trail.id} trail={trail} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
