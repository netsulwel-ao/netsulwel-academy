"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "recording" | "paused";

interface UseRecorderOptions {
  stream?: MediaStream | null;
  mimeType?: string;
  onStop?: (blob: Blob, duration: number) => void;
}

export function useRecorder({ stream, mimeType, onStop }: UseRecorderOptions = {}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const resolvedMime = mimeType || (() => {
    if (typeof MediaRecorder === "undefined") return "";
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) return "video/webm;codecs=vp9,opus";
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) return "video/webm;codecs=vp8,opus";
    if (MediaRecorder.isTypeSupported("video/webm")) return "video/webm";
    return "";
  })();

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current * 1000;
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!stream) {
      setError("Sem stream de vídeo disponível.");
      return;
    }
    if (!resolvedMime) {
      setError("O browser não suporta gravação WebM.");
      return;
    }

    try {
      setError(null);
      chunksRef.current = [];
      pausedDurationRef.current = 0;

      const recorder = new MediaRecorder(stream, { mimeType: resolvedMime });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: resolvedMime });
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        onStop?.(blob, finalDuration);
      };

      recorder.onerror = () => {
        setError("Erro durante a gravação.");
        setState("idle");
        stopTimer();
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      setState("recording");
      startTimer();
    } catch (err) {
      setError("Erro ao iniciar gravação.");
      console.error("Recorder start error:", err);
    }
  }, [stream, resolvedMime, onStop, startTimer, stopTimer]);

  const pause = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.pause();
      pausedAtRef.current = Date.now();
      stopTimer();
      setState("paused");
    }
  }, [stopTimer]);

  const resume = useCallback(() => {
    if (recorderRef.current?.state === "paused") {
      pausedDurationRef.current += (Date.now() - pausedAtRef.current) / 1000;
      recorderRef.current.resume();
      startTimer();
      setState("recording");
    }
  }, [startTimer]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    stopTimer();
    setState("idle");
  }, [stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (recorderRef.current?.state !== "inactive") {
        recorderRef.current?.stop();
      }
    };
  }, [stopTimer]);

  return {
    state,
    duration,
    error,
    start,
    pause,
    resume,
    stop,
  };
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? String(h).padStart(2, "0") + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
