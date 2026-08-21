"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, addDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  LiveKitRoom, VideoTrack, AudioTrack, useTracks, useParticipants, useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Loader2, AlertTriangle, Radio, ArrowLeft, Eye, MessageSquare, Send, Hand, Volume2, Mic, MicOff,
} from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import MaterialsList from "@/components/shared/MaterialsList";
import type { Course, CourseMaterial } from "@/types/course";
import { playEntrySound } from "@/lib/entry-sound";

// ── Stage ─────────────────────────────────────────────────
function CourseLiveStage() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone], { onlySubscribed: false });
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare && t.participant.identity !== localParticipant?.identity);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera && t.participant.identity !== localParticipant?.identity);
  const audioTracks = tracks.filter((t) => t.source === Track.Source.Microphone && t.participant.identity !== localParticipant?.identity);
  const known = useRef(new Set<string>());

  useEffect(() => {
    participants.forEach(p => {
      if (!known.current.has(p.identity)) {
        known.current.add(p.identity);
        if (!p.isLocal) playEntrySound();
      }
    });
  }, [participants]);

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
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 text-sm font-bold text-text-primary">
          <div className="w-1.5 h-1.5 bg-white animate-pulse" />LIVE
        </div>
        <div className="flex items-center gap-1.5 bg-black px-2.5 py-1 text-sm text-text-primary">
          <Eye className="h-3.5 w-3.5" /><span>{participants.length}</span>
        </div>
      </div>
    </div>
  );
}

