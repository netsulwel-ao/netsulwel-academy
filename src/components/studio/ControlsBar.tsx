"use client";

import { useEffect, useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp,
  PhoneOff, Volume2, Maximize2, Minimize2, AlertTriangle,
} from "lucide-react";
import type { LiveSession } from "@/types/live";

interface Props {
  live:  LiveSession;
  onEnd: () => void;
}

export function ControlsBar({ live, onEnd }: Props) {
  const { localParticipant } = useLocalParticipant();
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullscreen,  setFullscreen]  = useState(false);

  const isMicOn    = localParticipant?.isMicrophoneEnabled ?? true;
  const isCamOn    = localParticipant?.isCameraEnabled     ?? true;
  const isScreenOn = localParticipant?.isScreenShareEnabled ?? false;

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const btnBase = "flex flex-col items-center justify-center gap-0.5 sm:gap-1 h-12 sm:h-14 w-12 sm:w-fit sm:min-w-[64px] sm:px-1 px-0 transition-colors select-none";
  const btnText = "hidden sm:inline text-[10px] font-medium tracking-wide leading-none";
  const btnDefault = "text-white/70 hover:text-white hover:bg-white/8";
  const btnOff     = "text-red-400 bg-red-500/10 hover:bg-red-500/20";
  const btnActive  = "text-blue-300 bg-blue-500/15 hover:bg-blue-500/25";

  return (
    <>
      <div className="h-14 sm:h-16 bg-[#0e0e11] border-t border-white/8 flex items-center px-2 sm:px-4 gap-1 sm:gap-2 shrink-0 overflow-x-auto">
        <div className="flex-1" />
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          <button
            onClick={() => localParticipant?.setMicrophoneEnabled(!isMicOn)}
            className={`${btnBase} ${isMicOn ? btnDefault : btnOff}`}
            aria-label={isMicOn ? "Desligar microfone" : "Ligar microfone"}
          >
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            <span className={btnText}>Mic</span>
          </button>

          <button
            onClick={() => localParticipant?.setCameraEnabled(!isCamOn)}
            className={`${btnBase} ${isCamOn ? btnDefault : btnOff}`}
            aria-label={isCamOn ? "Desligar câmara" : "Ligar câmara"}
          >
            {isCamOn ? <Video size={18} /> : <VideoOff size={18} />}
            <span className={btnText}>Cam</span>
          </button>

          <div className="w-px h-8 bg-white/8 mx-1 sm:mx-2 hidden sm:block" />

          <button
            onClick={() => localParticipant?.setScreenShareEnabled(!isScreenOn)}
            className={`${btnBase} ${isScreenOn ? btnActive : btnDefault}`}
            aria-label={isScreenOn ? "Parar partilha" : "Partilhar ecrã"}
          >
            <MonitorUp size={18} />
            <span className={btnText}>Partilha</span>
          </button>

          <div className="w-px h-8 bg-white/8 mx-1 sm:mx-2 hidden sm:block" />

          {/* Mute all — TODO */}
          <button className={`${btnBase} ${btnDefault} opacity-40 cursor-not-allowed`} title="Silenciar todos (em desenvolvimento)">
            <Volume2 size={18} />
            <span className={btnText}>Mute</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={`${btnBase} ${btnDefault} hidden sm:flex`}
            aria-label={fullscreen ? "Sair de ecrã total" : "Ecrã total"}
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span className={btnText}>{fullscreen ? "Sair" : "Tela"}</span>
          </button>
        </div>

        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1 sm:gap-2 h-10 px-3 sm:px-5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs sm:text-sm transition-colors whitespace-nowrap"
          >
            <PhoneOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Encerrar</span>
          </button>
        </div>
      </div>

      {/* End confirm dialog */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/75" onClick={() => setShowConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              role="dialog" aria-modal="true"
              aria-labelledby="end-title" aria-describedby="end-desc"
              className="bg-[#111114] border border-white/10 p-6 sm:p-8 max-w-sm w-full space-y-5"
              onKeyDown={e => { if (e.key === "Escape") setShowConfirm(false); }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 id="end-title" className="text-base font-bold text-white">Encerrar aula?</h3>
                  <p id="end-desc" className="text-xs sm:text-sm text-white/40 mt-1">
                    Todos os participantes serão desconectados imediatamente.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setShowConfirm(false); onEnd(); }}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-red-700 hover:bg-red-600 transition-colors"
                >
                  Sim, encerrar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
