"use client";

import { useRef } from "react";
import {
  Plus, Trash2, Loader2, CheckCircle2, AlertCircle,
  UploadCloud, Link as LinkIcon, Video, GripVertical, Radio,
} from "lucide-react";
import type { CourseModule, VideoItem, CourseFormat } from "@/types/course";
import MaterialEditor from "@/components/shared/MaterialEditor";
import ExerciseEditor from "@/components/shared/ExerciseEditor";
import { inputCls } from "./_constants";

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch { return ""; }
}

interface Props {
  modules: CourseModule[];
  format: CourseFormat;
  urlMode: Record<string, "upload" | "link">;
  addModule: () => void;
  removeModule: (mi: number) => void;
  updateModuleTitle: (mi: number, v: string) => void;
  addVideo: (mi: number) => void;
  removeVideo: (mi: number, vi: number) => void;
  updateVideo: (mi: number, vi: number, field: keyof VideoItem, v: unknown) => void;
  toggleMode: (mi: number, vi: number) => void;
  onVideoFileChange: (mi: number, vi: number, file: File) => void;
}

export function ModulesPanel({
  modules, format, urlMode,
  addModule, removeModule, updateModuleTitle,
  addVideo, removeVideo, updateVideo, toggleMode,
  onVideoFileChange,
}: Props) {
  const videoRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const key = (mi: number, vi: number) => `${mi}-${vi}`;
  const mode = (mi: number, vi: number) => urlMode[key(mi, vi)] ?? "upload";

  return (
    <div className="flex-1 overflow-y-auto p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-700 mb-1">
            // módulos e aulas
          </p>
          <p className="text-sm text-gray-600">Organiza o conteúdo em módulos e faz upload dos vídeos</p>
        </div>
        <button
          type="button"
          onClick={addModule}
          className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all"
        >
          <Plus className="h-3 w-3" /> Módulo
        </button>
      </div>

      <div className="space-y-4">
        {modules.map((module, mi) => (
          <div key={mi} className="border border-gray-800 overflow-hidden">

            {/* Cabeçalho do módulo */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
              <GripVertical className="h-4 w-4 text-gray-700 shrink-0" />
              <span className="font-mono text-[13px] uppercase tracking-widest text-gray-600 shrink-0">
                {String(mi + 1).padStart(2, "0")}
              </span>
              <input
                type="text"
                value={module.title}
                onChange={(e) => updateModuleTitle(mi, e.target.value)}
                placeholder="Nome do módulo (ex: Introdução)"
                className="flex-1 bg-transparent text-sm text-gray-200 focus:outline-none"
              />
              {modules.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeModule(mi)}
                  aria-label={`Remover módulo ${mi + 1}`}
                  className="p-1.5 text-gray-700 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Aulas */}
            <div className="p-4 space-y-3 bg-gray-900">
              {module.videos.map((video, vi) => (
                <div key={vi} className="border border-gray-800 bg-gray-900 p-3 space-y-2.5">

                  {format === "live" ? (
                    // ── Live lesson ────────────────────────────────────
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] text-gray-700 w-5 shrink-0 text-right">{vi + 1}.</span>
                        <input
                          type="text"
                          value={video.title}
                          onChange={(e) => updateVideo(mi, vi, "title", e.target.value)}
                          placeholder="Título da aula"
                          className={`${inputCls} flex-1 min-w-[120px]`}
                        />
                        <input
                          type="datetime-local"
                          value={toDatetimeLocal(video.scheduledAt ?? "")}
                          onChange={(e) =>
                            updateVideo(mi, vi, "scheduledAt", new Date(e.target.value).toISOString())
                          }
                          className={`${inputCls} w-full sm:w-44 shrink-0`}
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={video.duration}
                            onChange={(e) => updateVideo(mi, vi, "duration", e.target.value)}
                            placeholder="min"
                            className={`${inputCls} w-20 text-center`}
                          />
                          <span className="font-mono text-[8px] text-gray-700">min</span>
                        </div>
                        {module.videos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVideo(mi, vi)}
                            aria-label={`Remover aula ${vi + 1}`}
                            className="p-1.5 text-gray-700 hover:text-red-400 transition-colors shrink-0"
                          >
                            <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                      <div className="pl-7 space-y-2">
                        <MaterialEditor
                          materials={video.materials ?? []}
                          onChange={(m) => updateVideo(mi, vi, "materials", m)}
                        />
                        <ExerciseEditor
                          exercises={video.exercises ?? []}
                          onChange={(e) => updateVideo(mi, vi, "exercises", e)}
                        />
                      </div>
                    </>
                  ) : (
                    // ── Recorded lesson ────────────────────────────────
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] text-gray-700 w-5 shrink-0 text-right">{vi + 1}.</span>
                        <input
                          type="text"
                          value={video.title}
                          onChange={(e) => updateVideo(mi, vi, "title", e.target.value)}
                          placeholder="Título da aula"
                          className={`${inputCls} flex-1 min-w-[120px]`}
                        />
                        <input
                          type="text"
                          value={video.duration}
                          onChange={(e) => updateVideo(mi, vi, "duration", e.target.value)}
                          placeholder="00:00"
                          className={`${inputCls} w-20 text-center`}
                        />
                        {module.videos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVideo(mi, vi)}
                            aria-label={`Remover aula ${vi + 1}`}
                            className="p-1.5 text-gray-700 hover:text-red-400 transition-colors shrink-0"
                          >
                            <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>

                      {/* Upload / Link toggle */}
                      <div className="flex items-start gap-2 pl-7">
                        <div className="flex shrink-0 border border-gray-800 overflow-hidden">
                          {(["upload", "link"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => { if (mode(mi, vi) !== m) toggleMode(mi, vi); }}
                              aria-pressed={mode(mi, vi) === m}
                              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[13px] uppercase tracking-widest transition-colors ${
                                mode(mi, vi) === m
                                  ? "bg-purple text-white"
                                  : "bg-gray-900 text-gray-600 hover:text-gray-300"
                              }`}
                            >
                              {m === "upload" ? <UploadCloud className="h-3 w-3" /> : <LinkIcon className="h-3 w-3" />}
                              {m}
                            </button>
                          ))}
                        </div>

                        {mode(mi, vi) === "upload" ? (
                          <div className="flex-1">
                            {!video.url && !video.uploading && (
                              <button
                                type="button"
                                onClick={() => videoRefs.current[key(mi, vi)]?.click()}
                                className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-700 bg-gray-900 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:border-purple/30 hover:text-gray-500 transition-colors"
                              >
                                <UploadCloud className="h-3.5 w-3.5" /> Selecionar vídeo
                              </button>
                            )}
                            {video.uploading && (
                              <div className="space-y-1">
                                <div className="flex justify-between font-mono text-[13px] text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> A enviar...
                                  </span>
                                  <span>{video.uploadProgress ?? 0}%</span>
                                </div>
                                <div className="w-full bg-gray-800 h-1">
                                  <div
                                    className="bg-purple h-1 transition-all duration-200"
                                    role="progressbar"
                                    aria-valuenow={video.uploadProgress ?? 0}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    style={{ width: `${video.uploadProgress ?? 0}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {video.url && !video.uploading && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center gap-2 border border-green/20 bg-green/5 px-3 py-1.5">
                                  <CheckCircle2 className="h-3 w-3 text-green/60 shrink-0" strokeWidth={1.5} />
                                  <span className="font-mono text-[13px] text-green/60 truncate">
                                    {video.url.split("/").pop()}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { updateVideo(mi, vi, "url", ""); updateVideo(mi, vi, "uploadProgress", 0); }}
                                  aria-label="Remover vídeo"
                                  className="p-1.5 text-gray-700 hover:text-red-400 transition-colors shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                                </button>
                              </div>
                            )}
                            {video.uploadError && (
                              <p className="font-mono text-[13px] text-red-400/80 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
                                {video.uploadError}
                              </p>
                            )}
                            <input
                              ref={(el) => { videoRefs.current[key(mi, vi)] = el; }}
                              type="file"
                              accept="video/mp4,video/quicktime,video/webm"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onVideoFileChange(mi, vi, file);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="relative flex-1">
                            <Video className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-700" />
                            <input
                              type="text"
                              value={video.url}
                              onChange={(e) => updateVideo(mi, vi, "url", e.target.value)}
                              placeholder="https://... (YouTube, Vimeo, etc.)"
                              className={`${inputCls} pl-8`}
                            />
                          </div>
                        )}
                      </div>

                      <div className="pl-7 space-y-2">
                        <MaterialEditor
                          materials={video.materials ?? []}
                          onChange={(m) => updateVideo(mi, vi, "materials", m)}
                        />
                        <ExerciseEditor
                          exercises={video.exercises ?? []}
                          onChange={(e) => updateVideo(mi, vi, "exercises", e)}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => addVideo(mi)}
                className="flex items-center gap-1.5 font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-gray-400 transition-colors ml-7 mt-1"
              >
                <Plus className="h-3 w-3" /> Adicionar aula
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
