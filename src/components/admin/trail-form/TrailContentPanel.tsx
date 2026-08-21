"use client";

import { useRef } from "react";
import {
  Plus, Trash2, GripVertical, BookOpen, Radio,
  ImagePlus, Calendar, Crown, Zap, Coins, ChevronUp, ChevronDown,
} from "lucide-react";
import type { TrailLiveSession, Course } from "@/types/course";
import type { LiveSession } from "@/types/live";
import { toDatetimeLocal } from "./_upload";

const inputCls =
  "w-full border border-gray-800 bg-gray-900 py-2 px-3 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors";

interface Props {
  allCourses: Course[];
  selectedCourseIds: string[];
  toggleCourse: (id: string) => void;
  moveCourse: (i: number, dir: -1 | 1) => void;

  allLives: LiveSession[];
  selectedLiveIds: string[];
  toggleLive: (id: string) => void;
  moveLive: (i: number, dir: -1 | 1) => void;

  liveSessions: TrailLiveSession[];
  addLiveSession: () => void;
  removeLiveSession: (i: number) => void;
  moveLiveSession: (i: number, dir: -1 | 1) => void;
  updateLiveSession: (i: number, field: keyof TrailLiveSession, value: string | number) => void;
  onSessionThumb: (i: number, file: File) => void;
}

function MoveButtons({ onUp, onDown, disableUp, disableDown }: {
  onUp: () => void; onDown: () => void; disableUp: boolean; disableDown: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <button type="button" onClick={onUp} disabled={disableUp}
        className="flex h-5 w-5 items-center justify-center text-gray-700 hover:text-gray-400 disabled:opacity-20 transition-colors">
        <ChevronUp className="h-3 w-3" strokeWidth={2} />
      </button>
      <button type="button" onClick={onDown} disabled={disableDown}
        className="flex h-5 w-5 items-center justify-center text-gray-700 hover:text-gray-400 disabled:opacity-20 transition-colors">
        <ChevronDown className="h-3 w-3" strokeWidth={2} />
      </button>
    </div>
  );
}

