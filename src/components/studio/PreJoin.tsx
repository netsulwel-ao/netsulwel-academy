"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, Settings, LogIn, Radio } from "lucide-react";

interface Props {
  onJoin: (opts: { audio: boolean; video: boolean }) => void;
}

export function PreJoin({ onJoin }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [camOn,     setCamOn]     = useState(true);
  const [micOn,     setMicOn]     = useState(true);
  const [devices,   setDevices]   = useState<MediaDeviceInfo[]>([]);
  const [curCam,    setCurCam]    = useState("");
  const [curMic,    setCurMic]    = useState("");
  const [showSets,  setShowSets]  = useState(false);

  const startMedia = useCallback(async (camId?: string, micId?: string) => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamOn(true); setMicOn(true);
      setDevices(await navigator.mediaDevices.enumerateDevices());
    } catch { setCamOn(false); setMicOn(false); }
  }, []);

  useEffect(() => {
    startMedia();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [startMedia]);

  const toggleCam = () => {
    if (camOn) {
      streamRef.current?.getVideoTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamOn(false);
    } else {
      startMedia(curCam || undefined, curMic || undefined);
    }
  };

  const toggleMic = () => {
    if (micOn) {
      streamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
      setMicOn(false);
    } else {
      startMedia(curCam || undefined, curMic || undefined);
    }
  };

  const cams = devices.filter(d => d.kind === "videoinput");
  const mics = devices.filter(d => d.kind === "audioinput");

  const IconBtn = ({ active, onClick, iconOn, iconOff }: {
    active: boolean; onClick: () => void;
    iconOn: React.ReactNode; iconOff: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 h-10 sm:h-12 w-10 sm:w-12 transition-colors ${
        active ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-600/80 hover:bg-red-600 text-white"
      }`}
    >
      {active ? iconOn : iconOff}
    </button>
  );

  const statusText =
    !micOn && !camOn ? "Vais entrar sem microfone nem câmara"
    : !micOn ? "Vais entrar sem microfone"
    : !camOn ? "Vais entrar sem câmara"
    : "Microfone e câmara ativos";

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c] p-3 sm:p-6">
      <div className="w-full max-w-xl border border-white/8 bg-[#111114]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-white/8 flex items-center gap-2">
          <Radio className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-red-500 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-white">Verificação antes de entrar</span>
        </div>

        {/* Preview */}
        <div className="relative bg-black aspect-video w-full">
          {camOn && streamRef.current
            ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            : (
              <div className="flex flex-col items-center justify-center h-full gap-2 sm:gap-3">
                <VideoOff className="h-8 sm:h-10 w-8 sm:w-10 text-white/20" />
                <p className="text-xs text-white/30">Câmara desligada</p>
              </div>
            )
          }

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 sm:px-4 pb-3 sm:pb-4 pt-8 sm:pt-10">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <IconBtn
                active={micOn} onClick={toggleMic}
                iconOn={<Mic className="h-4 sm:h-5 w-4 sm:w-5" />}
                iconOff={<MicOff className="h-4 sm:h-5 w-4 sm:w-5" />}
              />
              <IconBtn
                active={camOn} onClick={toggleCam}
                iconOn={<Video className="h-4 sm:h-5 w-4 sm:w-5" />}
                iconOff={<VideoOff className="h-4 sm:h-5 w-4 sm:w-5" />}
              />
              <button
                onClick={() => setShowSets(v => !v)}
                className={`flex items-center justify-center h-10 sm:h-12 w-10 sm:w-12 transition-colors ${
                  showSets ? "bg-white/20 text-white" : "bg-white/8 hover:bg-white/12 text-white/60"
                }`}
                title="Configurações"
              >
                <Settings className="h-4 sm:h-5 w-4 sm:w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Settings */}
        {showSets && (
          <div className="border-t border-white/8 bg-[#0e0e11] p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-48 overflow-y-auto">
            {[
              { label: "Câmara",    list: cams, val: curCam, set: (v: string) => { setCurCam(v); startMedia(v, curMic || undefined); } },
              { label: "Microfone", list: mics, val: curMic, set: (v: string) => { setCurMic(v); startMedia(curCam || undefined, v); } },
            ].map(({ label, list, val, set }) => (
              <div key={label}>
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">{label}</label>
                <select
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 text-white/80 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-white/25 transition-colors"
                >
                  {list.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `${label} ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-white/8 p-3 sm:p-4">
          <button
            onClick={() => onJoin({ audio: micOn, video: camOn })}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-2.5 sm:py-3 text-xs sm:text-sm hover:bg-white/90 transition-colors"
          >
            <LogIn className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Entrar na Sala
          </button>
          <p className="text-center text-[10px] sm:text-[11px] text-white/25 mt-2">{statusText}</p>
        </div>
      </div>
    </div>
  );
}
