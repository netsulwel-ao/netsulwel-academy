"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  LiveKitRoom,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  Loader2, AlertTriangle, Radio, ArrowLeft,
} from "lucide-react";
import type { Course } from "@/types/course";

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

        const now = new Date();
        const scheduledAt = new Date(lesson.scheduledAt);
        const durationMin = parseInt(lesson.duration || "0") || 0;
        const endTime = new Date(scheduledAt.getTime() + durationMin * 60000);

        if (now < scheduledAt) {
          setError("Esta aula ainda não começou.");
          setLoading(false);
          return;
        }
        if (now > endTime) {
          setError("Esta aula já terminou.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/livekit/token", {
          method: "POST", headers: { "Content-Type": "application/json" },
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-gray-400">A entrar na aula...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
        <p className="text-xl font-bold text-white">{error}</p>
        <Link href={`/dashboard/courses/${id}`} className="inline-flex items-center gap-2 text-base text-purple-400 hover:text-purple-300">
          <ArrowLeft className="h-5 w-5" /> Voltar ao curso
        </Link>
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
      video={false} audio={false} token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
    >
      <div className="flex flex-col h-full bg-[#0e0e10]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 shrink-0">
          <Link href={`/dashboard/courses/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-bold text-purple-400">{lessonTitle}</p>
            <p className="text-xs text-gray-500">Sala: {roomName}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Radio className="h-16 w-16 text-purple-400 mx-auto animate-pulse" />
            <p className="text-xl font-bold text-white">Ligado à aula ao vivo</p>
            <p className="text-gray-400">A transmissão será exibida aqui quando o professor iniciar.</p>
          </div>
        </div>
      </div>
    </LiveKitRoom>
  );
}
