"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface MediaDeviceInfo2 {
  deviceId: string;
  label: string;
}

export interface SelectedDevices {
  cameraId: string;
  micId: string;
  speakerId: string;
}

export interface UseMediaDevicesReturn {
  cameras: MediaDeviceInfo2[];
  microphones: MediaDeviceInfo2[];
  speakers: MediaDeviceInfo2[];
  selected: SelectedDevices;
  previewStream: MediaStream | null;
  micLevel: number; // 0–100
  setCamera: (id: string) => void;
  setMic: (id: string) => void;
  setSpeaker: (id: string) => void;
  refreshDevices: () => Promise<void>;
  startPreview: () => Promise<void>;
  stopPreview: () => void;
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [cameras, setCameras] = useState<MediaDeviceInfo2[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo2[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo2[]>([]);
  const [selected, setSelected] = useState<SelectedDevices>({
    cameraId: "",
    micId: "",
    speakerId: "",
  });
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);

  const previewStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ─── List all devices ──────────────────────────────────────
  const refreshDevices = useCallback(async () => {
    // Request permission first so labels are populated
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      probe.getTracks().forEach((t) => t.stop());
    } catch {
      try {
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
        probe.getTracks().forEach((t) => t.stop());
      } catch {}
    }

    const devices = await navigator.mediaDevices.enumerateDevices();

    const cams = devices
      .filter((d) => d.kind === "videoinput")
      .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Câmara ${i + 1}` }));
    const mics = devices
      .filter((d) => d.kind === "audioinput")
      .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microfone ${i + 1}` }));
    const spks = devices
      .filter((d) => d.kind === "audiooutput")
      .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Altifalante ${i + 1}` }));

    setCameras(cams);
    setMicrophones(mics);
    setSpeakers(spks);

    setSelected((prev) => ({
      cameraId: prev.cameraId || cams[0]?.deviceId || "",
      micId: prev.micId || mics[0]?.deviceId || "",
      speakerId: prev.speakerId || spks[0]?.deviceId || "",
    }));
  }, []);

  // ─── Mic level meter ──────────────────────────────────────
  const startMicMeter = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {}
  }, []);

  const stopMicMeter = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    setMicLevel(0);
  }, []);

  // ─── Preview stream ───────────────────────────────────────
  const startPreview = useCallback(async () => {
    // Stop any existing preview
    previewStreamRef.current?.getTracks().forEach((t) => t.stop());
    stopMicMeter();

    const constraints: MediaStreamConstraints = {
      video: selected.cameraId ? { deviceId: { exact: selected.cameraId } } : true,
      audio: selected.micId ? { deviceId: { exact: selected.micId }, echoCancellation: true, noiseSuppression: true } : true,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      previewStreamRef.current = stream;
      setPreviewStream(stream);
      startMicMeter(stream);
    } catch (err) {
      console.warn("Preview failed:", err);
      // Try audio-only fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        previewStreamRef.current = stream;
        setPreviewStream(stream);
        startMicMeter(stream);
      } catch {}
    }
  }, [selected.cameraId, selected.micId, startMicMeter, stopMicMeter]);

  const stopPreview = useCallback(() => {
    previewStreamRef.current?.getTracks().forEach((t) => t.stop());
    previewStreamRef.current = null;
    setPreviewStream(null);
    stopMicMeter();
  }, [stopMicMeter]);

  // ─── Setters — restart preview on device change ───────────
  const setCamera = useCallback((id: string) => {
    setSelected((prev) => ({ ...prev, cameraId: id }));
  }, []);

  const setMic = useCallback((id: string) => {
    setSelected((prev) => ({ ...prev, micId: id }));
  }, []);

  const setSpeaker = useCallback((id: string) => {
    setSelected((prev) => ({ ...prev, speakerId: id }));
  }, []);

  // ─── Re-start preview when selected devices change ────────
  useEffect(() => {
    if (previewStreamRef.current) {
      startPreview();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.cameraId, selected.micId]);

  // ─── Load devices on mount ────────────────────────────────
  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
      stopPreview();
    };
  }, [refreshDevices, stopPreview]);

  return {
    cameras,
    microphones,
    speakers,
    selected,
    previewStream,
    micLevel,
    setCamera,
    setMic,
    setSpeaker,
    refreshDevices,
    startPreview,
    stopPreview,
  };
}
