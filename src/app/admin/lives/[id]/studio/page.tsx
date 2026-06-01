"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, updateDoc, collection, addDoc, setDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  LiveKitRoom, VideoTrack, AudioTrack, useTracks, useParticipants,
  TrackToggle, useLocalParticipant, useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff,
  Send, Users, Clock, Radio, MessageSquare, Loader2,
  AlertTriangle, Hand, Settings, Maximize2, Volume2,
  Pin, ChevronRight, Eye,
} from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { LiveSession, ChatMessage } from "@/types/live";

// ── Elapsed Timer ─────────────────────────────────────────
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
  return <span className="font-mono tabular-nums text-white text-sm">{elapsed}</span>;
}

// ── Chat ──────────────────────────────────────────────────
function ChatPanel({ liveId, pinnedMsg, onPin }: {
  liveId: string;
  pinnedMsg: ChatMessage | null;
  onPin: (msg: ChatMessage | null) => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "lives", liveId, "chat"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [liveId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const msg = text.trim(); setText("");
    await addDoc(collection(db, "lives", liveId, "chat"), {
      liveId, uid: user.uid,
      displayName: user.displayName || "Admin",
      photoURL: user.photoURL || "",
      text: msg, type: "message",
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e10]">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-bold text-white">Chat ao Vivo</span>
        <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5">{messages.length}</span>
      </div>

      {/* Pinned message */}
      {pinnedMsg && (
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
          <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-400">Fixado pelo Admin</p>
            <p className="text-xs text-gray-300 mt-0.5 truncate">{pinnedMsg.text}</p>
          </div>
          <button onClick={() => onPin(null)} className="text-gray-600 hover:text-gray-400 shrink-0">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-8">Nenhuma mensagem ainda...</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="group">
            {msg.type === "hand_raise" ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <Hand className="h-3.5 w-3.5" />
                <span className="font-bold">{msg.displayName}</span> levantou a mão
              </div>
            ) : msg.type === "system" ? (
              <div className="text-center text-xs text-gray-600 py-1 italic">{msg.text}</div>
            ) : (
              <div className="flex gap-2 items-start hover:bg-white/5 px-1 py-0.5 -mx-1 transition-colors">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5">
                  {msg.displayName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-purple-400">{msg.displayName} </span>
                  <span className="text-sm text-gray-200 break-words">{msg.text}</span>
                </div>
                {/* Pin button on hover */}
                <button
                  onClick={() => onPin(pinnedMsg?.id === msg.id ? null : msg)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-amber-400 transition-all shrink-0"
                  title="Fixar mensagem"
                >
                  <Pin className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-800 flex gap-2">
        <input
          type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Enviar mensagem como Admin..."
          className="flex-1 bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button type="submit" disabled={!text.trim()}
          className="flex items-center justify-center h-9 w-9 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-colors">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

// ── Participants ───────────────────────────────────────────
function ParticipantsPanel({ liveId }: { liveId: string }) {
  const { user } = useAuth();
  const participants = useParticipants();
  const [speakers, setSpeakers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lives", liveId, "speakers"), (snap) => {
      const s = new Set<string>();
      snap.docs.forEach((d) => {
        if (d.data().canSpeak === true) s.add(d.id);
      });
      setSpeakers(s);
    });
    return () => unsub();
  }, [liveId]);

  const toggleSpeaker = async (uid: string, canSpeak: boolean) => {
    try {
      await setDoc(doc(db, "lives", liveId, "speakers", uid), { canSpeak }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e10]">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <Users className="h-4 w-4 text-green-400" />
        <span className="text-sm font-bold text-white">Participantes</span>
        <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5">{participants.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {participants.map((p) => {
          const isHost = p.isLocal;
          const isSpeaker = speakers.has(p.identity);
          return (
            <div key={p.identity} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors group">
              <div className={`w-2 h-2 rounded-full shrink-0 ${isSpeaker ? "bg-green-400" : "bg-gray-600"}`} />
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {(p.name || p.identity)?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-gray-300 truncate flex-1">{p.name || p.identity}</span>
              {isHost ? (
                <span className="text-[10px] text-purple-400 font-bold shrink-0">HOST</span>
              ) : (
                <button
                  onClick={() => toggleSpeaker(p.identity, !isSpeaker)}
                  className={`shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-bold transition-colors opacity-0 group-hover:opacity-100 ${
                    isSpeaker
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  }`}
                  title={isSpeaker ? "Silenciar" : "Permitir falar"}
                >
                  {isSpeaker ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  {isSpeaker ? "Silenciar" : "Falar"}
                </button>
              )}
            </div>
          );
        })}
        {participants.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-8">Nenhum participante ainda</p>
        )}
      </div>
    </div>
  );
}

// ── Video Stage ────────────────────────────────────────────
function Stage() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone], { onlySubscribed: false });
  const { localParticipant } = useLocalParticipant();
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare && t.participant.identity === localParticipant.identity);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera && t.participant.identity === localParticipant.identity);
  const audioTracks = tracks.filter((t) => t.source === Track.Source.Microphone && t.participant.identity !== localParticipant?.identity);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Audio tracks from remote participants */}
      {audioTracks.map((track) => (
        <AudioTrack key={track.participant.identity} trackRef={track} />
      ))}
      <VideoPlayer
        source={{
          type: "livekit",
          screenTrack: screenTrack ? <VideoTrack trackRef={screenTrack} className="w-full h-full object-contain" /> : undefined,
          videoTrack: cameraTrack ? <VideoTrack trackRef={cameraTrack} className="w-full h-full object-cover" /> : undefined,
        }}
      />
      {!screenTrack && !cameraTrack && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 pointer-events-none">
          <VideoOff className="h-20 w-20" />
          <span className="text-lg font-medium text-gray-500 mt-4">Câmara desligada</span>
        </div>
      )}
    </div>
  );
}

