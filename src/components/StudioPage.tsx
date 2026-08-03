"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, updateDoc, collection, addDoc, setDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  LiveKitRoom, VideoTrack, AudioTrack, useTracks, useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff,
  Send, Users, MessageSquare, Loader2,
  AlertTriangle, Maximize2, Minimize2,
  Eye, LogIn, Radio, Hand, Volume2, Settings, Share2, Copy, Check, X,
} from "lucide-react";
import type { LiveSession, ChatMessage } from "@/types/live";
import { playEntrySound } from "@/lib/entry-sound";
import { RecordingControls } from "@/components/RecordingControls";
import { QAPanel } from "@/components/QAPanel";
import { AttendanceReport } from "@/components/AttendanceReport";
import { SimpleRecorder } from "@/components/SimpleRecorder";

// ─────────────────────────────────────────────────────────────
// ShareLiveButton — Botão para partilhar link da aula ao vivo
// ─────────────────────────────────────────────────────────────
function ShareLiveButton({ liveId, liveTitle }: { liveId: string; liveTitle: string }) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const handleGenerateLink = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      const authToken = await user.getIdToken();
      
      // Chamar API para criar link
      const res = await fetch("/api/access/private-link/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          liveId,
          expiresIn: 24 * 60 * 60 * 1000, // 24h
          maxUses: undefined, // Ilimitado
        }),
      });

      const data = await res.json();
      
      if (data.shareUrl) {
        setShareUrl(data.shareUrl);
        console.log("Link gerado:", data.shareUrl);
      } else {
        console.error("Erro:", data.error);
      }
    } catch (error) {
      console.error("Erro ao gerar link:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Aula ao Vivo: ${liveTitle}`,
          text: `Clica neste link para aceder à aula`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Erro ao partilhar:", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <>
      <button
        onClick={async () => {
          if (!shareUrl && !loading) {
            await handleGenerateLink();
            setShowShareMenu(true);
          } else {
            setShowShareMenu(!showShareMenu);
          }
        }}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple/20 hover:bg-purple/30 border border-purple/50 text-purple-200 hover:text-purple-100 rounded text-xs font-medium transition-colors disabled:opacity-50"
        title="Partilhar aula"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="hidden sm:inline">Gerando...</span>
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Partilhar</span>
          </>
        )}
      </button>

      {/* Share Menu Dropdown */}
      {showShareMenu && shareUrl && (
        <div className="fixed top-12 right-4 sm:right-auto bg-[#111114] border border-gray-700 rounded-lg shadow-xl p-3 space-y-2 z-50 w-64 sm:w-auto">
          {/* URL Display */}
          <div className="bg-gray-900 rounded p-2 flex gap-2 items-center">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-gray-200 text-xs font-mono border-0 outline-0 truncate"
            />
            <button
              onClick={handleCopy}
              className={`p-1 transition-colors shrink-0 ${
                copied
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          {/* Share Options */}
          <div className="flex gap-2 text-xs">
            <button
              onClick={handleCopy}
              className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center justify-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copiar
            </button>
            <button
              onClick={handleShare}
              className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-1"
            >
              <Share2 className="h-3 w-3" />
              Enviar
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            Link válido por 24h | Ilimitado de usos
          </p>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Deterministic muted color from a string — avoids gradient avatars */
function avatarColor(str: string): string {
  const palette = ["#2D3A4A", "#2A3D2E", "#3A2D2D", "#2D2A3D", "#3A3A2D", "#2D3A3A"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function initial(name: string) {
  return (name || "?")[0].toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// ElapsedTimer
// ─────────────────────────────────────────────────────────────
function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState("00:00:00");
  useEffect(() => {
    const start = new Date(since).getTime();
    const tick = () => {
      const diff = Math.max(0, Date.now() - start);
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [since]);
  return <span className="font-mono tabular-nums text-white/80 text-xs tracking-widest">{elapsed}</span>;
}

// ─────────────────────────────────────────────────────────────
// Entry sound hook
// ─────────────────────────────────────────────────────────────
function useEntrySound() {
  const participants = useParticipants();
  const known = useRef(new Set<string>());
  useEffect(() => {
    participants.forEach(p => {
      if (!known.current.has(p.identity)) {
        known.current.add(p.identity);
        if (!p.isLocal) playEntrySound();
      }
    });
  }, [participants]);
}



// ─────────────────────────────────────────────────────────────
function ControlBtn({
  label, active = true, danger = false, highlight = false, onClick, children,
}: {
  label: string; active?: boolean; danger?: boolean; highlight?: boolean;
  onClick?: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={[
        "flex flex-col items-center justify-center gap-1 h-14 w-16 transition-colors select-none",
        danger && !active
          ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
          : highlight && active
          ? "text-blue-300 bg-blue-500/15 hover:bg-blue-500/25"
          : !active
          ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
          : "text-white/70 hover:text-white hover:bg-white/8",
      ].join(" ")}
    >
      <span className="text-[18px] leading-none">{children}</span>
      <span className="text-[10px] font-medium tracking-wide leading-none">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, minWidth: size, background: avatarColor(name), fontSize: size * 0.36 }}
      className="flex items-center justify-center font-semibold text-white/90 shrink-0"
    >
      {initial(name)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Waveform — animated bars for active speaker
// ─────────────────────────────────────────────────────────────
function Waveform() {
  return (
    <span className="flex items-end gap-[2px] h-3" aria-label="A falar">
      {[40, 80, 55, 90, 40].map((h, i) => (
        <span
          key={i}
          className="w-[2px] bg-green-400 rounded-sm"
          style={{
            height: `${h}%`,
            animation: `wave 0.7s ease-in-out infinite`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
      <style>{`@keyframes wave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.35)}}`}</style>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// SectionLabel — small uppercase divider label
// ─────────────────────────────────────────────────────────────
function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">{children}</span>
      {count !== undefined && (
        <span className="text-[10px] font-bold text-white/30">{count}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <span className="text-white/15 text-3xl">{icon}</span>
      <p className="text-xs text-white/25 leading-relaxed">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PreJoin
// ─────────────────────────────────────────────────────────────
function PreJoin({ onJoin }: { onJoin: (opts: { audio: boolean; video: boolean }) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCam, setCurrentCam] = useState("");
  const [currentMic, setCurrentMic] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const startMedia = useCallback(async (camId?: string, micId?: string) => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraOn(true); setMicOn(true);
      setDevices(await navigator.mediaDevices.enumerateDevices());
    } catch { setCameraOn(false); setMicOn(false); }
  }, []);

  useEffect(() => {
    startMedia();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [startMedia]);

  const toggleCamera = () => {
    if (cameraOn) {
      streamRef.current?.getVideoTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
    } else { startMedia(currentCam || undefined, currentMic || undefined); }
  };
  const toggleMic = () => {
    if (micOn) { streamRef.current?.getAudioTracks().forEach(t => (t.enabled = false)); setMicOn(false); }
    else { startMedia(currentCam || undefined, currentMic || undefined); }
  };

  const cams = devices.filter(d => d.kind === "videoinput");
  const mics = devices.filter(d => d.kind === "audioinput");

  const iconBtn = (active: boolean, onClick: () => void, iconOn: React.ReactNode, iconOff: React.ReactNode) => (
    <button
      onClick={onClick}
      className={[
        "flex flex-col items-center justify-center gap-1 h-10 sm:h-12 w-10 sm:w-12 transition-colors",
        active ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-600/80 hover:bg-red-600 text-white",
      ].join(" ")}
    >
      {active ? iconOn : iconOff}
    </button>
  );

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
          {cameraOn && streamRef.current
            ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            : (
              <div className="flex flex-col items-center justify-center h-full gap-2 sm:gap-3">
                <VideoOff className="h-8 sm:h-10 w-8 sm:w-10 text-white/20" />
                <p className="text-xs sm:text-xs text-white/30">Câmara desligada</p>
              </div>
            )}

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 sm:px-4 pb-3 sm:pb-4 pt-8 sm:pt-10">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {iconBtn(micOn, toggleMic, <Mic className="h-4 sm:h-5 w-4 sm:w-5" />, <MicOff className="h-4 sm:h-5 w-4 sm:w-5" />)}
              {iconBtn(cameraOn, toggleCamera, <Video className="h-4 sm:h-5 w-4 sm:w-5" />, <VideoOff className="h-4 sm:h-5 w-4 sm:w-5" />)}
              <button
                onClick={() => setShowSettings(v => !v)}
                className={[
                  "flex items-center justify-center h-10 sm:h-12 w-10 sm:w-12 transition-colors",
                  showSettings ? "bg-white/20 text-white" : "bg-white/8 hover:bg-white/12 text-white/60",
                ].join(" ")}
                title="Configurações"
              >
                <Settings className="h-4 sm:h-5 w-4 sm:w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Settings drawer */}
        {showSettings && (
          <div className="border-t border-white/8 bg-[#0e0e11] p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-48 overflow-y-auto">
            {[
              { label: "Câmara", list: cams, val: currentCam, set: (v: string) => { setCurrentCam(v); startMedia(v, currentMic || undefined); } },
              { label: "Microfone", list: mics, val: currentMic, set: (v: string) => { setCurrentMic(v); startMedia(currentCam || undefined, v); } },
            ].map(({ label, list, val, set }) => (
              <div key={label}>
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">{label}</label>
                <select
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-white/10 text-white/80 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-white/25 transition-colors"
                >
                  {list.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `${label} ${d.deviceId.slice(0, 8)}`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-white/8 p-3 sm:p-4">
          <button
            onClick={() => onJoin({ audio: micOn, video: cameraOn })}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-2.5 sm:py-3 text-xs sm:text-sm hover:bg-white/90 transition-colors"
          >
            <LogIn className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Entrar na Sala
          </button>
          <p className="text-center text-[10px] sm:text-[11px] text-white/25 mt-2">
            {!micOn && !cameraOn ? "Vais entrar sem microfone nem câmara"
              : !micOn ? "Vais entrar sem microfone"
              : !cameraOn ? "Vais entrar sem câmara"
              : "Microfone e câmara ativos"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PalavraPanel
// ─────────────────────────────────────────────────────────────
function PalavraPanel({ liveId }: { liveId: string }) {
  const [speakers, setSpeakers] = useState<Set<string>>(new Set());
  const [handRaiseQueue, setHandRaiseQueue] = useState<{ uid: string; name: string; createdAt: Timestamp }[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lives", liveId, "speakers"), snap => {
      const s = new Set<string>();
      snap.docs.forEach(d => { if (d.data().canSpeak === true) s.add(d.id); });
      setSpeakers(s);
    });
    return () => unsub();
  }, [liveId]);

  useEffect(() => {
    const q = query(collection(db, "lives", liveId, "handraises"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setHandRaiseQueue(snap.docs.map(d => ({ uid: d.id, ...d.data() } as { uid: string; name: string; createdAt: Timestamp })));
    });
    return () => unsub();
  }, [liveId]);

  const grantSpeech = async (uid: string) => {
    await setDoc(doc(db, "lives", liveId, "speakers", uid), { canSpeak: true }, { merge: true });
    await deleteDoc(doc(db, "lives", liveId, "handraises", uid)).catch(() => {});
  };

  const revokeSpeech = async (uid: string) => {
    await setDoc(doc(db, "lives", liveId, "speakers", uid), { canSpeak: false }, { merge: true });
  };

  const speakerList = Array.from(speakers);

  return (
    <div className="flex flex-col h-full">

      {/* ── Fila de pedidos ── */}
      {handRaiseQueue.length > 0 ? (
        <>
          <SectionLabel count={handRaiseQueue.length}>A pedir palavra</SectionLabel>
          {handRaiseQueue.map((h, idx) => (
            <div
              key={h.uid}
              className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[2%] transition-colors group"
            >
              {/* Order number */}
              <span className="text-[11px] font-bold text-white/20 w-4 shrink-0 tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
              <Avatar name={h.name} />
              <span className="text-sm text-white/70 truncate flex-1">{h.name}</span>
              <button
                onClick={() => grantSpeech(h.uid)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[11px] font-bold hover:bg-white/90 transition-colors"
              >
                <Mic className="h-3 w-3" /> Dar palavra
              </button>
            </div>
          ))}
        </>
      ) : (
        <div className="border-b border-white/5">
          <SectionLabel>A pedir palavra</SectionLabel>
          <EmptyState icon={<Hand />} text="Quando um aluno pedir a palavra aparece aqui por ordem de chegada" />
        </div>
      )}

      {/* ── Com palavra ── */}
      <SectionLabel count={speakerList.length}>Com palavra</SectionLabel>
      <div className="flex-1 overflow-y-auto">
        {speakerList.length === 0
          ? <EmptyState icon={<Volume2 />} text="Nenhum aluno com microfone ativo" />
          : speakerList.map(uid => (
            <div
              key={uid}
              className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[2%] transition-colors group border-l-2 border-l-green-500"
            >
              <Avatar name={uid} />
              <span className="text-sm text-white/80 truncate flex-1">{uid}</span>
              <Waveform />
              <button
                onClick={() => revokeSpeech(uid)}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 text-[11px] font-bold transition-colors opacity-0 group-hover:opacity-100"
              >
                <MicOff className="h-3 w-3" /> Silenciar
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AlunosPanel
// ─────────────────────────────────────────────────────────────
function AlunosPanel({ liveId }: { liveId: string }) {
  const participants = useParticipants();
  const [speakers, setSpeakers] = useState<Set<string>>(new Set());
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lives", liveId, "speakers"), snap => {
      const s = new Set<string>();
      snap.docs.forEach(d => { if (d.data().canSpeak === true) s.add(d.id); });
      setSpeakers(s);
    });
    return () => unsub();
  }, [liveId]);

  const students = participants.filter(p => !p.isLocal);

  return (
    <div className="flex flex-col h-full">
      <SectionLabel count={students.length}>Conectados</SectionLabel>
      <div className="flex-1 overflow-y-auto">
        {students.length === 0
          ? <EmptyState icon={<Users />} text="Nenhum aluno conectado ainda" />
          : students.map(p => {
            const isSpeaker = speakers.has(p.identity);
            const name = p.name || p.identity;
            const isMuted = !("audioTracks" in p && Array.isArray(p.audioTracks) && p.audioTracks.some(t => t?.isSubscribed && t?.source?.toString?.().includes("MICROPHONE")));
            
            return (
              <div
                key={p.identity}
                className={[
                  "flex items-center gap-3 px-4 py-3 border-b border-white/5 transition-colors group",
                  isSpeaker ? "border-l-2 border-l-green-500 bg-green-500/[3%]" : "hover:bg-white/[2%]",
                ].join(" ")}
              >
                {/* Status dot */}
                <span className={`w-1.5 h-1.5 shrink-0 ${isSpeaker ? "bg-green-400" : "bg-white/15"}`} />
                <Avatar name={name} size={28} />
                <span className="text-sm text-white/70 truncate flex-1">{name}</span>
                {isSpeaker && <Waveform />}
                
                {/* Moderation buttons - show on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      // TODO: Implement kick participant
                      alert(`Em desenvolvimento: Kick ${name}`);
                    }}
                    className="p-1 text-red-400/50 hover:text-red-400 transition-colors"
                    title={`Remover ${name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ChatPanel
// ─────────────────────────────────────────────────────────────
function ChatPanel({ liveId, pinnedMsg, onPin, hostName }: {
  liveId: string; pinnedMsg: ChatMessage | null; onPin: (m: ChatMessage | null) => void; hostName: string;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "lives", liveId, "chat"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
    return () => unsub();
  }, [liveId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const msg = text.trim(); setText("");
    await addDoc(collection(db, "lives", liveId, "chat"), {
      liveId, uid: user.uid, displayName: user.displayName || hostName,
      photoURL: user.photoURL || "", text: msg, type: "message", createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Pinned */}
      {pinnedMsg && (
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/8 border-l-2 border-amber-400 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70 mb-0.5">Fixado</p>
            <p className="text-xs text-white/60 truncate">{pinnedMsg.text}</p>
          </div>
          <button onClick={() => onPin(null)} className="text-white/20 hover:text-white/50 shrink-0 mt-0.5">
            <span className="text-base leading-none">×</span>
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {messages.length === 0 && <EmptyState icon={<MessageSquare />} text="Nenhuma mensagem ainda" />}
        {messages.map(msg => {
          // Mostrar apenas mensagens não-ocultas
          if (msg.hidden) return null;
          
          return (
            <div key={msg.id} className="group">
              {msg.type === "hand_raise" ? (
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-500/8 border-l-2 border-amber-400/50 text-amber-300/80 text-xs my-2">
                  <div className="flex items-center gap-2">
                    <Hand className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-bold">{msg.displayName}</span>
                    <span className="text-white/30">pediu a palavra</span>
                  </div>
                  <button
                    onClick={async () => {
                      await deleteDoc(doc(db, "lives", liveId, "chat", msg.id!));
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400/50 hover:text-red-400 transition-all"
                    title="Remover"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : msg.type === "system" ? (
                <div className="text-center text-[11px] text-white/20 py-2 italic">{msg.text}</div>
              ) : (
                <div className="flex gap-2 items-start hover:bg-white/[3%] px-2 py-1.5 -mx-2 transition-colors group">
                  <Avatar name={msg.displayName || "?"} size={22} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-white/50 mr-1.5">{msg.displayName}</span>
                    <span className="text-sm text-white/80 break-words">{msg.text}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => onPin(pinnedMsg?.id === msg.id ? null : msg)}
                      className="p-1 text-white/20 hover:text-amber-400 transition-colors shrink-0"
                      title="Fixar mensagem"
                    >
                      <span className="text-sm">📌</span>
                    </button>
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, "lives", liveId, "chat", msg.id!), {
                          hidden: true,
                          hiddenAt: serverTimestamp(),
                        });
                      }}
                      className="p-1 text-red-400/50 hover:text-red-400 transition-colors shrink-0"
                      title="Ocultar mensagem"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/8">
        <form onSubmit={send} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escrever mensagem..."
            className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex items-center justify-center h-9 w-9 bg-white disabled:bg-white/10 disabled:text-white/20 text-black hover:bg-white/90 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stage — professor video
// ─────────────────────────────────────────────────────────────
function Stage({ hostName }: { hostName: string }) {
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone],
    { onlySubscribed: false }
  );
  const { localParticipant } = useLocalParticipant();
  const screenTrack = tracks.find(t => t.source === Track.Source.ScreenShare && t.participant.identity === localParticipant.identity);
  const cameraTrack = tracks.find(t => t.source === Track.Source.Camera && t.participant.identity === localParticipant.identity);
  const audioTracks = tracks.filter(t => t.source === Track.Source.Microphone && t.participant.identity !== localParticipant?.identity);

  return (
    <div className="relative w-full h-full bg-[#0a0a0c] flex items-center justify-center">
      {audioTracks.map(track => (
        <AudioTrack key={track.participant.identity} trackRef={track} />
      ))}

      {screenTrack
        ? <VideoTrack trackRef={screenTrack} className="w-full h-full object-contain" />
        : cameraTrack
        ? <VideoTrack trackRef={cameraTrack} className="w-[85%] h-[85%] object-cover" />
        : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <VideoOff className="h-12 w-12 text-white/10" />
            <span className="text-sm text-white/20">Câmara desligada</span>
          </div>
        )}

      {/* Professor nameplate */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-white drop-shadow-sm">{hostName}</span>
        <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Professor</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ControlsBar
// ─────────────────────────────────────────────────────────────
function ControlsBar({ live, onEnd }: { live: LiveSession; onEnd: () => void }) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { localParticipant } = useLocalParticipant();

  const isMicOn = localParticipant?.isMicrophoneEnabled ?? true;
  const isCamOn = localParticipant?.isCameraEnabled ?? true;
  const isScreenOn = localParticipant?.isScreenShareEnabled ?? false;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const btnBase = "flex flex-col items-center justify-center gap-0.5 sm:gap-1 h-12 sm:h-14 w-12 sm:w-fit sm:min-w-[64px] sm:px-1 px-0 transition-colors select-none text-white/70 hover:text-white hover:bg-white/8";
  const btnText = "hidden sm:inline text-[10px] sm:text-[10px] font-medium tracking-wide leading-none";

  return (
    <>
      <div className="h-14 sm:h-16 bg-[#0e0e11] border-t border-white/8 flex items-center px-2 sm:px-4 gap-1 sm:gap-2 shrink-0 overflow-x-auto sm:overflow-x-visible">
        <div className="flex-1" />

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button 
            onClick={() => localParticipant?.setMicrophoneEnabled(!isMicOn)}
            className={`${btnBase} ${isMicOn ? "" : "text-red-400 bg-red-500/10 hover:bg-red-500/20"}`}
            aria-label={isMicOn ? "Desligar microfone" : "Ligar microfone"}
            title={isMicOn ? "Desligar microfone" : "Ligar microfone"}
          >
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            <span className={btnText}>Mic</span>
          </button>

          <button 
            onClick={() => localParticipant?.setCameraEnabled(!isCamOn)}
            className={`${btnBase} ${isCamOn ? "" : "text-red-400 bg-red-500/10 hover:bg-red-500/20"}`}
            aria-label={isCamOn ? "Desligar câmara" : "Ligar câmara"}
            title={isCamOn ? "Desligar câmara" : "Ligar câmara"}
          >
            {isCamOn ? <Video size={18} /> : <VideoOff size={18} />}
            <span className={btnText}>Cam</span>
          </button>

          <div className="w-px h-8 bg-white/8 mx-1 sm:mx-2 hidden sm:block" />

          <button 
            onClick={() => localParticipant?.setScreenShareEnabled(!isScreenOn)}
            className={`${btnBase} ${isScreenOn ? "text-blue-300 bg-blue-500/15 hover:bg-blue-500/25" : ""}`}
            aria-label={isScreenOn ? "Parar partilha" : "Partilhar ecrã"}
            title={isScreenOn ? "Parar partilha" : "Partilhar ecrã"}
          >
            <MonitorUp size={18} />
            <span className={btnText}>Partilha</span>
          </button>

          <div className="w-px h-8 bg-white/8 mx-1 sm:mx-2 hidden sm:block" />

          <button 
            onClick={() => {
              // TODO: Implement mute all students
              alert("Em desenvolvimento: Mute-All para alunos");
            }}
            className={`${btnBase}`}
            aria-label="Silenciar todos os alunos"
            title="Silenciar todos os alunos"
          >
            <Volume2 size={18} />
            <span className={btnText}>Mute</span>
          </button>

          <button 
            onClick={toggleFullscreen}
            className={`${btnBase} hidden sm:flex`}
            aria-label={isFullscreen ? "Sair de ecrã total" : "Ecrã total"}
            title={isFullscreen ? "Sair de ecrã total" : "Ecrã total"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span className={btnText}>{isFullscreen ? "Sair" : "Tela"}</span>
          </button>
        </div>

        <div className="flex-1 flex justify-end">
          <button 
            onClick={() => setShowEndConfirm(true)}
            aria-label="Encerrar aula"
            className="flex items-center gap-1 sm:gap-2 h-10 px-3 sm:px-5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs sm:text-sm transition-colors whitespace-nowrap"
          >
            <PhoneOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
            <span className="hidden sm:inline">Encerrar</span>
          </button>
        </div>
      </div>

      {showEndConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/75" onClick={() => setShowEndConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111114] border border-white/10 p-6 sm:p-8 max-w-sm w-full space-y-5"
              role="dialog" aria-modal="true" aria-labelledby="end-confirm-title" aria-describedby="end-confirm-desc"
              onKeyDown={(e) => { if (e.key === "Escape") setShowEndConfirm(false); }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 id="end-confirm-title" className="text-base font-bold text-white">Encerrar aula?</h3>
                  <p id="end-confirm-desc" className="text-xs sm:text-sm text-white/40 mt-1">Todos os participantes serão desconectados imediatamente.</p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={() => setShowEndConfirm(false)}
                  aria-label="Cancelar"
                  className="flex-1 py-2.5 text-xs sm:text-sm font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => { setShowEndConfirm(false); onEnd(); }}
                  aria-label="Sim, encerrar"
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

// ─────────────────────────────────────────────────────────────
// StudioInterior
// ─────────────────────────────────────────────────────────────
function StudioInterior({ live, onEnd }: { live: LiveSession; onEnd: () => void }) {
  const [sideTab, setSideTab] = useState<"palavra" | "alunos" | "chat" | "recording" | "qa" | "attendance" | "simple-recorder">("palavra");
  const [pinnedMsg, setPinnedMsg] = useState<ChatMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const participants = useParticipants();
  useEntrySound();

  const tabs = [
    { id: "palavra" as const, label: "Palavra", icon: <Hand className="h-3.5 w-3.5" /> },
    { id: "alunos" as const, label: "Alunos", icon: <Users className="h-3.5 w-3.5" /> },
    { id: "chat" as const, label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: "simple-recorder" as const, label: "Gravar", icon: <Radio className="h-3.5 w-3.5" /> },
    { id: "qa" as const, label: "Q&A", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: "attendance" as const, label: "Presença", icon: <Users className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c]">

      {/* ── Top bar (44px) ── */}
      <div className="h-11 min-h-[44px] bg-[#0e0e11] border-b border-white/8 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Radio className="h-3.5 w-3.5 text-white/30 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-white/80 truncate">{live.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-red-600/15 border border-red-500/20 px-2 py-0.5 hidden sm:flex">
            <span className="w-1.5 h-1.5 bg-red-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-bold text-red-400 tracking-widest">AO VIVO</span>
          </div>
          {live.startedAt && <ElapsedTimer since={live.startedAt} />}
        </div>

        {/* Share Link Button */}
        <ShareLiveButton liveId={live.id!} liveTitle={live.title} />

        <div className="flex items-center gap-1.5 text-white/40 shrink-0">
          <Eye className="h-3.5 w-3.5" />
          <span className="text-xs tabular-nums font-medium">{participants.length}</span>
        </div>

        {/* Mobile menu toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Fechar barra lateral" : "Abrir barra lateral"}
          className="md:hidden flex items-center justify-center h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          {sidebarOpen ? <MessageSquare className="h-4 w-4" /> : <MessageSquare className="h-4 w-4 opacity-50" />}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        <div className="flex-1 flex min-w-0 bg-black md:order-1 order-2">
          <div className="flex-1 relative w-full">
            <Stage hostName={live.hostName || "Professor"} />
          </div>
        </div>

        {/* Sidebar */}
        <div className={`
          flex flex-col bg-[#0e0e11] border-t md:border-t-0 md:border-l border-white/8
          w-full md:w-[280px] lg:w-[320px] shrink-0
          order-1 md:order-2
          transition-all duration-300 ease-out
          ${sidebarOpen ? 'h-auto md:h-auto' : 'h-0 overflow-hidden md:h-auto'}
        `}>
          <div className="flex border-b border-white/8 shrink-0 gap-0" role="tablist" aria-label="Painel lateral">
            {tabs.map(t => (
              <button 
                key={t.id} 
                onClick={() => setSideTab(t.id)}
                role="tab"
                aria-selected={sideTab === t.id}
                aria-controls={`panel-${t.id}`}
                id={`tab-${t.id}`}
                className={`flex-1 h-10 flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-xs font-semibold transition-colors ${
                  sideTab === t.id 
                    ? "text-white border-b-2 border-white bg-white/[3%]" 
                    : "text-white/30 hover:text-white/60 bg-transparent"
                }`}
              >
                <span className="text-xs sm:text-sm">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {sideTab === "palavra" && <div role="tabpanel" id="panel-palavra" aria-labelledby="tab-palavra"><PalavraPanel liveId={live.id!} /></div>}
            {sideTab === "alunos" && <div role="tabpanel" id="panel-alunos" aria-labelledby="tab-alunos"><AlunosPanel liveId={live.id!} /></div>}
            {sideTab === "chat" && <div role="tabpanel" id="panel-chat" aria-labelledby="tab-chat"><ChatPanel liveId={live.id!} pinnedMsg={pinnedMsg} onPin={setPinnedMsg} hostName={live.hostName || "Professor"} /></div>}
            {sideTab === "simple-recorder" && <div role="tabpanel" id="panel-simple-recorder" aria-labelledby="tab-simple-recorder"><SimpleRecorder liveId={live.id!} liveTitle={live.title} /></div>}
            {sideTab === "recording" && <div role="tabpanel" id="panel-recording" aria-labelledby="tab-recording"><RecordingControls live={live} isHost={true} onStatusChange={() => {}} /></div>}
            {sideTab === "qa" && <div role="tabpanel" id="panel-qa" aria-labelledby="tab-qa"><QAPanel liveId={live.id!} isHost={true} hostName={live.hostName || "Professor"} /></div>}
            {sideTab === "attendance" && <div role="tabpanel" id="panel-attendance" aria-labelledby="tab-attendance"><AttendanceReport liveId={live.id!} liveTitle={live.title} isTeacher={true} /></div>}
          </div>
        </div>
      </div>

      <ControlsBar live={live} onEnd={onEnd} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main StudioPage
// ─────────────────────────────────────────────────────────────
interface StudioPageProps { redirectAfterEnd?: string }

export default function StudioPage({ redirectAfterEnd = "/admin/lives" }: StudioPageProps) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [live, setLive] = useState<LiveSession | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const [joinOpts, setJoinOpts] = useState<{ audio: boolean; video: boolean }>({ audio: true, video: true });

  useEffect(() => {
    if (!id || !user) return;
    const init = async () => {
      try {
        const snap = await getDoc(doc(db, "lives", id));
        if (!snap.exists()) { setError("Aula não encontrada."); setLoading(false); return; }
        const liveData = { id: snap.id, ...snap.data() } as LiveSession;
        if (liveData.status === "scheduled") {
          const now = new Date().toISOString();
          await updateDoc(doc(db, "lives", id), { status: "live", startedAt: now, updatedAt: serverTimestamp() });
          liveData.status = "live"; liveData.startedAt = now;
          await addDoc(collection(db, "broadcasts"), {
            type: "live_started", title: "Aula ao Vivo Agora",
            message: `"${liveData.title}" começou!`, link: `/dashboard/lives/${id}`, createdAt: serverTimestamp(),
          });
        }
        setLive(liveData);
      } catch (err) { console.error(err); setError("Erro ao carregar a aula."); }
      finally { setLoading(false); }
    };
    init();
  }, [id, user]);

  const handleJoin = useCallback(async (opts: { audio: boolean; video: boolean }) => {
    if (!user || !live) return;
    setJoinOpts(opts); setLoading(true);
    try {
      const authToken = await user.getIdToken();
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify({ roomName: live.roomName, name: user.displayName || "Professor" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setToken(data.token); setJoined(true);
    } catch (err) { console.error(err); setError("Erro ao conectar à sala."); }
    finally { setLoading(false); }
  }, [user, live]);

  const handleEnd = useCallback(async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "lives", id), { status: "ended", endedAt: new Date().toISOString(), updatedAt: serverTimestamp() });
      await addDoc(collection(db, "lives", id, "chat"), {
        liveId: id, uid: user.uid, displayName: "Sistema",
        text: "A aula foi encerrada pelo professor.", type: "system", createdAt: serverTimestamp(),
      });
      router.push(redirectAfterEnd);
    } catch (err) { console.error(err); }
  }, [id, router, user, redirectAfterEnd]);

  // ── Loading & error states ──
  if (loading && !joined) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-7 w-7 animate-spin text-white/30" />
        <p className="text-sm text-white/30">A preparar o estúdio...</p>
      </div>
    </div>
  );

  if (error && !joined) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
      <div className="text-center space-y-4 max-w-xs">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto" />
        <p className="text-base font-bold text-white">{error}</p>
        <button onClick={() => router.push(redirectAfterEnd)} className="text-sm text-white/30 hover:text-white/60 transition-colors">
          ← Voltar
        </button>
      </div>
    </div>
  );

  if (!joined) return <PreJoin onJoin={handleJoin} />;

  if (!token) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
      <Loader2 className="h-7 w-7 animate-spin text-white/30" />
    </div>
  );

  return (
    <LiveKitRoom
      video={joinOpts.video}
      audio={joinOpts.audio}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
      onDisconnected={() => { if (live?.status !== "ended") router.push(redirectAfterEnd); }}
    >
      {live && <StudioInterior live={live} onEnd={handleEnd} />}
    </LiveKitRoom>
  );
}