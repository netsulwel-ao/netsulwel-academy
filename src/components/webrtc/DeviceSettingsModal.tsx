"use client";

import { useEffect, useRef } from "react";
import {
  X, Camera, Mic, Volume2, ChevronDown, AlertTriangle,
} from "lucide-react";
import type { UseMediaDevicesReturn } from "@/hooks/useMediaDevices";

interface DeviceSettingsModalProps {
  devices: UseMediaDevicesReturn;
  onClose: () => void;
  /** Called when host confirms the selected devices to apply to the live stream */
  onApply: (cameraId: string, micId: string, speakerId: string) => void;
}

export function DeviceSettingsModal({ devices, onClose, onApply }: DeviceSettingsModalProps) {
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const { cameras, microphones, speakers, selected, previewStream, micLevel,
    setCamera, setMic, setSpeaker, startPreview, stopPreview } = devices;

  // Start preview when modal opens
  useEffect(() => {
    startPreview();
    return () => stopPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bind preview stream to video element
  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const hasVideo = cameras.length > 0;
  const hasMic = microphones.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">Configurações de dispositivos</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Video preview */}
          <div className="relative w-full aspect-video bg-gray-950 overflow-hidden">
            {previewStream ? (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-700">
                <Camera className="h-10 w-10" strokeWidth={1} />
                <p className="text-sm font-mono">Sem sinal de câmara</p>
              </div>
            )}

            {/* Mic level bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
              <div
                className="h-full bg-green-500 transition-all duration-75"
                style={{ width: `${micLevel}%` }}
              />
            </div>

            {/* Mic label */}
            <div className="absolute bottom-2 left-2">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
                <Mic className="h-3 w-3 text-green-400" />
                <span className="text-[11px] text-gray-300 font-mono">
                  {micLevel > 2 ? "A captar som" : "Silêncio"}
                </span>
              </div>
            </div>
          </div>

          {/* Camera selector */}
          <div>
            <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
              <Camera className="h-3.5 w-3.5" />
              Câmara
            </label>
            {hasVideo ? (
              <div className="relative">
                <select
                  value={selected.cameraId}
                  onChange={(e) => setCamera(e.target.value)}
                  className="w-full appearance-none bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2.5 pr-8 focus:outline-none focus:border-purple/50 transition-colors"
                >
                  {cameras.map((c) => (
                    <option key={c.deviceId} value={c.deviceId}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Nenhuma câmara encontrada
              </div>
            )}
          </div>

          {/* Microphone selector */}
          <div>
            <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
              <Mic className="h-3.5 w-3.5" />
              Microfone
            </label>
            {hasMic ? (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={selected.micId}
                    onChange={(e) => setMic(e.target.value)}
                    className="w-full appearance-none bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2.5 pr-8 focus:outline-none focus:border-purple/50 transition-colors"
                  >
                    {microphones.map((m) => (
                      <option key={m.deviceId} value={m.deviceId}>{m.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Mic level meter */}
                <div className="flex items-center gap-2">
                  <Mic className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                  <div className="flex-1 h-2 bg-gray-800 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-75"
                      style={{
                        width: `${micLevel}%`,
                        backgroundColor: micLevel > 80 ? "#ef4444" : micLevel > 50 ? "#f59e0b" : "#22c55e",
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-600 w-8 text-right">{micLevel}%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Nenhum microfone encontrado
              </div>
            )}
          </div>

          {/* Speaker selector */}
          <div>
            <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
              <Volume2 className="h-3.5 w-3.5" />
              Altifalante / Saída de áudio
            </label>
            {speakers.length > 0 ? (
              <div className="relative">
                <select
                  value={selected.speakerId}
                  onChange={(e) => setSpeaker(e.target.value)}
                  className="w-full appearance-none bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2.5 pr-8 focus:outline-none focus:border-purple/50 transition-colors"
                >
                  {speakers.map((s) => (
                    <option key={s.deviceId} value={s.deviceId}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-800 border border-gray-700 px-3 py-2">
                <Volume2 className="h-4 w-4 shrink-0" />
                Saída de áudio gerida pelo sistema
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onApply(selected.cameraId, selected.micId, selected.speakerId);
              onClose();
            }}
            className="px-5 py-2 text-sm font-bold text-white bg-purple hover:bg-purple/90 transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
