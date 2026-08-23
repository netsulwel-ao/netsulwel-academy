"use client";

import { useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, Users, Settings2, ChevronUp, Smartphone,
} from "lucide-react";

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
}: ControlsBarProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

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
    </>
  );
}
