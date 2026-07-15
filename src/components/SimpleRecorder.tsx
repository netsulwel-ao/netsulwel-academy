"use client";

import { useState, useRef, useEffect } from "react";
import { useScreenRecording } from "@/hooks/useScreenRecording";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Circle, Pause, Play, Upload, AlertTriangle, CheckCircle } from "lucide-react";

interface SimpleRecorderProps {
  liveId: string;
  liveTitle: string;
  onRecordingComplete?: (recordingUrl: string) => void;
}

export function SimpleRecorder({
  liveId,
  liveTitle,
  onRecordingComplete,
}: SimpleRecorderProps) {
  const { user } = useAuth();
  const recording = useScreenRecording();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  // Formatar duração
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStart = async () => {
    await recording.startRecording(videoPreviewRef.current || undefined);
  };

  const handleStop = async () => {
    const blob = await recording.stopRecording();
    recordedBlobRef.current = blob;

    if (blob) {
      // Mostrar preview do vídeo
      const url = URL.createObjectURL(blob);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.src = url;
      }
    }
  };

  const handleUpload = async () => {
    if (!recordedBlobRef.current || !user) return;

    setUploading(true);
    setUploadStatus("uploading");

    try {
      const authToken = await user.getIdToken();
      const filename = `${liveId}-${Date.now()}.webm`;

      const recordingUrl = await recording.uploadRecording(
        recordedBlobRef.current,
        filename,
        authToken
      );

      if (recordingUrl) {
        setUploadStatus("success");
        onRecordingComplete?.(recordingUrl);
        recordedBlobRef.current = null;
      } else {
        setUploadStatus("error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e11] border border-white/8 rounded">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
        <Circle className="h-3 w-3 text-red-500 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-white/60">
          Gravador de Aula
        </span>
      </div>

      {/* Status */}
      <div className="px-4 py-3 bg-white/[2%] border-b border-white/8">
        <div className="space-y-2">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                recording.isRecording
                  ? "bg-red-500 animate-pulse"
                  : uploadStatus === "success"
                  ? "bg-green-500"
                  : uploadStatus === "error"
                  ? "bg-red-500"
                  : "bg-white/20"
              }`}
            />
            <span className="text-xs text-white/60">
              {recording.isRecording
                ? "A gravar..."
                : uploadStatus === "success"
                ? "Gravação concluída!"
                : uploadStatus === "error"
                ? "Erro no upload"
                : "Pronto"}
            </span>
          </div>

          {/* Duration */}
          {recording.duration > 0 && (
            <p className="text-sm font-mono text-white/80">
              Duração: {formatDuration(recording.duration)}
            </p>
          )}

          {/* Error message */}
          {recording.error && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{recording.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {recordedBlobRef.current && (
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-xs text-white/40 mb-2">Pré-visualização da gravação:</p>
          <video
            ref={videoPreviewRef}
            controls
            className="w-full bg-black rounded border border-white/10"
            style={{ maxHeight: "200px" }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex-1 flex flex-col gap-2 p-4 min-h-0">
        {/* Recording Controls */}
        <div className="flex gap-2">
          {!recording.isRecording ? (
            <button
              onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
            >
              <Circle className="h-3 w-3" />
              Iniciar Gravação
            </button>
          ) : (
            <>
              <button
                onClick={recording.isPaused ? recording.resumeRecording : recording.pauseRecording}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded transition-colors"
              >
                {recording.isPaused ? (
                  <>
                    <Play className="h-3 w-3" />
                    Retomar
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3" />
                    Pausar
                  </>
                )}
              </button>

              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded transition-colors"
              >
                ◼ Parar
              </button>
            </>
          )}
        </div>

        {/* Upload Controls */}
        {recordedBlobRef.current && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded transition-colors ${
              uploading
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : uploadStatus === "success"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : uploadStatus === "error"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                A enviar...
              </>
            ) : uploadStatus === "success" ? (
              <>
                <CheckCircle className="h-3.5 w-3.5" />
                Gravação Concluída!
              </>
            ) : uploadStatus === "error" ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                Tentar Novamente
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Enviar Gravação
              </>
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-2 bg-white/[1%] border-t border-white/8 text-[10px] text-white/30 space-y-1">
        <p>• Grava o vídeo + áudio localmente</p>
        <p>• Envia para armazenamento seguro</p>
        <p>• Dispõe para alunos após aula</p>
      </div>
    </div>
  );
}
