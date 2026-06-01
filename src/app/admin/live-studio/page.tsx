"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, updateDoc, getDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  LiveKitRoom, TrackToggle, useLocalParticipant, useParticipants,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Mic, MicOff, MonitorUp, PhoneOff, Loader2, AlertTriangle, ArrowLeft,
} from "lucide-react";

export default function AdminCourseLiveStudio() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomName = searchParams.get("roomName");
  const courseId = searchParams.get("courseId");

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!roomName || !user) return;
    const init = async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName, identity: user.uid, name: user.displayName || "Admin", isHost: true }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setToken(data.token);

        if (courseId) {
          const courseSnap = await getDoc(doc(db, "courses", courseId));
          const courseTitle = courseSnap.exists() ? courseSnap.data().title : "Curso";
          await addDoc(collection(db, "broadcasts"), {
            type: "course_live_started",
            title: "Aula ao Vivo Agora",
            message: `Aula ao vivo do curso "${courseTitle}" começou! Entra agora.`,
            link: `/dashboard/courses/${courseId}`,
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error(err); setError("Erro ao conectar.");
      } finally { setLoading(false); }
    };
    init();
  }, [roomName, user, courseId]);

  const endLive = async () => {
    if (!courseId) { setEnded(true); return; }
    try { await updateDoc(doc(db, "courses", courseId), { updatedAt: serverTimestamp() }); } catch {}
    setEnded(true);
  };

  if (!roomName) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <AlertTriangle className="h-12 w-12 text-red-400" />
      <p className="text-xl text-white">Sala não especificada</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <Loader2 className="h-8 w-8 animate-spin text-purple" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
        <p className="text-xl text-white">{error}</p>
        <Link href={courseId ? `/admin/courses/${courseId}` : "/admin/courses"}
          className="text-purple-400 hover:text-purple-300">Voltar</Link>
      </div>
    </div>
  );

  if (!token) return null;

  if (ended) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="text-center space-y-6">
        <PhoneOff className="h-16 w-16 text-gray-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Transmissão Encerrada</h2>
        <Link href={courseId ? `/admin/courses/${courseId}/live-studio` : "/admin/courses"}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 font-bold">
          <ArrowLeft className="h-5 w-5" /> Voltar
        </Link>
      </div>
    </div>
  );

  return (
    <LiveKitRoom
      video={true} audio={true} token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
    >
      <HostInterior roomName={roomName} onEnd={endLive} />
    </LiveKitRoom>
  );
}

function HostInterior({ roomName, onEnd }: { roomName: string; onEnd: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  return (
    <div className="flex flex-col h-full bg-[#0e0e10]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-purple-400">📡 {roomName}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5">{participants.length} online</span>
        </div>
        <button onClick={onEnd}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors">
          <PhoneOff className="h-4 w-4" /> Encerrar
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-white">A transmitir</p>
          <p className="text-gray-400">Sala: {roomName}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-gray-800 shrink-0">
        <TrackToggle source={Track.Source.Microphone}
          className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition-colors" />
        <TrackToggle source={Track.Source.Camera}
          className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition-colors" />
        <TrackToggle source={Track.Source.ScreenShare}
          className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition-colors">
          <MonitorUp className="h-5 w-5" /> Ecrã
        </TrackToggle>
      </div>
    </div>
  );
}
