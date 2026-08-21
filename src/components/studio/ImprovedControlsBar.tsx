"use client";

import { useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff,
  Volume2, Maximize2, Minimize2, AlertTriangle, Settings,
} from "lucide-react";

interface ImprovedControlsBarProps {
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenOn: boolean;
  isFullscreen: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreen: () => void;
  onToggleFullscreen: () => void;
  onEnd: () => void;
  onSettings?: () => void;
}

function ControlButton({
  label,
  active,
  danger = false,
  onClick,
  icon: Icon,
  compact = false,
}: {
  label: string;
  active: boolean;
  danger?: boolean;
  onClick?: () => void;
  icon: React.ComponentType<{ className: string }>;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded transition-colors
        ${compact ? "h-8 w-8 p-0 justify-center gap-0" : "h-10 sm:h-11"}
        ${
          danger && !active
            ? "bg-red-600/80 hover:bg-red-600 text-white"
            : active
            ? "bg-blue-600/80 hover:bg-blue-600 text-white"
            : "bg-white hover:bg-white text-white hover:text-white"
        }
      `}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

export function ImprovedControlsBar({
  isMicOn,
  isCamOn,
  isScreenOn,
  isFullscreen,
  onToggleMic,
  onToggleCam,
  onToggleScreen,
  onToggleFullscreen,
  onEnd,
  onSettings,
}: ImprovedControlsBarProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  return (
    <>
      <div className="h-auto sm:h-14 bg-[#0e0e11] border-t border-white px-2 sm:px-4 py-2 sm:py-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide shrink-0">
        {/* Left Group - Media Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <ControlButton
            label={isMicOn ? "Microfone" : "Silenciar"}
            active={isMicOn}
            onClick={onToggleMic}
            icon={isMicOn ? Mic : MicOff}
            compact={true}
          />
          <ControlButton
            label={isCamOn ? "Câmara" : "Desligar"}
            active={isCamOn}
            onClick={onToggleCam}
            icon={isCamOn ? Video : VideoOff}
            compact={true}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white mx-0.5 sm:mx-1 hidden sm:block" />

        {/* Middle Group - Screen Share & Audio */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <ControlButton
            label={isScreenOn ? "Parar Partilha" : "Partilhar Ecrã"}
            active={isScreenOn}
            onClick={onToggleScreen}
            icon={MonitorUp}
            compact={true}
          />
          <ControlButton
            label="Mute Todos"
            active={false}
            onClick={() => alert("Em desenvolvimento")}
            icon={Volume2}
            compact={true}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white mx-0.5 sm:mx-1 hidden sm:block" />

        {/* Right Group - Settings & End */}
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <ControlButton
            label={isFullscreen ? "Sair FS" : "Tela Cheia"}
            active={isFullscreen}
            onClick={onToggleFullscreen}
            icon={isFullscreen ? Minimize2 : Maximize2}
            compact={true}
          />
          {onSettings && (
            <ControlButton
              label="Configurações"
              active={false}
              onClick={onSettings}
              icon={Settings}
              compact={true}
            />
          )}

          {/* End Call - Not Compact */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-1 px-2.5 sm:px-4 py-2 h-8 sm:h-10 bg-red-700 hover:bg-red-600 text-white text-sm sm:text-sm font-bold rounded transition-colors whitespace-nowrap ml-1"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline">Encerrar</span>
          </button>
        </div>
      </div>

      {/* End Confirmation Modal */}
      {showEndConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black"
            onClick={() => setShowEndConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-[#111114] border border-white rounded-lg p-4 sm:p-6 max-w-sm w-full space-y-4 sm:space-y-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-white">Encerrar aula?</h3>
                  <p className="text-sm sm:text-sm text-white mt-1">
                    Todos os participantes serão desconectados imediatamente.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-2 text-sm sm:text-sm font-medium text-white hover:text-white bg-white hover:bg-white rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowEndConfirm(false);
                    onEnd();
                  }}
                  className="flex-1 py-2 text-sm sm:text-sm font-bold text-white bg-red-700 hover:bg-red-600 rounded transition-colors"
                >
                  Sim, Encerrar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
