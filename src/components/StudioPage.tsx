"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, updateDoc, addDoc, collection, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, AlertTriangle } from "lucide-react";
import type { LiveSession } from "@/types/live";
import { logger } from "@/lib/logger";
import { PreJoin } from "./studio/PreJoin";
import { StudioInterior } from "./studio/StudioInterior";

interface Props { redirectAfterEnd?: string }

export default function StudioPage({ redirectAfterEnd = "/admin/lives" }: Props) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [live,    setLive]    = useState<LiveSession | null>(null);
  const [token,   setToken]   = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [joined,  setJoined]  = useState(false);
  const [joinOpts,setJoinOpts]= useState<{ audio: boolean; video: boolean }>({ audio: true, video: true });

  // Load live + start it if still scheduled
  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "lives", id));
        if (!snap.exists()) { setError("Aula nao encontrada."); setLoading(false); return; }
        const data = { id: snap.id, ...snap.data() } as LiveSession;
        if (data.status === "scheduled") {
          const now = new Date().toISOString();
          await updateDoc(doc(db, "lives", id), { status: "live", startedAt: now, updatedAt: serverTimestamp() });
          data.status = "live"; data.startedAt = now;
          await addDoc(collection(db, "broadcasts"), {
            type: "live_started", title: "Aula ao Vivo Agora",
            message: `"${data.title}" comecou!`, link: `/dashboard/lives/${id}`,
            createdAt: serverTimestamp(),
          });
        }
        setLive(data);
      } catch (err) {
        logger.error("StudioPage: init failed", err, { id });
        setError("Erro ao carregar a aula.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = useCallback(async (opts: { audio: boolean; video: boolean }) => {
    if (!user || !live) return;
    setJoinOpts(opts); setLoading(true);
    try {
      const authToken = await user.getIdToken();
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ roomName: live.roomName, name: user.displayName || "Professor" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setToken(data.token); setJoined(true);
    } catch (err) {
      logger.error("StudioPage: join failed", err, { id });
      setError("Erro ao conectar a sala.");
    } finally {
      setLoading(false);
    }
  }, [user, live, id]);

  const handleEnd = useCallback(async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "lives", id), { status: "ended", endedAt: new Date().toISOString(), updatedAt: serverTimestamp() });
      await addDoc(collection(db, "lives", id, "chat"), {
        liveId: id, uid: user.uid, displayName: "Sistema",
        text: "A aula foi encerrada pelo professor.", type: "system",
        createdAt: serverTimestamp(),
      });
      router.push(redirectAfterEnd);
    } catch (err) {
      logger.error("StudioPage: end failed", err, { id });
    }
  }, [id, router, user, redirectAfterEnd]);

  // -- Loading / error ------------------------------------------
  if (loading && !joined) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-7 w-7 animate-spin text-white" />
        <p className="text-sm text-white">A preparar o estudio...</p>
      </div>
    </div>
  );

  if (error && !joined) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
      <div className="text-center space-y-4 max-w-xs">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto" />
        <p className="text-base font-bold text-white">{error}</p>
        <button onClick={() => router.push(redirectAfterEnd)} className="text-sm text-white hover:text-white transition-colors">
          Voltar
        </button>
      </div>
    </div>
  );

  if (!joined) return <PreJoin onJoin={handleJoin} />;

  if (!token) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
      <Loader2 className="h-7 w-7 animate-spin text-white" />
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
