"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, onSnapshot, collection, addDoc,
  query, orderBy, serverTimestamp, setDoc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  LiveKitRoom, VideoTrack, AudioTrack, useTracks, useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Send, Users, MessageSquare, Radio, Loader2,
  AlertTriangle, Hand, ArrowLeft, Eye, Volume2,
  Maximize2, Settings, Pin, ChevronRight, Heart, Mic, MicOff,
} from "lucide-react";
import type { LiveSession, ChatMessage } from "@/types/live";

// ── Chat ──────────────────────────────────────────────────
function ViewerChat({ liveId }: { liveId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [pinnedMsg, setPinnedMsg] = useState<ChatMessage | null>(null);
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
      displayName: user.displayName || "Aluno",
      photoURL: user.photoURL || "",
      text: msg, type: "message",
      createdAt: serverTimestamp(),
    });
  };

  const raiseHand = async () => {
    if (!user) return;
    await addDoc(collection(db, "lives", liveId, "chat"), {
      liveId, uid: user.uid,
      displayName: user.displayName || "Aluno",
      photoURL: user.photoURL || "",
      text: "", type: "hand_raise",
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e10]">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-bold text-white">Chat ao Vivo</span>
        <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5">{messages.length}</span>
      </div>

      {/* Pinned */}
      {pinnedMsg && (
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
          <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-400">Fixado pelo Admin</p>
            <p className="text-xs text-gray-300 mt-0.5">{pinnedMsg.text}</p>
          </div>
          <button onClick={() => setPinnedMsg(null)} className="text-gray-600 hover:text-gray-400 shrink-0">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-8">Sem mensagens. Diga olá! 👋</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
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
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input + raise hand */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Enviar mensagem..."
            className="flex-1 bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button type="submit" disabled={!text.trim()}
            className="flex items-center justify-center h-9 w-9 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </form>
        <button onClick={raiseHand}
          className="flex items-center justify-center gap-2 w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20 transition-colors">
          <Hand className="h-3.5 w-3.5" /> Levantar a Mão
        </button>
      </div>
    </div>
  );
}

// ── Participants ───────────────────────────────────────────
function ViewerParticipants() {
  const participants = useParticipants();
  return (
    <div className="flex flex-col h-full bg-[#0e0e10]">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <Users className="h-4 w-4 text-green-400" />
        <span className="text-sm font-bold text-white">Online</span>
        <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5">{participants.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {participants.map((p) => (
          <div key={p.identity} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors">
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {(p.name || p.identity)?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 truncate flex-1">{p.name || p.identity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Viewer Stage ───────────────────────────────────────────
function ViewerStage({ live }: { live: LiveSession }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone], { onlySubscribed: true });
  const participants = useParticipants();
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const audioTracks = tracks.filter((t) => t.source === Track.Source.Microphone);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Audio tracks — hidden elements that play the host's mic */}
      {audioTracks.map((track) => (
        <AudioTrack key={track.participant.identity} trackRef={track} />
      ))}

      {screenTrack ? (
        <>
          <VideoTrack trackRef={screenTrack} className="w-full h-full object-contain" />
          {cameraTrack && (
            <div className="absolute bottom-16 right-4 w-44 h-32 shadow-2xl border-2 border-purple-600/50 overflow-hidden">
              <VideoTrack trackRef={cameraTrack} className="w-full h-full object-cover" />
            </div>
          )}
        </>
      ) : cameraTrack ? (
        <VideoTrack trackRef={cameraTrack} className="w-full h-full object-contain" />
      ) : (
        <div className="flex flex-col items-center gap-4 text-gray-700">
          <Radio className="h-20 w-20" />
          <span className="text-lg font-medium text-gray-500">A aguardar o professor...</span>
        </div>
      )}

      {/* Bottom controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-8">
        <div className="w-full h-1 bg-gray-700 mb-3">
          <div className="h-full bg-red-500 w-full" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
          <Volume2 className="h-5 w-5 text-white ml-1" />
          <div className="flex items-center gap-1.5 text-white text-sm ml-2">
            <Eye className="h-4 w-4" />
            <span className="font-medium">{participants.length}</span>
          </div>
          <div className="flex-1" />
          <button className="flex items-center justify-center h-9 w-9 bg-gray-800/80 hover:bg-gray-700 text-white transition-colors backdrop-blur-sm">
            <Settings className="h-4 w-4" />
          </button>
          <button className="flex items-center justify-center h-9 w-9 bg-gray-800/80 hover:bg-gray-700 text-white transition-colors backdrop-blur-sm">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Viewer Interior ────────────────────────────────────────
function ViewerInterior({ live }: { live: LiveSession }) {
  const { user } = useAuth();
  const { localParticipant } = useLocalParticipant();
  const [sidePanel, setSidePanel] = useState<"chat" | "participants">("chat");
  const [canSpeak, setCanSpeak] = useState(false);
  const participants = useParticipants();

  useEffect(() => {
    if (!user || !live.id) return;
    const unsub = onSnapshot(doc(db, "lives", live.id, "speakers", user.uid), (snap) => {
      const allowed = snap.exists() && snap.data().canSpeak === true;
      setCanSpeak(allowed);
    });
    return () => unsub();
  }, [live.id, user]);

  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(canSpeak);
    }
  }, [canSpeak, localParticipant]);

  return (
    <div className="flex flex-col h-screen bg-[#0e0e10] overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-[#18181b] border-b border-gray-800 shrink-0">
        <Link href="/dashboard/lives"
          className="flex items-center justify-center h-8 w-8 bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-white truncate max-w-xs">{live.title}</span>
        </div>
        <div className="flex-1" />
        <div className="flex border border-gray-700 overflow-hidden">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${canSpeak ? "bg-green-600/30 text-green-400" : "bg-gray-800 text-gray-500"}`}
            title={canSpeak ? "Podes falar" : "Microfone desativado"}
          >
            {canSpeak ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          </div>
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

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">

          {/* Video */}
          <div className="relative flex-1 min-h-0">
            <ViewerStage live={live} />
          </div>

          {/* Stream info — below video */}
          <div className="bg-[#18181b] border-t border-gray-800 px-6 py-4 shrink-0">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xl font-bold">
                {live.hostName?.[0]?.toUpperCase() || "P"}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{live.title}</h2>
                <p className="text-sm text-purple-400 font-medium mt-0.5">{live.hostName || "Professor"}</p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{live.description}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{participants.length}</p>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
                <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 font-bold text-sm transition-colors">
                  <Heart className="h-4 w-4" /> Seguir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-[340px] shrink-0 border-l border-gray-800 flex flex-col">
          {sidePanel === "chat" ? <ViewerChat liveId={live.id!} /> : <ViewerParticipants />}
        </div>
      </div>
    </div>
  );
}

// ── Ended Overlay ──────────────────────────────────────────
function EndedOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-[#0e0e10] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-8">
        <div className="w-20 h-20 bg-gray-800 flex items-center justify-center mx-auto">
          <Radio className="h-10 w-10 text-gray-600" />
        </div>
        <h2 className="text-2xl font-bold text-white">Aula Terminada</h2>
        <p className="text-gray-400">O professor encerrou esta aula ao vivo. Obrigado por participar!</p>
        <Link href="/dashboard/lives"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 font-bold transition-colors">
          <ArrowLeft className="h-5 w-5" /> Voltar às Aulas
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function ViewerPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const [live, setLive] = useState<LiveSession | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const init = async () => {
      try {
        const snap = await getDoc(doc(db, "lives", id));
        if (!snap.exists()) { setError("Aula não encontrada."); setLoading(false); return; }
        const liveData = { id: snap.id, ...snap.data() } as LiveSession;
        if (liveData.status === "ended") { setEnded(true); setLoading(false); return; }
        if (liveData.status !== "live") { setError("Esta aula ainda não começou."); setLoading(false); return; }
        setLive(liveData);

        const res = await fetch("/api/livekit/token", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: liveData.roomName, identity: user.uid, name: user.displayName || "Aluno", isHost: false }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setToken(data.token);
      } catch (err) {
        console.error(err); setError("Erro ao conectar à aula.");
      } finally { setLoading(false); }
    };
    init();
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "lives", id), (snap) => {
      if (snap.exists() && snap.data().status === "ended") setEnded(true);
    });
    return () => unsub();
  }, [id]);

  if (ended) return <EndedOverlay />;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-gray-400">A entrar na aula...</p>
      </div>
    </div>
  );

  if (error || !live) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
        <p className="text-lg font-bold text-white">{error || "Erro"}</p>
        <Link href="/dashboard/lives" className="text-sm text-purple-400 hover:text-purple-300">Voltar às aulas</Link>
      </div>
    </div>
  );

  if (!token) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
    </div>
  );

  return (
    <LiveKitRoom
      video={false} audio={true} token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
    >
      <ViewerInterior live={live} />
    </LiveKitRoom>
  );
}
