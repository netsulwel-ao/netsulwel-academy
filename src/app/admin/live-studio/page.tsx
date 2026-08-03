"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  LiveKitRoom, VideoTrack, AudioTrack, useTracks, useParticipants, useLocalParticipant,
  TrackToggle,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Loader2, ArrowLeft, Mic, Video, MonitorUp, MessageSquare, Send,
} from "lucide-react";

// ── Simple VideoPlayer ──────────────────────────────────────

function SimpleVideoPlayer({ screenTrack, videoTrack }: { screenTrack?: React.ReactNode; videoTrack?: React.ReactNode }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {screenTrack ? screenTrack : videoTrack ? videoTrack : (
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Video className="h-16 w-16" />
          <p className="text-lg font-medium">Câmara desligada</p>
        </div>
      )}
    </div>
  );
}

// ── Stage ───────────────────────────────────────────────────

function BroadcastStage() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone], { onlySubscribed: false });
  const { localParticipant } = useLocalParticipant();
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const audioTracks = tracks.filter((t) => t.source === Track.Source.Microphone && t.participant.identity !== localParticipant?.identity);

  return (
    <div className="relative w-full h-full bg-black">
      {audioTracks.map((track) => (
        <AudioTrack key={track.participant.identity} trackRef={track} />
      ))}
      <SimpleVideoPlayer
        screenTrack={screenTrack ? <VideoTrack trackRef={screenTrack} className="w-full h-full object-contain" /> : undefined}
        videoTrack={cameraTrack ? <VideoTrack trackRef={cameraTrack} className="w-full h-full object-cover" /> : undefined}
      />
    </div>
  );
}

// ── Chat ────────────────────────────────────────────────────

function BroadcastChat({ roomName }: { roomName: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ id: string; displayName: string; text: string; type: string }[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "lives", roomName, "chat"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() as object })) as typeof messages);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [roomName]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const msg = text.trim(); setText("");
    await addDoc(collection(db, "lives", roomName, "chat"), {
      liveId: roomName, uid: user.uid,
      displayName: user.displayName || "Professor",
      photoURL: user.photoURL || "",
      text: msg, type: "message",
      createdAt: serverTimestamp(),
    }).catch(() => {});
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e10]">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-purple-400" />
        <span className="text-base font-bold text-white">Chat</span>
        <span className="ml-auto text-sm text-gray-500 bg-gray-800 px-2 py-0.5">{messages.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-8">Sem mensagens ainda.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 items-start hover:bg-white/5 px-1 py-0.5 -mx-1">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5">
              {msg.displayName?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-purple-400">{msg.displayName} </span>
              <span className="text-base text-gray-200 break-words">{msg.text}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-800 flex gap-2">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Enviar mensagem..."
          className="flex-1 bg-gray-900 border border-gray-700 px-3 py-2 text-base text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
        <button type="submit" disabled={!text.trim()}
          className="flex items-center justify-center h-9 w-9 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-colors">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

// ── Interior ────────────────────────────────────────────────

function BroadcastInterior({ roomName, backUrl }: { roomName: string; backUrl: string }) {
  const [showChat, setShowChat] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex flex-col h-dvh bg-[#0e0e10] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-[#18181b] border-b border-gray-800 shrink-0">
        <Link href={backUrl}
          className="flex items-center justify-center h-10 w-10 bg-gray-800 text-gray-400 hover:text-white transition-colors shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-2 h-2 bg-red-500 animate-pulse shrink-0" />
          <span className="font-bold text-white truncate">Aula ao Vivo — {roomName}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrackToggle source={Track.Source.Microphone}
            className="flex items-center justify-center h-10 w-10 bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            showIcon={false}>
            <Mic className="h-5 w-5" />
          </TrackToggle>
          <TrackToggle source={Track.Source.Camera}
            className="flex items-center justify-center h-10 w-10 bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            showIcon={false}>
            <Video className="h-5 w-5" />
          </TrackToggle>
          <TrackToggle source={Track.Source.ScreenShare}
            className="flex items-center justify-center h-10 w-10 bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            showIcon={false}>
            <MonitorUp className="h-5 w-5" />
          </TrackToggle>
          <button onClick={() => setShowChat(!showChat)}
            className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold transition-colors ${showChat ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
            <MessageSquare className="h-4 w-4" /> Chat
          </button>
          <button onClick={() => setShowConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold transition-colors">
            Terminar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-row flex-1 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          <BroadcastStage />
        </div>
        {showChat && (
          <div className="w-[340px] shrink-0 border-l border-gray-800">
            <BroadcastChat roomName={roomName} />
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 p-6 max-w-sm w-full space-y-4"
            role="dialog" aria-modal="true" aria-labelledby="end-live-title" aria-describedby="end-live-desc"
            onKeyDown={(e) => { if (e.key === "Escape") setShowConfirm(false); }}>
            <h3 id="end-live-title" className="text-lg font-bold text-white">Terminar Transmissão?</h3>
            <p id="end-live-desc" className="text-sm text-gray-400">Os alunos serão desconectados da aula ao vivo.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 font-bold text-sm transition-colors">
                Cancelar
              </button>
              <Link href={backUrl}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">
                Terminar Aula
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function AdminCourseLiveStudioPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const roomName = searchParams.get("roomName") || "";
  const courseId = searchParams.get("courseId") || "";
  const backUrl = courseId ? `/admin/courses/${courseId}/live-studio` : "/admin/courses";

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !roomName) return;
    const init = async () => {
      try {
        const authToken = await user.getIdToken();
        const res = await fetch("/api/livekit/token", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
          body: JSON.stringify({ roomName, identity: user.uid, name: user.displayName || "Admin", isHost: true }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setToken(data.token);
      } catch (err) {
        console.error(err); setError("Erro ao conectar.");
      } finally { setLoading(false); }
    };
    init();
  }, [user, roomName]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <Loader2 className="h-8 w-8 animate-spin text-purple" />
    </div>
  );

  if (error || !roomName) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="text-center space-y-4">
        <p className="text-xl font-bold text-white">{error || "Sala não encontrada"}</p>
        <Link href={backUrl} className="text-purple-400 hover:text-purple-300">Voltar</Link>
      </div>
    </div>
  );

  if (!token) return null;

  return (
    <LiveKitRoom video={true} audio={true} token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
    >
      <BroadcastInterior roomName={roomName} backUrl={backUrl} />
    </LiveKitRoom>
  );
}
