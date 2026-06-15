"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, onSnapshot, collection, addDoc, deleteDoc,
  query, orderBy, serverTimestamp, setDoc, increment, updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  LiveKitRoom, VideoTrack, AudioTrack, useTracks, useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Send, MessageSquare, Radio, Loader2,
  AlertTriangle, Hand, ArrowLeft, Eye, Volume2,
  Mic, MicOff,
} from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { LiveSession, ChatMessage } from "@/types/live";
import { playEntrySound } from "@/lib/entry-sound";

// ── Chat ──────────────────────────────────────────────────
function ViewerChat({ liveId }: { liveId: string }) {
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

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const msg = text.trim(); setText("");
    await addDoc(collection(db, "lives", liveId, "chat"), {
      liveId, uid: user.uid, displayName: user.displayName || "Aluno",
      photoURL: user.photoURL || "", text: msg, type: "message", createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e10]">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-bold text-white">Chat</span>
        <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5">{messages.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && <p className="text-xs text-gray-600 text-center py-8">Nenhuma mensagem ainda...</p>}
        {messages.map((msg) => (
          msg.type === "system" ? (
            <div key={msg.id} className="text-center text-xs text-gray-600 py-1 italic">{msg.text}</div>
          ) : (
            <div key={msg.id} className="flex gap-2 items-start hover:bg-white/5 px-1 py-0.5 -mx-1 transition-colors">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5">
                {msg.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-purple-400">{msg.displayName} </span>
                <span className="text-sm text-gray-200 break-words">{msg.text}</span>
              </div>
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="p-3 border-t border-gray-800 flex gap-2">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enviar mensagem..."
          className="flex-1 bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
        <button type="submit" disabled={!text.trim()}
          className="flex items-center justify-center h-9 w-9 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-600 text-white"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}

// ── Viewer Stage ───────────────────────────────────────────
function ViewerStage() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone], { onlySubscribed: false });
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare && t.participant.identity !== localParticipant?.identity);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera && t.participant.identity !== localParticipant?.identity);
  const audioTracks = tracks.filter((t) => t.source === Track.Source.Microphone && t.participant.identity !== localParticipant?.identity);

  return (
    <div className="relative w-full h-full bg-black">
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
      {/* Live badge + viewer count */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
          <div className="w-1.5 h-1.5 bg-white animate-pulse" />LIVE
        </div>
        <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-xs text-white">
          <Eye className="h-3.5 w-3.5" /><span>{participants.length}</span>
        </div>
      </div>
    </div>
  );
}

// ── Viewer Interior ────────────────────────────────────────
function ViewerInterior({ live }: { live: LiveSession }) {
  const { user } = useAuth();
  const { localParticipant } = useLocalParticipant();
  const [canSpeak, setCanSpeak] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const participants = useParticipants();
  const known = useRef(new Set<string>());

  // Entry sound
  useEffect(() => {
    participants.forEach(p => {
      if (!known.current.has(p.identity)) {
        known.current.add(p.identity);
        if (!p.isLocal) playEntrySound();
      }
    });
  }, [participants]);

  // Listen for speaker status
  useEffect(() => {
    if (!user || !live.id) return;
    const unsub = onSnapshot(doc(db, "lives", live.id!, "speakers", user.uid), (snap) => {
      const allowed = snap.exists() && snap.data().canSpeak === true;
      setCanSpeak(allowed);
      if (allowed) setHasRequested(false);
    });
    return () => unsub();
  }, [live.id, user]);

  // Check if this user already has a pending hand raise
  useEffect(() => {
    if (!user || !live.id) return;
    const unsub = onSnapshot(doc(db, "lives", live.id!, "handraises", user.uid), (snap) => {
      setHasRequested(snap.exists());
    });
    return () => unsub();
  }, [live.id, user]);

  // Enable/disable mic based on speaker permission
  useEffect(() => {
    if (localParticipant) localParticipant.setMicrophoneEnabled(canSpeak);
  }, [canSpeak, localParticipant]);

  const viewedRef = useRef(false);
  useEffect(() => {
    if (!user || !live.id || viewedRef.current) return;
    viewedRef.current = true;
    updateDoc(doc(db, "lives", live.id!), { views: increment(1) }).catch(() => {});
  }, [live.id, user]);

  // Request to speak
  const requestToSpeak = async () => {
    if (!user || hasRequested) return;
    try {
      await setDoc(doc(db, "lives", live.id!, "handraises", user.uid), {
        name: user.displayName || "Aluno", createdAt: serverTimestamp(),
      });
      setHasRequested(true);
    } catch {}
  };

  // Cancel request
  const cancelRequest = async () => {
    if (!user) return;
    await deleteDoc(doc(db, "lives", live.id!, "handraises", user.uid)).catch(() => {});
    setHasRequested(false);
  };

  return (
    <div className="flex flex-col h-dvh bg-[#0e0e10] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-[#18181b] border-b border-gray-800 shrink-0">
        <Link href="/dashboard/lives"
          className="flex items-center justify-center h-9 w-9 bg-gray-800 text-gray-400 hover:text-white transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-1.5 h-1.5 bg-red-500 animate-pulse shrink-0" />
          <span className="text-sm font-bold text-white truncate max-w-[200px]">{live.title}</span>
        </div>
        <div className="flex border border-gray-700">
          <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white">
            <MessageSquare className="h-3.5 w-3.5" /> Chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-row flex-1 min-h-0">
        {/* Teacher video */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="relative flex-1 min-h-0 bg-black">
            <ViewerStage />
          </div>

          {/* Info bar */}
          <div className="bg-[#18181b] border-t border-gray-800 px-4 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white text-lg font-bold">
                {live.hostName?.[0]?.toUpperCase() || "P"}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white truncate">{live.title}</h2>
                <p className="text-xs text-purple-400">{live.hostName || "Professor"}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Mic status */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold ${canSpeak ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-500 border border-gray-700"}`}>
                  {canSpeak ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                  {canSpeak ? "A falar" : "Mudo"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="w-[340px] shrink-0 border-l border-gray-800 flex flex-col">
          <ViewerChat liveId={live.id!} />
        </div>
      </div>

      {/* Bottom bar — "Dar a Palavra" */}
      <div className="bg-[#18181b] border-t border-gray-800 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 max-w-[calc(100%-340px)]">
          {canSpeak ? (
            <button onClick={cancelRequest}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors">
              <Volume2 className="h-4 w-4" /> Estás a falar — Clique para terminar
            </button>
          ) : hasRequested ? (
            <button onClick={cancelRequest}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors">
              <Hand className="h-4 w-4" /> Pedido enviado — Cancelar
            </button>
          ) : (
            <button onClick={requestToSpeak}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-bold border border-gray-700 transition-colors">
              <Hand className="h-4 w-4" /> Pedir palavra
            </button>
          )}
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
        <h2 className="text-3xl font-bold text-white">Aula Terminada</h2>
        <p className="text-gray-400">O professor encerrou esta aula ao vivo. Obrigado por participar!</p>
        <Link href="/dashboard/lives"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 font-bold transition-colors">
          <ArrowLeft className="h-6 w-6" /> Voltar às Aulas
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

        const authToken = await user.getIdToken();
        const res = await fetch("/api/livekit/token", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
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
      <div className="flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-purple" /><p className="text-gray-400">A entrar na aula...</p></div>
    </div>
  );

  if (error || !live) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="text-center space-y-4"><AlertTriangle className="h-12 w-12 text-red-400 mx-auto" /><p className="text-xl font-bold text-white">{error || "Erro"}</p><Link href="/dashboard/lives" className="text-sm text-purple-400 hover:text-purple-300">Voltar às aulas</Link></div>
    </div>
  );

  if (!token) return <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;

  return (
    <LiveKitRoom
      video={false} audio={false} token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
    >
      <ViewerInterior live={live} />
    </LiveKitRoom>
  );
}