export function TrailContentPanel({
  allCourses, selectedCourseIds, toggleCourse, moveCourse,
  allLives, selectedLiveIds, toggleLive, moveLive,
  liveSessions, addLiveSession, removeLiveSession, moveLiveSession,
  updateLiveSession, onSessionThumb,
}: Props) {
  const sessionThumbRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-10">

      {/* ── CURSOS ────────────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-700 mb-1">
            // cursos da trilha
          </p>
          <p className="text-sm text-gray-600">Selecciona e ordena os cursos que fazem parte desta trilha</p>
        </div>

        {/* Ordem dos seleccionados */}
        {selectedCourseIds.length > 0 && (
          <div className="mb-5">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
              // ordem · {selectedCourseIds.length}
            </p>
            <div className="border border-gray-800 divide-y divide-gray-800">
              {selectedCourseIds.map((cid, idx) => {
                const course = allCourses.find(c => c.id === cid);
                if (!course) return null;
                return (
                  <div key={cid} className="flex items-center gap-3 px-4 py-2.5 bg-gray-900">
                    <GripVertical className="h-3.5 w-3.5 text-gray-700 shrink-0" />
                    <span className="font-mono text-[13px] text-gray-700 w-5 shrink-0 text-right">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm text-gray-200 truncate">{course.title}</span>
                    <MoveButtons
                      onUp={() => moveCourse(idx, -1)} onDown={() => moveCourse(idx, 1)}
                      disableUp={idx === 0} disableDown={idx === selectedCourseIds.length - 1}
                    />
                    <button type="button" onClick={() => toggleCourse(cid)}
                      aria-label={`Remover ${course.title}`}
                      className="p-1 text-gray-700 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Todos os cursos */}
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// todos os cursos</p>
        {allCourses.length === 0 ? (
          <p className="text-sm text-gray-700 py-6 text-center">Nenhum curso disponível.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {allCourses.map(course => {
              const sel = selectedCourseIds.includes(course.id!);
              return (
                <button
                  key={course.id} type="button" onClick={() => toggleCourse(course.id!)}
                  className={`flex items-center gap-3 p-3 border text-left transition-all ${
                    sel ? "border-purple/40 bg-purple/8" : "border-gray-800 bg-gray-900 hover:border-gray-700"
                  }`}
                >
                  <div className={`h-4 w-4 shrink-0 border flex items-center justify-center transition-colors ${
                    sel ? "border-purple bg-purple" : "border-gray-600"
                  }`}>
                    {sel && <span className="text-white text-[13px] font-bold leading-none">✓</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 truncate">{course.title}</p>
                    <p className="font-mono text-[13px] text-gray-700 mt-0.5 capitalize">
                      {course.type} · {course.level}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── LIVES EXISTENTES ──────────────────────────────── */}
      <section>
        <div className="mb-4">
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-700 mb-1 flex items-center gap-2">
            <Radio className="h-3 w-3 text-red-400/60" strokeWidth={1.5} />
            // aulas ao vivo (existentes)
          </p>
          <p className="text-sm text-gray-600">Selecciona lives já criadas na plataforma</p>
        </div>

        {selectedLiveIds.length > 0 && (
          <div className="mb-5">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
              // ordem · {selectedLiveIds.length}
            </p>
            <div className="border border-gray-800 divide-y divide-gray-800">
              {selectedLiveIds.map((lid, idx) => {
                const live = allLives.find(l => l.id === lid);
                if (!live) return null;
                return (
                  <div key={lid} className="flex items-center gap-3 px-4 py-2.5 bg-gray-900">
                    <GripVertical className="h-3.5 w-3.5 text-gray-700 shrink-0" />
                    <span className="font-mono text-[13px] text-gray-700 w-5 shrink-0 text-right">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm text-gray-200 truncate">{live.title}</span>
                    <span className={`font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 border shrink-0 ${
                      live.status === "live"      ? "border-red-500/30 text-red-400/70"
                      : live.status === "scheduled" ? "border-blue-500/30 text-blue-400/70"
                      : "border-gray-700 text-gray-600"
                    }`}>
                      {live.status === "live" ? "live" : live.status === "scheduled" ? "agendada" : "encerrada"}
                    </span>
                    <MoveButtons
                      onUp={() => moveLive(idx, -1)} onDown={() => moveLive(idx, 1)}
                      disableUp={idx === 0} disableDown={idx === selectedLiveIds.length - 1}
                    />
                    <button type="button" onClick={() => toggleLive(lid)}
                      aria-label={`Remover ${live.title}`}
                      className="p-1 text-gray-700 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// todas as lives</p>
        {allLives.length === 0 ? (
          <p className="text-sm text-gray-700 py-6 text-center">Nenhuma aula ao vivo disponível.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {allLives.map(live => {
              const sel = selectedLiveIds.includes(live.id!);
              return (
                <button
                  key={live.id} type="button" onClick={() => toggleLive(live.id!)}
                  className={`flex items-center gap-3 p-3 border text-left transition-all ${
                    sel ? "border-red-500/30 bg-red-500/5" : "border-gray-800 bg-gray-900 hover:border-gray-700"
                  }`}
                >
                  <div className={`h-4 w-4 shrink-0 border flex items-center justify-center transition-colors ${
                    sel ? "border-red-500 bg-red-500" : "border-gray-600"
                  }`}>
                    {sel && <span className="text-white text-[13px] font-bold leading-none">✓</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 truncate">{live.title}</p>
                    <p className="font-mono text-[13px] text-gray-700 mt-0.5">
                      {live.status === "scheduled"
                        ? new Date(live.scheduledAt).toLocaleDateString("pt-PT")
                        : live.status === "live" ? "Ao vivo agora"
                        : "Encerrada"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── AULAS PRÓPRIAS ────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-700 mb-1 flex items-center gap-2">
            <Radio className="h-3 w-3 text-amber-400/60" strokeWidth={1.5} />
            // cronograma próprio · {liveSessions.length}
          </p>
          <p className="text-sm text-gray-600">
            Aulas ao vivo exclusivas desta trilha (com data, capa e plano de acesso)
          </p>
        </div>

        {liveSessions.length > 0 && (
          <div className="space-y-3 mb-4">
            {liveSessions.map((sess, idx) => (
              <div key={idx} className="border border-gray-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] uppercase tracking-widest text-amber-400/70">
                      aula {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MoveButtons
                      onUp={() => moveLiveSession(idx, -1)} onDown={() => moveLiveSession(idx, 1)}
                      disableUp={idx === 0} disableDown={idx === liveSessions.length - 1}
                    />
                    <button type="button" onClick={() => removeLiveSession(idx)}
                      aria-label="Remover aula"
                      className="p-1 text-gray-700 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3 bg-gray-900">
                  <div className="flex gap-3">
                    {/* Thumb pequena */}
                    <div
                      role="button" tabIndex={0} aria-label="Carregar capa"
                      onClick={() => sessionThumbRefs.current.get(idx)?.click()}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sessionThumbRefs.current.get(idx)?.click(); } }}
                      className="w-20 shrink-0 aspect-video border border-gray-800 bg-gray-900 cursor-pointer overflow-hidden group hover:border-purple/30 transition-colors"
                    >
                      {sess.thumbnail ? (
                        <img src={sess.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImagePlus className="h-4 w-4 text-gray-700 group-hover:text-gray-500 transition-colors" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <input
                      ref={(el) => { if (el) sessionThumbRefs.current.set(idx, el); }}
                      type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) onSessionThumb(idx, f); }}
                    />

                    {/* Título + data */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text" value={sess.title} placeholder="Título da aula"
                        onChange={(e) => updateLiveSession(idx, "title", e.target.value)}
                        className={inputCls}
                      />
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700 pointer-events-none" strokeWidth={1.5} />
                        <input
                          type="datetime-local"
                          value={toDatetimeLocal(sess.scheduledAt)}
                          onChange={(e) => updateLiveSession(idx, "scheduledAt", e.target.value)}
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <textarea
                    rows={2} value={sess.description} placeholder="Descrição (opcional)"
                    onChange={(e) => updateLiveSession(idx, "description", e.target.value)}
                    className={`${inputCls} resize-none`}
                  />

                  {/* Plano de acesso */}
                  <div>
                    <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// plano de acesso</p>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        { value: "free",       label: "Grátis",     Icon: Radio,  color: "border-green/25 text-green/70"             },
                        { value: "smart",      label: "Smart",      Icon: Zap,    color: "border-blue-500/25 text-blue-400/70"       },
                        { value: "golden",     label: "Golden",     Icon: Crown,  color: "border-amber-500/25 text-amber-400/70"     },
                        { value: "standalone", label: "Standalone", Icon: Coins,  color: "border-purple/25 text-purple/70"           },
                      ] as const).map(({ value, label, Icon, color }) => {
                        const sel = sess.target === value;
                        return (
                          <button
                            key={value} type="button"
                            onClick={() => updateLiveSession(idx, "target", value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[13px] uppercase tracking-widest transition-all ${
                              sel ? `${color} bg-gray-900` : "border-gray-800 text-gray-600 hover:border-gray-700"
                            }`}
                          >
                            <Icon className="h-3 w-3" strokeWidth={1.5} />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {sess.target === "standalone" && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number" min={0} step={100} value={sess.price || ""}
                          onChange={(e) => updateLiveSession(idx, "price", Number(e.target.value) || 0)}
                          placeholder="Preço"
                          className="w-32 border border-gray-800 bg-gray-900 py-2 px-3 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors"
                        />
                        <span className="font-mono text-[13px] text-gray-700">Kz</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão adicionar */}
        <button
          type="button" onClick={addLiveSession}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-800 py-3 font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:border-gray-700 hover:text-gray-400 transition-all"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Adicionar aula ao vivo
        </button>
      </section>
    </div>
  );
}
