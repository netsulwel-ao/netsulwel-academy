"use client";

import { useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, Users, Settings2, ChevronUp, Smartphone,
  Circle, Pause, Square, Loader2,
} from "lucide-react";
import type { RecordingStatus } from "@/hooks/useLiveRecording";

interface ControlsBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndLive: () => void;
  onOpenDeviceSettings?: () => void;
  onOpenRemoteDevice?: () => void;
  participantCount?: number;
  recordingStatus?: RecordingStatus;
  recordingDuration?: string;
  uploadProgress?: number;
  onStartRecording?: () => void;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  onStopRecording?: () => void;
}

export function ControlsBar({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onEndLive,
  onOpenDeviceSettings,
  onOpenRemoteDevice,
  participantCount = 0,
  recordingStatus = "idle",
  recordingDuration = "00:00",
  uploadProgress = 0,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
}: ControlsBarProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showStopRecordingConfirm, setShowStopRecordingConfirm] = useState(false);

  const isRecording = recordingStatus === "recording";
  const isPaused = recordingStatus === "paused";
  const isUploading = recordingStatus === "uploading";

  return (
    <>
      <div className="h-14 sm:h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4 shrink-0">

        {/* Left: participant count */}
        <div className="flex items-center gap-2 text-gray-500 w-24">
          <Users className="h-4 w-4" />
          <span className="text-sm font-mono">{participantCount}</span>
        </div>

        {/* Center: controls */}
        <div className="flex items-center gap-2">

          {/* ── Mic ─────────────────────────────────────── */}
          <div className="flex items-stretch">
            {isMicOn ? (
              <button
                onClick={onToggleMic}
                title="Desligar microfone"
                className="h-10 w-10 flex items-center justify-center bg-gray-800 text-white hover:bg-gray-600 transition-colors"
              >
                <Mic className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onToggleMic}
                title="Ligar microfone"
                className="h-10 w-10 flex items-center justify-center bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                <MicOff className="h-4 w-4" />
              </button>
            )}
            {onOpenDeviceSettings && (
              <button
                onClick={onOpenDeviceSettings}
                title="Configurar dispositivos"
                className="h-10 w-6 flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-600 hover:text-white border-l border-gray-700 transition-colors"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* ── Camera ──────────────────────────────────── */}
          <div className="flex items-stretch">
            {isCameraOn ? (
              <button
                onClick={onToggleCamera}
                title="Desligar câmara"
                className="h-10 w-10 flex items-center justify-center bg-gray-800 text-white hover:bg-gray-600 transition-colors"
              >
                <Video className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onToggleCamera}
                title="Ligar câmara"
                className="h-10 w-10 flex items-center justify-center bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                <VideoOff className="h-4 w-4" />
              </button>
            )}
            {onOpenDeviceSettings && (
              <button
                onClick={onOpenDeviceSettings}
                title="Configurar dispositivos"
                className="h-10 w-6 flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-600 hover:text-white border-l border-gray-700 transition-colors"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* ── Screen share ─────────────────────────────── */}
          {isScreenSharing ? (
            <button
              onClick={onToggleScreenShare}
              title="Parar partilha de ecrã"
              className="h-10 w-10 flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              <MonitorOff className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onToggleScreenShare}
              title="Partilhar ecrã"
              className="h-10 w-10 flex items-center justify-center bg-gray-800 text-white hover:bg-gray-600 transition-colors"
            >
              <Monitor className="h-4 w-4" />
            </button>
          )}

          {/* ── Device settings ──────────────────────────── */}
          {onOpenDeviceSettings && (
            <button
              onClick={onOpenDeviceSettings}
              title="Configurações de dispositivos"
              className="h-10 w-10 flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          )}

          {/* ── Remote device (mobile camera) ────────────── */}
          {onOpenRemoteDevice && (
            <button
              onClick={onOpenRemoteDevice}
              title="Usar telemóvel como câmara"
              className="h-10 w-10 flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          )}

          {/* ── Recording ─────────────────────────────── */}
          {onStartRecording && (
            <>
              {(isRecording || isPaused) && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-red-400 mr-1">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  {recordingDuration}
                </span>
              )}

              {!isRecording && !isPaused && !isUploading && (
                <button
                  onClick={onStartRecording}
                  title="Iniciar gravação"
                  className="h-10 px-3 flex items-center gap-1.5 bg-gray-800 text-red-400 hover:bg-gray-600 hover:text-red-300 transition-colors text-xs font-semibold"
                >
                  <Circle className="h-3 w-3 fill-red-500" />
                  <span className="hidden sm:inline">Gravar</span>
                </button>
              )}

              {isRecording && onPauseRecording && (
                <button
                  onClick={onPauseRecording}
                  title="Pausar gravação"
                  className="h-10 w-10 flex items-center justify-center bg-gray-800 text-amber-400 hover:bg-gray-600 transition-colors"
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}

              {isPaused && onResumeRecording && (
                <button
                  onClick={onResumeRecording}
                  title="Retomar gravação"
                  className="h-10 px-3 flex items-center gap-1.5 bg-gray-800 text-green-400 hover:bg-gray-600 transition-colors text-xs font-semibold"
                >
                  <Circle className="h-3 w-3 fill-green-500" />
                  <span className="hidden sm:inline">Retomar</span>
                </button>
              )}

              {(isRecording || isPaused) && onStopRecording && (
                <button
                  onClick={() => setShowStopRecordingConfirm(true)}
                  title="Parar gravação"
                  className="h-10 w-10 flex items-center justify-center bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                >
                  <Square className="h-3.5 w-3.5 fill-red-500" />
                </button>
              )}

              {isUploading && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple" />
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
              )}
            </>
          )}

          {/* Separator */}
          <div className="w-px h-7 bg-gray-700 mx-1" />

          {/* ── End live ─────────────────────────────────── */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="h-10 px-4 flex items-center gap-2 bg-red-600 text-white hover:bg-red-500 transition-colors text-sm font-semibold"
          >
            <PhoneOff className="h-4 w-4" />
            <span>Terminar</span>
          </button>
        </div>

        {/* Right: spacer */}
        <div className="w-24" />
      </div>

      {/* End confirm dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-900 border border-gray-800 p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-white mb-2">Terminar Live?</h3>
            <p className="text-sm text-gray-400 mb-6">
              A live será encerrada para todos os participantes. Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  onEndLive();
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-colors"
              >
                Terminar Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop recording confirm dialog */}
      {showStopRecordingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-900 border border-gray-800 p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-white mb-2">Parar Gravação?</h3>
            <p className="text-sm text-gray-400 mb-6">
              A gravação será guardada e podes publicá-la depois como uma aula no catálogo.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStopRecordingConfirm(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowStopRecordingConfirm(false);
                  onStopRecording?.();
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-colors"
              >
                Parar Gravação
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
