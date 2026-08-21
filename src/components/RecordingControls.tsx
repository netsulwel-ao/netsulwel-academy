"use client";

import { useState, useEffect } from "react";
import { Radio } from "lucide-react";
import type { LiveSession } from "@/types/live";

interface RecordingControlsProps {
  live: LiveSession;
  isHost: boolean;
  onStatusChange?: (status: LiveSession["recordingStatus"]) => void;
}

/**
 * Recording Controls component
 * Shows recording status and provides start/stop buttons for hosts
 * Shows recording duration timer during recording
 */
export function RecordingControls({ live, isHost, onStatusChange }: RecordingControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isRecording = live.recordingStatus === "recording";

  // Timer for recording duration
  useEffect(() => {
    if (!isRecording || !live.recordingStartedAt) return;

    const interval = setInterval(() => {
      const startTime = new Date(live.recordingStartedAt!).getTime();
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      setRecordingDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, live.recordingStartedAt]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    if (!live.id || !live.roomName) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/livekit/egress/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId: live.id,
          roomName: live.roomName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao iniciar gravação");
      }

      const data = await res.json();
      onStatusChange?.(data.recordingStatus);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Recording start error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    if (!live.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/livekit/egress/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId: live.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao parar gravação");
      }

      const data = await res.json();
      onStatusChange?.(data.recordingStatus);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Recording stop error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show to hosts
  if (!isHost) {
    return null;
  }

  const btnBase = "flex flex-col items-center justify-center gap-0.5 sm:gap-1 h-12 sm:h-14 w-12 sm:w-fit sm:min-w-[64px] sm:px-1 px-0 transition-colors select-none text-white hover:text-white hover:bg-white";
  const btnText = "hidden sm:inline text-[13px] sm:text-[13px] font-medium tracking-wide leading-none";

  return (
    <>
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={isLoading || live.recordingStatus === "processing"}
        className={`${btnBase} ${
          isRecording
            ? "text-red-400 bg-red-500/20 hover:bg-red-500/30"
            : "text-white hover:text-white hover:bg-white"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
        title={isRecording ? "Parar gravação" : "Iniciar gravação"}
      >
        <div className="relative">
          <Radio size={18} className={isRecording ? "animate-pulse" : ""} />
          {isRecording && (
            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-30" />
          )}
        </div>
        <span className={btnText}>
          {isRecording ? formatDuration(recordingDuration) : "Rec"}
        </span>
      </button>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900 text-red-100 px-3 py-2 rounded text-sm max-w-xs">
          {error}
        </div>
      )}

      {live.recordingStatus === "processing" && (
        <div className="fixed bottom-4 right-4 bg-blue-900 text-blue-100 px-3 py-2 rounded text-sm max-w-xs animate-pulse">
          Processando gravação...
        </div>
      )}

      {live.recordingStatus === "ready" && live.recordingUrl && (
        <div className="fixed bottom-4 right-4 bg-green-900 text-green-100 px-3 py-2 rounded text-sm max-w-xs">
          ✓ Gravação pronta para visualização
        </div>
      )}
    </>
  );
}
