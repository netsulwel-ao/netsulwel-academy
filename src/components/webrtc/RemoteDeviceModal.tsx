"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";
import {
  X, Smartphone, Loader2, CheckCircle2, Copy, Check,
  Wifi, WifiOff, Video, Mic, RefreshCw, Plus, Trash2,
} from "lucide-react";
import type { User } from "firebase/auth";

interface RemoteDeviceModalProps {
  liveId: string;
  user: User;
  onClose: () => void;
  onUseAsCamera: (sessionId: string, trackName: string) => void;
  onUseAsMic: (sessionId: string, trackName: string) => void;
}

interface DeviceSlot {
  id: string; // local id
  token: string | null;
  deviceUrl: string | null;
  qrDataUrl: string | null;
  status: "generating" | "waiting" | "connected" | "error";
  errorMsg: string;
  remoteDevice: any | null;
  expiresAt: number | null;
  timeLeft: number;
  copied: boolean;
}

function createEmptySlot(): DeviceSlot {
  return {
    id: Math.random().toString(36).slice(2),
    token: null,
    deviceUrl: null,
    qrDataUrl: null,
    status: "generating",
    errorMsg: "",
    remoteDevice: null,
    expiresAt: null,
    timeLeft: 600,
    copied: false,
  };
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

interface SlotViewProps {
  slot: DeviceSlot;
  index: number;
  canRemove: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onUseAsCamera: () => void;
  onUseAsMic: () => void;
  onRevoke: () => void;
  onRemove: () => void;
}

function SlotView({
  slot, index, canRemove,
  onGenerate, onCopy, onUseAsCamera, onUseAsMic, onRevoke, onRemove,
}: SlotViewProps) {
  return (
    <div className="border border-gray-800 bg-gray-950">
      {/* Slot header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          <Smartphone className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300">Dispositivo {index + 1}</span>
          {slot.status === "connected" && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
              <span className="h-1 w-1 rounded-full bg-green-400" />
              LIGADO
            </span>
          )}
          {slot.status === "waiting" && (
            <span className="text-[10px] text-amber-400 font-mono">à espera...</span>
          )}
        </div>
        {canRemove && (
          <button onClick={onRemove} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Generating */}
        {slot.status === "generating" && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
            <span className="text-sm text-gray-400">A gerar link...</span>
          </div>
        )}

        {/* Error */}
        {slot.status === "error" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500 px-3 py-2">
              <WifiOff className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{slot.errorMsg}</p>
            </div>
            <button
              onClick={onGenerate}
              className="w-full py-2 bg-gray-800 text-white text-xs hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Gerar novo link
            </button>
          </div>
        )}

        {/* Waiting */}
        {slot.status === "waiting" && slot.deviceUrl && (
          <div className="space-y-3">
            {slot.qrDataUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slot.qrDataUrl} alt="QR Code" className="w-36 h-36 border border-gray-700" />
              </div>
            )}
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-2.5 py-1.5">
              <p className="text-[11px] text-gray-400 font-mono truncate flex-1 min-w-0">{slot.deviceUrl}</p>
              <button onClick={onCopy} className="shrink-0 p-0.5 text-gray-500 hover:text-white transition-colors">
                {slot.copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>À espera do telemóvel...</span>
              </div>
              <span className={`font-mono font-bold ${slot.timeLeft < 60 ? "text-red-400" : "text-gray-400"}`}>
                {fmtTime(slot.timeLeft)}
              </span>
            </div>
          </div>
        )}

        {/* Connected */}
        {slot.status === "connected" && slot.remoteDevice && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Wifi className="h-3.5 w-3.5 text-green-400" />
              <span>{slot.remoteDevice.facingMode === "environment" ? "Câmara traseira" : "Câmara frontal"} · A transmitir</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {slot.remoteDevice.videoTrackName && (
                <button
                  onClick={onUseAsCamera}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 transition-colors text-left"
                >
                  <Video className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">Câmara</p>
                    <p className="text-[10px] text-gray-500 truncate">Usar como vídeo</p>
                  </div>
                </button>
              )}
              {slot.remoteDevice.audioTrackName && (
                <button
                  onClick={onUseAsMic}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 transition-colors text-left"
                >
                  <Mic className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">Microfone</p>
                    <p className="text-[10px] text-gray-500 truncate">Usar como áudio</p>
                  </div>
                </button>
              )}
            </div>
            <button onClick={onRevoke} className="w-full pt-1 text-[11px] text-gray-600 hover:text-red-400 transition-colors text-left">
              Desligar este dispositivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function RemoteDeviceModal({
  liveId, user, onClose, onUseAsCamera, onUseAsMic,
}: RemoteDeviceModalProps) {
  const [slots, setSlots] = useState<DeviceSlot[]>([createEmptySlot()]);
  const unsubsRef = useRef<Map<string, () => void>>(new Map());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const updateSlot = useCallback((id: string, patch: Partial<DeviceSlot>) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const generateToken = useCallback(async (slotId: string) => {
    updateSlot(slotId, { status: "generating", token: null, deviceUrl: null, qrDataUrl: null, remoteDevice: null });
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/remote-device", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ action: "create", liveId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const url = `${window.location.origin}/studio/remote/${data.token}`;
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&bgcolor=111827&color=ffffff&margin=8`;
      const expiresAt = data.expiresAt;

      updateSlot(slotId, {
        token: data.token,
        deviceUrl: url,
        qrDataUrl: qr,
        expiresAt,
        timeLeft: Math.floor((expiresAt - Date.now()) / 1000),
        status: "waiting",
      });

      // Start countdown
      const timer = setInterval(() => {
        setSlots(prev => prev.map(s => {
          if (s.id !== slotId || !s.expiresAt) return s;
          const remaining = Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000));
          if (remaining === 0 && s.status === "waiting") {
            clearInterval(timersRef.current.get(slotId));
            return { ...s, timeLeft: 0, status: "error", errorMsg: "Link expirado. Gera um novo." };
          }
          return { ...s, timeLeft: remaining };
        }));
      }, 1000);
      timersRef.current.set(slotId, timer);

      // Watch Firestore
      const unsub = onSnapshot(doc(db, "lives", liveId, "remoteDevices", data.token), (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        setSlots(prev => prev.map(s => {
          if (s.id !== slotId) return s;
          const connected = d.status === "live" || d.status === "connected";
          return { ...s, remoteDevice: d, status: connected ? "connected" : s.status };
        }));
      });
      unsubsRef.current.set(slotId, unsub);

    } catch (err: any) {
      updateSlot(slotId, { status: "error", errorMsg: err.message || "Erro ao gerar link." });
    }
  }, [liveId, user, updateSlot]);

  // Generate token for initial slot on mount
  useEffect(() => {
    const firstId = slots[0].id;
    generateToken(firstId);
    return () => {
      unsubsRef.current.forEach(u => u());
      timersRef.current.forEach(t => clearInterval(t));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSlot = useCallback(() => {
    setSlots(prev => {
      if (prev.length >= 2) return prev;
      const newSlot = createEmptySlot();
      // Schedule token generation after state update
      setTimeout(() => generateToken(newSlot.id), 0);
      return [...prev, newSlot];
    });
  }, [generateToken]);

  const removeSlot = useCallback(async (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot?.token) {
      try {
        const idToken = await user.getIdToken();
        await fetch(`/api/remote-device?liveId=${liveId}&token=${slot.token}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` },
        });
      } catch {}
    }
    unsubsRef.current.get(slotId)?.();
    unsubsRef.current.delete(slotId);
    clearInterval(timersRef.current.get(slotId));
    timersRef.current.delete(slotId);
    setSlots(prev => prev.filter(s => s.id !== slotId));
  }, [slots, liveId, user]);

  const copyLink = useCallback((slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot?.deviceUrl) return;
    navigator.clipboard.writeText(slot.deviceUrl);
    updateSlot(slotId, { copied: true });
    setTimeout(() => updateSlot(slotId, { copied: false }), 2000);
  }, [slots, updateSlot]);

  const revokeDevice = useCallback(async (slotId: string) => {
    await removeSlot(slotId);
  }, [removeSlot]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4">
      <div className="bg-gray-900 border border-gray-800 w-full sm:max-w-md shadow-2xl max-h-[90dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Smartphone className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Dispositivos remotos</h2>
            <span className="text-[11px] text-gray-500 font-mono">{slots.length}/2</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs text-gray-500">
            Liga até 2 dispositivos como câmara ou microfone remoto. Cada dispositivo pode ser usado para vídeo ou áudio.
          </p>

          {slots.map((slot, index) => (
            <SlotView
              key={slot.id}
              slot={slot}
              index={index}
              canRemove={slots.length > 1}
              onGenerate={() => generateToken(slot.id)}
              onCopy={() => copyLink(slot.id)}
              onUseAsCamera={() => {
                onUseAsCamera(slot.remoteDevice.sessionId, slot.remoteDevice.videoTrackName);
                onClose();
              }}
              onUseAsMic={() => {
                onUseAsMic(slot.remoteDevice.sessionId, slot.remoteDevice.audioTrackName);
                onClose();
              }}
              onRevoke={() => revokeDevice(slot.id)}
              onRemove={() => removeSlot(slot.id)}
            />
          ))}

          {/* Add second device — only show when first slot is connected */}
          {slots.length < 2 && slots[0]?.status === "connected" && (
            <button
              onClick={addSlot}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-700 py-3 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ligar segundo dispositivo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