// ── Chat ──────────────────────────────────────────────────
function CourseLiveChat({ roomName }: { roomName: string }) {
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

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const msg = text.trim(); setText("");
    await addDoc(collection(db, "lives", roomName, "chat"), {
      liveId: roomName, uid: user.uid, displayName: user.displayName || "Aluno",
      photoURL: user.photoURL || "", text: msg, type: "message", createdAt: serverTimestamp(),
    }).catch(() => {});
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e10]">
      <div className="px-4 py-3 border-b border-border-default flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-bold text-text-primary">Chat</span>
        <span className="ml-auto text-sm text-text-muted bg-bg-surface-2 px-2 py-0.5">{messages.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && <p className="text-sm text-gray-600 text-center py-8">Sem mensagens ainda.</p>}
        {messages.map((msg) => (
          msg.type === "system" ? (
            <div key={msg.id} className="text-center text-sm text-gray-600 py-1 italic">{msg.text}</div>
          ) : (
            <div key={msg.id} className="flex gap-2 items-start hover:bg-white px-1 py-0.5 -mx-1">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 text-[13px] font-bold text-text-primary mt-0.5">
                {msg.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-purple-400">{msg.displayName} </span>
                <span className="text-sm text-gray-200 break-words">{msg.text}</span>
              </div>
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="p-3 border-t border-border-default flex gap-2">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enviar mensagem..."
          className="flex-1 bg-bg-surface border border-border-strong px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-purple-500" />
        <button type="submit" disabled={!text.trim()}
          className="flex items-center justify-center h-9 w-9 bg-purple-600 hover:bg-purple-700 disabled:bg-bg-surface-2 disabled:text-text-muted text-text-primary"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function CourseLiveLessonPage() {
  const params = useParams();
  const id = params.id as string;
  const mi = parseInt(params.mi as string);
  const vi = parseInt(params.vi as string);
  const { user } = useAuth();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [roomName, setRoomName] = useState("");
  const [lessonMaterials, setLessonMaterials] = useState<CourseMaterial[]>([]);
  const [canSpeak, setCanSpeak] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    if (!id || !user || isNaN(mi) || isNaN(vi)) return;
    const init = async () => {
      try {
        const snap = await getDoc(doc(db, "courses", id));
        if (!snap.exists()) { setError("Curso não encontrado."); setLoading(false); return; }
        const course = { id: snap.id, ...snap.data() } as Course;
        const lesson = course.modules?.[mi]?.videos?.[vi];
        if (!lesson || !lesson.roomName) { setError("Aula não encontrada."); setLoading(false); return; }
        if (!lesson.scheduledAt) { setError("Esta aula não tem data agendada."); setLoading(false); return; }

        setLessonTitle(lesson.title || `Aula ${vi + 1}`);
        setRoomName(lesson.roomName);
        setLessonMaterials(lesson.materials || []);

        const now = new Date();
        const scheduledAt = new Date(lesson.scheduledAt);
        const durationMin = parseInt(lesson.duration || "0") || 0;
        const endTime = new Date(scheduledAt.getTime() + durationMin * 60000);

        if (now < scheduledAt) { setError("Esta aula ainda não começou."); setLoading(false); return; }
        if (now > endTime) { setError("Esta aula já terminou."); setLoading(false); return; }

        const authToken = await user.getIdToken();
        const res = await fetch("/api/livekit/token", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
          body: JSON.stringify({ roomName: lesson.roomName, identity: user.uid, name: user.displayName || "Aluno", isHost: false }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setToken(data.token);
      } catch (err) {
        console.error(err); setError("Erro ao conectar à aula.");
      } finally { setLoading(false); }
    };
    init();
  }, [id, mi, vi, user]);

  // Listen for speaker status
  useEffect(() => {
    if (!user || !roomName) return;
    const unsub = onSnapshot(doc(db, "lives", roomName, "speakers", user.uid), (snap) => {
      const allowed = snap.exists() && snap.data().canSpeak === true;
      setCanSpeak(allowed);
      if (allowed) setHasRequested(false);
    });
    return () => unsub();
  }, [roomName, user]);

  // Check hand raise
  useEffect(() => {
    if (!user || !roomName) return;
    const unsub = onSnapshot(doc(db, "lives", roomName, "handraises", user.uid), (snap) => {
      setHasRequested(snap.exists());
    });
    return () => unsub();
  }, [roomName, user]);

  const requestToSpeak = async () => {
    if (!user || hasRequested) return;
    await setDoc(doc(db, "lives", roomName, "handraises", user.uid), {
      name: user.displayName || "Aluno", createdAt: serverTimestamp(),
    }).catch(() => {});
    setHasRequested(true);
  };

  const cancelRequest = async () => {
    if (!user) return;
    await deleteDoc(doc(db, "lives", roomName, "handraises", user.uid)).catch(() => {});
    setHasRequested(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-purple" /><p className="text-text-muted">A entrar na aula...</p></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="text-center space-y-4"><AlertTriangle className="h-12 w-12 text-red-400 mx-auto" /><p className="text-xl font-bold text-text-primary">{error}</p><Link href={`/dashboard/courses/${id}`} className="text-sm text-purple-400 hover:text-purple-300"><ArrowLeft className="h-4 w-4 inline" /> Voltar ao curso</Link></div>
    </div>
  );

  if (!token) return <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;

  return (
    <LiveKitRoom video={false} audio={false} token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default" style={{ height: "100dvh" }}>
      <div className="flex flex-col h-dvh bg-[#0e0e10] overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-4 py-2 bg-[#18181b] border-b border-border-default shrink-0">
          <Link href={`/dashboard/courses/${id}`}
            className="flex items-center justify-center h-9 w-9 bg-bg-surface-2 text-text-muted hover:text-text-primary shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-1.5 h-1.5 bg-red-500 animate-pulse shrink-0" />
            <span className="text-sm font-bold text-text-primary truncate max-w-[200px]">{lessonTitle}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-row flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <div className="relative flex-1 min-h-0 bg-black">
              <CourseLiveStage />
            </div>
            <div className="bg-[#18181b] border-t border-border-default px-4 py-3 shrink-0">
              <h2 className="text-sm font-bold text-text-primary truncate">{lessonTitle}</h2>
              <p className="text-sm text-text-muted">Sala: {roomName}</p>
            </div>
            {lessonMaterials.length > 0 && (
              <div className="border-t border-border-default px-4 py-3">
                <MaterialsList materials={lessonMaterials} />
              </div>
            )}
          </div>
          <div className="w-[340px] shrink-0 border-l border-border-default flex flex-col">
            <CourseLiveChat roomName={roomName} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#18181b] border-t border-border-default px-4 py-3 shrink-0">
          {canSpeak ? (
            <button onClick={cancelRequest}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-text-primary text-sm font-bold transition-colors">
              <Volume2 className="h-4 w-4" /> Estás a falar
            </button>
          ) : hasRequested ? (
            <button onClick={cancelRequest}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-text-primary text-sm font-bold transition-colors">
              <Hand className="h-4 w-4" /> Pedido enviado — Cancelar
            </button>
          ) : (
            <button onClick={requestToSpeak}
              className="flex items-center gap-2 px-4 py-2 bg-bg-surface-2 hover:bg-hover-bg text-text-secondary hover:text-text-primary text-sm font-bold border border-border-strong transition-colors">
              <Hand className="h-4 w-4" /> Pedir palavra
            </button>
          )}
        </div>
      </div>
    </LiveKitRoom>
  );
}
