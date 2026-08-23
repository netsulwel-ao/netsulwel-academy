"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Mic, MicOff, Video, VideoOff, RotateCcw,
  Wifi, WifiOff, Loader2, CheckCircle2,
} from "lucide-react";

interface RemoteDevicePageProps {
  token: string;
}

type Status = "validating" | "ready" | "connecting" | "live" | "error" | "expired";

const CALLS_API = "/api/calls";

function createPC() {
  return new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.cloudflare.com:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
    bundlePolicy: "max-bundle",
    iceCandidatePoolSize: 10,
  });
}

export default function RemoteDevicePage({ token }: RemoteDevicePageProps) {
  const [status, setStatus] = useState<Status>("validating");
  const [errorMsg, setErrorMsg] = useState("");
  const [liveId, setLiveId] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);

  // ── Validate token ────────────────────────────────────────
  useEffect(() => {
    const validate = async () => {
      try {
        const res = await fetch("/api/remote-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "validate", token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(res.status === 410 ? "expired" : "error");
          setErrorMsg(data.error || "Token inválido.");
          return;
        }
        setLiveId(data.liveId);
        setStatus("ready");
      } catch {
        setStatus("error");
        setErrorMsg("Erro de rede. Verifica a ligação.");
      }
    };
    validate();
  }, [token]);

  // ── Preview ───────────────────────────────────────────────
  const startPreview = useCallback(async (facing: "user" | "environment") => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Preview failed:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "ready") startPreview(facingMode);
    return () => {
      if (status !== "live") {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── Toggle camera facing ──────────────────────────────────
  const flipCamera = useCallback(async () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (status === "ready") {
      await startPreview(next);
    } else if (status === "live" && pcRef.current && streamRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender && newVideoTrack) {
          await sender.replaceTrack(newVideoTrack);
          // Replace in local stream
          const oldVideo = streamRef.current.getVideoTracks()[0];
          streamRef.current.removeTrack(oldVideo);
          oldVideo.stop();
          streamRef.current.addTrack(newVideoTrack);
          if (previewRef.current) previewRef.current.srcObject = streamRef.current;
        }
      } catch (err) {
        console.warn("Flip failed:", err);
      }
    }
  }, [facingMode, status, startPreview]);

  // ── Connect to Cloudflare Calls as a speaker ─────────────
  const connect = useCallback(async () => {
    if (!liveId) return;
    setStatus("connecting");

    try {
      // Get fresh media with current facing mode
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (previewRef.current) previewRef.current.srcObject = stream;

      const pc = createPC();
      pcRef.current = pc;

      // Add tracks as sendonly
      stream.getTracks().forEach((track) => {
        pc.addTransceiver(track, { direction: "sendonly" });
      });

      // Create offer → new session (no user auth needed, token is the auth)
      await pc.setLocalDescription(await pc.createOffer());

      const sessionRes = await fetch("/api/remote-device/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, offer: pc.localDescription }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error || "Falha ao criar sessão.");

      await pc.setRemoteDescription(new RTCSessionDescription(sessionData.sessionDescription));
      sessionIdRef.current = sessionData.sessionId;

      // Wait for ICE
      await new Promise<void>((resolve, reject) => {
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          resolve(); return;
        }
        const timeout = setTimeout(() => reject(new Error("ICE timeout")), 20000);
        pc.addEventListener("iceconnectionstatechange", function handler() {
          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            clearTimeout(timeout); pc.removeEventListener("iceconnectionstatechange", handler); resolve();
          } else if (pc.iceConnectionState === "failed") {
            clearTimeout(timeout); pc.removeEventListener("iceconnectionstatechange", handler);
            reject(new Error("ICE falhou"));
          }
        });
      });

      // Push tracks
      await pc.setLocalDescription(await pc.createOffer());
      const trackObjects = pc.getTransceivers().map((t) => ({
        location: "local" as const,
        mid: t.mid!,
        trackName: t.sender.track!.id,
      }));

      const pushRes = await fetch("/api/remote-device/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "push",
          sessionId: sessionData.sessionId,
          offer: pc.localDescription,
          tracks: trackObjects,
        }),
      });
      const pushData = await pushRes.json();
      if (!pushRes.ok) throw new Error(pushData.error || "Falha ao publicar tracks.");
      if (pushData.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(pushData.sessionDescription));
      }

      // Write to Firestore so host PC can pull this stream
      await setDoc(doc(db, "lives", liveId, "remoteDevices", token), {
        sessionId: sessionData.sessionId,
        trackNames: trackObjects.map((t) => t.trackName),
        videoTrackName: trackObjects.find((t) => stream.getVideoTracks().some(v => v.id === t.trackName))?.trackName ?? null,
        audioTrackName: trackObjects.find((t) => stream.getAudioTracks().some(a => a.id === t.trackName))?.trackName ?? null,
        status: "live",
        facingMode,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setStatus("live");
    } catch (err: any) {
      console.error("[RemoteDevice] connect failed:", err);
      setStatus("error");
      setErrorMsg(err.message || "Erro de ligação.");
    }
  }, [liveId, facingMode, token]);

  // ── Toggle mic ────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMicOn(track.enabled); }
  }, []);

  // ── Toggle camera ─────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCameraOn(track.enabled); }
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Render ────────────────────────────────────────────────
  if (status === "validating") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-950">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">A verificar acesso...</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-950 px-6">
        <div className="text-center space-y-4 max-w-xs">
          <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
            <WifiOff className="h-7 w-7 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Link expirado</h2>
          <p className="text-gray-400 text-sm">Este link já não é válido. Pede ao professor para gerar um novo.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-950 px-6">
        <div className="text-center space-y-4 max-w-xs">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <WifiOff className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Erro de ligação</h2>
          <p className="text-gray-400 text-sm">{errorMsg}</p>
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

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-safe pt-4 pb-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {status === "live" ? (
            <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              LIGADO
            </span>
          ) : (
            <span className="text-gray-500 text-xs font-mono">CÂMARA REMOTA</span>
          )}
        </div>
        {status === "live" && (
          <div className="flex items-center gap-1.5 text-green-400 text-xs">
            <Wifi className="h-3.5 w-3.5" />
            A transmitir
          </div>
        )}
      </div>

      {/* Video preview */}
      <div className="flex-1 relative bg-black min-h-0">
        <video
          ref={previewRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
        />

        {/* Flip camera button */}
        <button
          onClick={flipCamera}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          title="Inverter câmara"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        {/* Camera off overlay */}
        {!isCameraOn && (
          <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
            <VideoOff className="h-12 w-12 text-gray-700" />
          </div>
        )}

        {/* Live indicator overlay */}
        {status === "live" && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs text-white font-medium">A enviar para a live</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-4 pb-safe shrink-0">
        {status === "ready" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 text-sm text-center">
              Pronto para ligar. O professor verá este dispositivo como fonte de vídeo/áudio.
            </p>
            <button
              onClick={connect}
              className="w-full py-3 bg-green-600 text-white font-bold text-sm hover:bg-green-500 transition-colors"
            >
              Ligar à Live
            </button>
          </div>
        )}

        {status === "connecting" && (
          <div className="flex items-center justify-center gap-3 py-2">
            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            <span className="text-gray-300 text-sm">A ligar...</span>
          </div>
        )}

        {status === "live" && (
          <div className="flex items-center justify-center gap-4">
            {/* Mic */}
            <button
              onClick={toggleMic}
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                isMicOn
                  ? "bg-gray-800 text-white hover:bg-gray-700"
                  : "bg-red-600 text-white hover:bg-red-500"
              }`}
              title={isMicOn ? "Desligar microfone" : "Ligar microfone"}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {/* Camera */}
            <button
              onClick={toggleCamera}
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                isCameraOn
                  ? "bg-gray-800 text-white hover:bg-gray-700"
                  : "bg-red-600 text-white hover:bg-red-500"
              }`}
              title={isCameraOn ? "Desligar câmara" : "Ligar câmara"}
            >
              {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            {/* Flip */}
            <button
              onClick={flipCamera}
              className="h-12 w-12 rounded-full bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center transition-colors"
              title="Inverter câmara"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
