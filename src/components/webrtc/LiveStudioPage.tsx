"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc, updateDoc, onSnapshot, collection, addDoc, deleteDoc,
  serverTimestamp, query, where, getDocs, setDoc,
} from "firebase/firestore";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { VideoElement } from "./VideoElement";
import { ControlsBar } from "./ControlsBar";
import { LiveChat } from "./LiveChat";
import { AlunosPanel } from "./AlunosPanel";
import { DeviceSettingsModal } from "./DeviceSettingsModal";
import { RemoteDeviceModal } from "./RemoteDeviceModal";
import {
  MessageCircle, X, Users, ArrowLeft, Volume2, VolumeX, Hand, Mic, MicOff, Smartphone
} from "lucide-react";

interface LiveStudioPageProps {
  liveId: string;
  role: "host" | "viewer";
}

export default function LiveStudioPage({ liveId, role }: LiveStudioPageProps) {
  const { user, isAdmin } = useAuth();
  const isHost = role === "host";

  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"chat" | "alunos">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewerMuted, setViewerMuted] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [handRaisedCount, setHandRaisedCount] = useState(0);
  const [isApprovedSpeaker, setIsApprovedSpeaker] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [showRemoteDevice, setShowRemoteDevice] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const registeredRef = useRef(false);
  const speakerAudioRef = useRef<HTMLAudioElement | null>(null);

  // Device management (host only)
  const mediaDevices = useMediaDevices();

  const {
    localStream,
    remoteStreams,
    sessionId,
    connected,
    error,
    join,
    leave,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    enableSpeaker,
    pullSpeakerTracks,
    switchDevices,
    useRemoteTrack,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isSpeaker,
  } = useWebRTC({
    role,
    liveId,
    user: user!,
    deviceIds: isHost ? mediaDevices.selected : undefined,
  });

  // ─── Load live data + real-time updates ────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "lives", liveId), (snap) => {
      if (snap.exists()) {
        setLiveData({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }, () => {
      // on error, unblock loading anyway
      setLoading(false);
    });
    return () => unsub();
  }, [liveId]);

  // ─── Listen for participant count (excluding host) ──────────
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "lives", liveId, "sessions"),
      (snap) => {
        let count = 0;
        snap.forEach((d) => {
          if (d.data().role !== "host") count++;
        });
        setParticipantCount(count);
      }
    );
    return () => unsub();
  }, [liveId, user]);

  // ─── Register session (HOST + VIEWER) ─────────────────────
  useEffect(() => {
    if (!sessionId || !user || registeredRef.current) return;
    registeredRef.current = true;

    const register = async () => {
      const token = await user.getIdToken();
      await fetch("/api/signaling", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "register",
          liveId,
          sessionId,
          role: isHost ? "host" : "viewer",
        }),
      });

      if (isHost) {
        await addDoc(collection(db, "broadcasts"), {
          title: "Live iniciada!",
          message: `${liveData?.title || "Uma live"} começou agora!`,
          type: "live",
          liveId,
          createdAt: serverTimestamp(),
        });
        setStarted(true);
      }
    };

    register();
  }, [isHost, sessionId, user, liveId, liveData?.title]);

  // ─── Hand raises — listen for count (host) ────────────────
  useEffect(() => {
    if (!isHost || !user) return;
    const unsub = onSnapshot(
      collection(db, "lives", liveId, "handraises"),
      (snap) => {
        setHandRaisedCount(snap.size);
      }
    );
    return () => unsub();
  }, [isHost, user, liveId]);

  // ─── Hand raise — check if current viewer has raised (viewer) ──
  useEffect(() => {
    if (isHost || !user) return;
    const unsub = onSnapshot(
      collection(db, "lives", liveId, "handraises"),
      (snap) => {
        const myRequest = snap.docs.find((d) => d.data().uid === user.uid);
        setHandRaised(!!myRequest);
      }
    );
    return () => unsub();
  }, [isHost, user, liveId]);

  // ─── HOST: Play incoming speaker audio ─────────────────────
  useEffect(() => {
    if (!isHost) return;
    const audioEl = speakerAudioRef.current;
    if (!audioEl || remoteStreams.length === 0) return;
    const stream = remoteStreams[0];
    if (audioEl.srcObject !== stream) {
      audioEl.srcObject = stream;
      audioEl.play().catch((e) => console.warn("[Host] Speaker audio play failed:", e));
    }
    // Apply selected speaker output if browser supports it
    const speakerId = mediaDevices.selected.speakerId;
    if (speakerId && typeof (audioEl as any).setSinkId === "function") {
      (audioEl as any).setSinkId(speakerId).catch(() => {});
    }
  }, [isHost, remoteStreams, mediaDevices.selected.speakerId]);

  // ─── Speaker approval — listen for viewer being approved ───
  useEffect(() => {
    if (isHost || !user) return;
    let cancelled = false;

    const setup = async () => {
      const staleRef = doc(db, "lives", liveId, "speakers", user.uid);

      // Delete stale speaker doc from previous live sessions FIRST
      try {
        const { getDoc: gd, deleteDoc: dd } = await import("firebase/firestore");
        const snap = await gd(staleRef);
        if (snap.exists() && !cancelled) {
          await dd(staleRef);
        }
      } catch {}

      if (cancelled) return;

      // NOW listen for real approval
      const unsub = onSnapshot(
        staleRef,
        (snap) => {
          setIsApprovedSpeaker(snap.exists());
        }
      );
      return unsub;
    };

    let unsubFn: (() => void) | undefined;
    setup().then((unsub) => { if (!cancelled) unsubFn = unsub; });
    return () => {
      cancelled = true;
      if (unsubFn) unsubFn();
    };
  }, [isHost, user, liveId]);

  // ─── Auto-enable speaker when approved ─────────────────────
  useEffect(() => {
    if (isApprovedSpeaker && !isSpeaker && connected) {
      enableSpeaker();
    }
  }, [isApprovedSpeaker, isSpeaker, connected, enableSpeaker]);

  // ─── HOST: Listen for speakers and pull their audio ────────
  useEffect(() => {
    if (!isHost || !user || !connected) return;
    const unsub = onSnapshot(
      collection(db, "lives", liveId, "speakers"),
      async (snap) => {
        for (const change of snap.docChanges()) {
          if (change.type === "added" || change.type === "modified") {
            const data = change.doc.data();
            const speakerUid = change.doc.id;
            if (speakerUid === user.uid) continue; // don't pull own audio
            if (!data.sessionId || !data.trackNames) continue;
            await pullSpeakerTracks(data.sessionId, data.trackNames);
          }
        }
      }
    );
    return () => unsub();
  }, [isHost, user, connected, liveId, pullSpeakerTracks]);

  // ─── Elapsed timer ─────────────────────────────────────────
  useEffect(() => {
    if (isHost && !started) return;
    if (!isHost && !connected) return;
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHost, started, connected]);

  // ─── Format elapsed ────────────────────────────────────────
  const fmtElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? String(h).padStart(2, "0") + ":" : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ─── Raise / lower hand (viewer) ──────────────────────────
  const toggleHand = useCallback(async () => {
    if (!user) return;
    const handRef = collection(db, "lives", liveId, "handraises");

    if (handRaised) {
      const q = query(handRef, where("uid", "==", user.uid));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } else {
      await addDoc(handRef, {
        uid: user.uid,
        displayName: user.displayName || "Aluno",
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
      });
    }
  }, [user, liveId, handRaised]);

  // ─── End live (HOST only) ──────────────────────────────────
  const handleEndLive = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    await updateDoc(doc(db, "lives", liveId), {
      status: "ended",
      endedAt: new Date().toISOString(),
    });

    // Clean up speakers subcollection
    try {
      const speakersSnap = await getDocs(collection(db, "lives", liveId, "speakers"));
      for (const d of speakersSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch {}

    // Clean up handraises subcollection
    try {
      const handSnap = await getDocs(collection(db, "lives", liveId, "handraises"));
      for (const d of handSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch {}

    if (sessionId && user) {
      const token = await user.getIdToken();
      await fetch(`/api/signaling?liveId=${liveId}&sessionId=${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    leave();
    window.location.href = isAdmin ? "/admin/lives" : "/dashboard/teacher/lives";
  }, [liveId, sessionId, leave, user, isAdmin]);

  // ─── Join on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (isHost) {
      if (liveData && !connected && !error) join();
    } else {
      if (liveData && liveData.hostSessionId && !connected && !error) join();
    }
  }, [liveData, user, connected, error, join, isHost]);

  // ─── Handle live ended (viewer) ────────────────────────────
  useEffect(() => {
    if (!isHost && liveData?.status === "ended") leave();
  }, [liveData?.status, isHost, leave]);

  // ─── Viewer: unmute handler ────────────────────────────────
  const handleUnmute = () => setViewerMuted(false);

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-950">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 mx-auto rounded-full border-2 border-purple border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">A carregar live...</p>
        </div>
      </div>
    );
  }

  if (liveData?.status === "ended") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-950 px-6">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-gray-900 flex items-center justify-center">
            <span className="text-3xl">📡</span>
          </div>
          <h2 className="text-xl font-bold text-white">Live Encerrada</h2>
          <p className="text-gray-400 text-sm">Esta live já terminou.</p>
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2.5 bg-gray-800 text-white text-sm hover:bg-gray-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-950 px-6">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-gray-800 text-white text-sm hover:bg-gray-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const hostStream = remoteStreams[0] || null;
  const showLiveBadge = isHost ? started : connected;
  const showTimer = isHost ? started : connected;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 overflow-hidden">
      {isHost && (
        <audio ref={speakerAudioRef} autoPlay playsInline style={{ display: "none" }} />
      )}
      {/* Device settings modal */}
      {isHost && showDeviceSettings && (
        <DeviceSettingsModal
          devices={mediaDevices}
          onClose={() => setShowDeviceSettings(false)}
          onApply={(cameraId, micId, speakerId) => {
            switchDevices({ cameraId, micId, speakerId });
          }}
        />
      )}
      {/* Remote device modal */}
      {isHost && showRemoteDevice && user && (
        <RemoteDeviceModal
          liveId={liveId}
          user={user}
          onClose={() => setShowRemoteDevice(false)}
          onUseAsCamera={(sessionId, trackName) => useRemoteTrack(sessionId, trackName, "video")}
          onUseAsMic={(sessionId, trackName) => useRemoteTrack(sessionId, trackName, "audio")}
        />
      )}
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="h-12 bg-gray-900/95 backdrop-blur border-b border-gray-800 flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          {!isHost && (
            <button
              onClick={() => window.history.back()}
              className="p-1.5 -ml-1 text-gray-400 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {showLiveBadge && (
            <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              AO VIVO
            </span>
          )}
          <h1 className="text-sm font-semibold text-white truncate min-w-0">
            {liveData?.title || "Live"}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {showTimer && (
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">{fmtElapsed(elapsed)}</span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="h-3.5 w-3.5" />
            {participantCount}
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video area */}
        <div className="flex-1 bg-gray-950 relative min-h-0">
          {isHost ? (
            <>
              {localStream ? (
                <VideoElement stream={localStream} muted className="h-full w-full" />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-6">
                  <div className="text-center space-y-4 max-w-xs">
                    <div className="h-24 w-24 mx-auto rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                      <span className="text-4xl">📡</span>
                    </div>
                    <p className="text-gray-500 text-sm">A preparar câmara...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {hostStream ? (
                <>
                  <VideoElement stream={hostStream} muted={viewerMuted} className="h-full w-full" />

                  {viewerMuted && (
                    <button
                      onClick={handleUnmute}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 transition-opacity"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                          <VolumeX className="h-7 w-7 text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium text-sm">Clique para ouvir</p>
                          <p className="text-gray-400 text-xs mt-1">Áudio desativado por segurança</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {!viewerMuted && (
                    <button
                      onClick={() => setViewerMuted(true)}
                      className="absolute top-3 right-3 sm:hidden p-2 bg-black/50 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-colors z-10"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}

                  <div className="absolute top-3 left-3 sm:hidden">
                    <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-red-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      AO VIVO
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 sm:hidden">
                    <span className="bg-black/60 backdrop-blur-sm text-xs text-gray-300 font-mono px-2.5 py-1 rounded-full">
                      {fmtElapsed(elapsed)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center px-6">
                  <div className="text-center space-y-4 max-w-xs">
                    <div className="relative mx-auto h-24 w-24">
                      <div className="absolute inset-0 rounded-full border-2 border-purple/30 animate-ping" />
                      <div className="relative h-24 w-24 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                        <span className="text-4xl">📡</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-medium">
                        {liveData?.status === "live"
                          ? "A ligar ao professor..."
                          : "A aguardar início..."}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {liveData?.status === "live"
                          ? "A transmissão será iniciada em breve"
                          : "O professor ainda não começou a live"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sidebar — desktop ───────────────────────────── */}
        <div className="hidden md:flex w-80 bg-gray-900 border-l border-gray-800 flex-col shrink-0">
          {isHost && (
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === "chat"
                    ? "text-white border-b-2 border-purple"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Chat
                {handRaisedCount > 0 && (
                  <span className="absolute top-2 right-3 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {handRaisedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("alunos")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "alunos"
                    ? "text-white border-b-2 border-purple"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Alunos ({participantCount})
              </button>
            </div>
          )}
          {!isHost && (
            <div className="p-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Chat da Live</h3>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            {isHost ? (
              activeTab === "chat" ? (
                <LiveChat liveId={liveId} role="host" />
              ) : (
                <AlunosPanel liveId={liveId} />
              )
            ) : (
              <LiveChat liveId={liveId} role="viewer" />
            )}
          </div>
        </div>
      </div>

      {/* ── Controls (HOST) or Raise Hand (VIEWER) ────────── */}
      {isHost ? (
        <ControlsBar
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          isScreenSharing={isScreenSharing}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={toggleScreenShare}
          onEndLive={handleEndLive}
          onOpenDeviceSettings={() => setShowDeviceSettings(true)}
          onOpenRemoteDevice={() => setShowRemoteDevice(true)}
          participantCount={participantCount}
        />
      ) : (
        <div className="h-14 sm:h-16 bg-gray-900/95 backdrop-blur border-t border-gray-800 flex items-center justify-center gap-3 px-4 shrink-0">
          {isSpeaker ? (
            <>
              <button
                onClick={toggleMic}
                className={`h-10 w-10 flex items-center justify-center rounded-full transition-colors ${
                  isMicOn
                    ? "bg-gray-800 text-white hover:bg-gray-700"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
                title={isMicOn ? "Desligar microfone" : "Ligar microfone"}
              >
                {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              <span className="text-xs text-green-400 font-medium">A falar</span>
            </>
          ) : (
            <button
              onClick={toggleHand}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                handRaised
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              <Hand className="h-4 w-4" />
              {handRaised ? "Mão levantada" : "Pedir para falar"}
            </button>
          )}
        </div>
      )}

      {/* ── Mobile sidebar overlay ───────────────────────── */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-20 bg-gray-900 border-t border-gray-800 transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "65vh" }}
      >
        {isHost && (
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "chat"
                  ? "text-white border-b-2 border-purple"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Chat
              {handRaisedCount > 0 && (
                <span className="absolute top-2 right-3 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {handRaisedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("alunos")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "alunos"
                  ? "text-white border-b-2 border-purple"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Alunos ({participantCount})
            </button>
          </div>
        )}
        {!isHost && (
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Chat da Live</h3>
          </div>
        )}
        <div className="h-[calc(65vh-48px)] overflow-hidden">
          {isHost ? (
            activeTab === "chat" ? (
              <LiveChat liveId={liveId} role="host" />
            ) : (
              <AlunosPanel liveId={liveId} />
            )
          ) : (
            <LiveChat liveId={liveId} role="viewer" />
          )}
        </div>
      </div>

      {/* ── Backdrop ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