// ── Controls Bar (bottom of video) ────────────────────────
function VideoControls({ live, onEnd }: { live: LiveSession; onEnd: () => void }) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const participants = useParticipants();

  return (
    <>
      {/* Bottom controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-8">
        {/* Progress bar style — red line */}
        <div className="w-full h-1 bg-gray-700 mb-3">
          <div className="h-full bg-red-500 w-full" />
        </div>

        <div className="flex items-center gap-3">
          {/* Live badge */}
          <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>

          {/* Timer */}
          {live.startedAt && <ElapsedTimer since={live.startedAt} />}

          {/* Volume icon */}
          <Volume2 className="h-5 w-5 text-white ml-1" />

          {/* Viewers */}
          <div className="flex items-center gap-1.5 text-white text-sm ml-2">
            <Eye className="h-4 w-4" />
            <span className="font-medium">{participants.length}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Media toggles */}
          <TrackToggle source={Track.Source.Microphone}
            className="flex items-center justify-center h-9 w-9 bg-gray-800/80 hover:bg-gray-700 text-white transition-colors data-[lk-muted=true]:bg-red-600/80 backdrop-blur-sm" />
          <TrackToggle source={Track.Source.Camera}
            className="flex items-center justify-center h-9 w-9 bg-gray-800/80 hover:bg-gray-700 text-white transition-colors data-[lk-muted=true]:bg-red-600/80 backdrop-blur-sm" />
          <TrackToggle source={Track.Source.ScreenShare}
            className="flex items-center justify-center h-9 w-9 bg-gray-800/80 hover:bg-gray-700 text-white transition-colors data-[lk-enabled=true]:bg-blue-600/80 backdrop-blur-sm" />

          {/* Settings */}
          <button className="flex items-center justify-center h-9 w-9 bg-gray-800/80 hover:bg-gray-700 text-white transition-colors backdrop-blur-sm">
            <Settings className="h-4 w-4" />
          </button>

          {/* Fullscreen */}
          <button className="flex items-center justify-center h-9 w-9 bg-gray-800/80 hover:bg-gray-700 text-white transition-colors backdrop-blur-sm">
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* End */}
          <button onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-2 h-9 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors ml-2">
            <PhoneOff className="h-4 w-4" />
            Terminar
          </button>
        </div>
      </div>

      {/* End confirmation */}
      {showEndConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#18181b] border border-gray-700 p-8 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-bold text-white">Terminar Aula?</h3>
              </div>
              <p className="text-sm text-gray-400">Todos os participantes serão desconectados. Esta ação não pode ser revertida.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={() => { setShowEndConfirm(false); onEnd(); }}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
                  Terminar Aula
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── Studio Interior ────────────────────────────────────────
function StudioInterior({ live, onEnd }: { live: LiveSession; onEnd: () => void }) {
  const [sidePanel, setSidePanel] = useState<"chat" | "participants">("chat");
  const [pinnedMsg, setPinnedMsg] = useState<ChatMessage | null>(null);
  const participants = useParticipants();

  return (
    <div className="flex flex-col h-dvh bg-[#0e0e10] overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-[#18181b] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-500 animate-pulse" />
          <span className="text-sm font-bold text-white truncate max-w-xs">{live.title}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          AO VIVO
        </div>
        <div className="flex-1" />
        {/* Panel toggle */}
        <div className="flex border border-gray-700 overflow-hidden">
          <button onClick={() => setSidePanel("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${sidePanel === "chat" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
            <MessageSquare className="h-3.5 w-3.5" /> Chat
          </button>
          <button onClick={() => setSidePanel("participants")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${sidePanel === "participants" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
            <Users className="h-3.5 w-3.5" /> {participants.length}
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* Video + info column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Video area */}
          <div className="relative flex-1 min-h-0 bg-black">
            <Stage />
            <VideoControls live={live} onEnd={onEnd} />
          </div>

          {/* Stream info bar — below video like Twitch */}
          <div className="bg-[#18181b] border-t border-gray-800 px-4 sm:px-6 py-4 shrink-0">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-10 sm:h-14 w-10 sm:w-14 shrink-0 items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xl font-bold">
                {live.hostName?.[0]?.toUpperCase() || "A"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white truncate">{live.title}</h2>
                </div>
                <p className="text-sm text-purple-400 font-medium mt-0.5">{live.hostName || "Admin"}</p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2 hidden sm:block">{live.description}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-white">{participants.length}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Espectadores</p>
                </div>
                {live.startedAt && (
                  <div className="text-center">
                    <ElapsedTimer since={live.startedAt} />
                    <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Duração</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col max-h-[40vh] lg:max-h-none">
          {sidePanel === "chat"
            ? <ChatPanel liveId={live.id!} pinnedMsg={pinnedMsg} onPin={setPinnedMsg} />
            : <ParticipantsPanel liveId={live.id!} />
          }
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [live, setLive] = useState<LiveSession | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !user) return;
    const init = async () => {
      try {
        const snap = await getDoc(doc(db, "lives", id));
        if (!snap.exists()) { setError("Live não encontrada."); setLoading(false); return; }
        const liveData = { id: snap.id, ...snap.data() } as LiveSession;

        if (liveData.status === "scheduled") {
          const now = new Date().toISOString();
          await updateDoc(doc(db, "lives", id), { status: "live", startedAt: now, updatedAt: serverTimestamp() });
          liveData.status = "live"; liveData.startedAt = now;
          await addDoc(collection(db, "broadcasts"), {
            type: "live_started",
            title: "Aula ao Vivo Agora",
            message: `"${liveData.title}" começou! Entra agora para assistir.`,
            link: `/dashboard/lives/${id}`,
            createdAt: serverTimestamp(),
          });
        }
        setLive(liveData);

        const res = await fetch("/api/livekit/token", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: liveData.roomName, identity: user.uid, name: user.displayName || "Admin", isHost: true }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setToken(data.token);
      } catch (err) {
        console.error(err); setError("Erro ao conectar à sala.");
      } finally { setLoading(false); }
    };
    init();
  }, [id, user]);

  const handleEnd = useCallback(async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "lives", id), { status: "ended", endedAt: new Date().toISOString(), updatedAt: serverTimestamp() });
      await addDoc(collection(db, "lives", id, "chat"), {
        liveId: id, uid: user.uid, displayName: "Sistema",
        text: "A aula foi encerrada pelo professor.", type: "system", createdAt: serverTimestamp(),
      });
      router.push("/admin/lives");
    } catch (err) { console.error(err); }
  }, [id, router, user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
        <p className="text-gray-400">A preparar o studio...</p>
      </div>
    </div>
  );

  if (error || !live) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
        <p className="text-lg font-bold text-white">{error || "Erro desconhecido"}</p>
        <button onClick={() => router.push("/admin/lives")} className="text-sm text-purple-400 hover:text-purple-300">Voltar às lives</button>
      </div>
    </div>
  );

  if (!token) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <Loader2 className="h-8 w-8 animate-spin text-purple" />
    </div>
  );

  return (
    <LiveKitRoom
      video={true} audio={true} token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
      onDisconnected={() => { if (live.status !== "ended") router.push("/admin/lives"); }}
    >
      <StudioInterior live={live} onEnd={handleEnd} />
    </LiveKitRoom>
  );
}
